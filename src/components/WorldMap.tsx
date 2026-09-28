import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { select, type Selection } from "d3-selection";
import { transition, type Transition } from "d3-transition";
import { geoEqualEarth, geoPath, geoGraticule10 } from "d3-geo";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { feature } from "topojson-client";
import { countryByNumeric, type CountryEntry, type EntryCategory } from "@/data/countries";
import { categoryMeta } from "@/lib/entry";

export interface WorldMapHandle {
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToCountry: (c: CountryEntry) => void;
}

interface WorldMapProps {
  selectedCode: string | null;
  activeFilter: EntryCategory | null;
  onSelect: (c: CountryEntry | null) => void;
}

interface PathDatum {
  id: string;
  d: string;
  cx: number;
  cy: number;
  area: number;
  entry: CountryEntry | null;
}

const ZOOM_MS = 450;

export const WorldMap = forwardRef<WorldMapHandle, WorldMapProps>(function WorldMap(
  { selectedCode, activeFilter, onSelect },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ReturnType<typeof zoom<SVGSVGElement, unknown>> | null>(null);
  const pathsRef = useRef<PathDatum[]>([]);
  const [paths, setPaths] = useState<PathDatum[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [topo, setTopo] = useState<unknown>(null);
  const pointerDown = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  // Load real geographic boundaries once.
  useEffect(() => {
    let cancelled = false;
    fetch("/data/world-50m.json")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setTopo(json);
      })
      .catch(() => setTopo(null));
    return () => {
      cancelled = true;
    };
  }, []);

  // Observe container size.
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build projected paths whenever topology or size changes.
  useEffect(() => {
    if (!topo || size.w < 50 || size.h < 50) return;
    const proj = makeProjection(size);
    const pathGen = geoPath(proj);
    const fc = feature(
      topo as never,
      (topo as unknown as { objects: { countries: never } }).objects.countries,
    ) as unknown as { features: Array<{ id?: string | number }> };
    const data: PathDatum[] = fc.features
      .map((f) => {
        const d = pathGen(f as never);
        if (!d) return null;
        const c = pathGen.centroid(f as never);
        return {
          id: String(f.id ?? ""),
          d,
          cx: c[0] ?? 0,
          cy: c[1] ?? 0,
          area: Math.abs(pathGen.area(f as never)),
          entry: countryByNumeric.get(String(f.id ?? "")) ?? null,
        };
      })
      .filter((p): p is PathDatum => p !== null);
    pathsRef.current = data;
    setPaths(data);
    setGraticuleD(pathGen(geoGraticule10()) ?? "");
    setSphereD(pathGen({ type: "Sphere" } as never) ?? "");
  }, [topo, size]);

  // Attach d3-zoom (pan, wheel, pinch) once.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const g = select(svg).select<SVGGElement>("#map-zoom-layer");
    const labels = select(svg).select<SVGGElement>("#map-labels");
    const zb = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 36])
      .on("zoom", (event) => {
        const t = event.transform;
        g.attr("transform", t.toString());
        applyLabelTransforms(labels, pathsRef.current, t);
      })
      .on("end", () => {
        // Visibility of labels recomputed once a gesture settles.
        applyLabelTransforms(labels, pathsRef.current, currentTransform());
      });
    zoomRef.current = zb;
    select(svg)
      .call(zb)
      .on("dblclick.zoom", null)
      .on("dblclick", (event: MouseEvent) => {
        const [x, y] = d3Pointer(event, svg);
        zoomToPoint(select(svg), zb, x, y, 1.9);
      });
    return () => {
      select(svg).on(".zoom", null).on("dblclick", null);
    };
  }, [paths.length > 0]);

  // Double-tap zoom (touch).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const now = Date.now();
      const prev = lastTap.current;
      if (prev && now - prev.t < 320 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 40) {
        const rect = svg.getBoundingClientRect();
        zoomToPoint(select(svg), zoomRef.current!, e.clientX - rect.left, e.clientY - rect.top, 1.9);
        lastTap.current = null;
      } else {
        lastTap.current = { t: now, x: e.clientX, y: e.clientY };
      }
    };
    svg.addEventListener("pointerup", onPointerUp);
    return () => svg.removeEventListener("pointerup", onPointerUp);
  }, [paths.length > 0]);

  const currentTransform = (): ZoomTransform => {
    const svg = svgRef.current as (SVGSVGElement & { __zoom?: ZoomTransform }) | null;
    return svg?.__zoom ?? zoomIdentity;
  };

  const transitioned = (make: (t: ZoomTransform, w: number, h: number) => ZoomTransform) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    const { w, h } = size;
    const next = make(currentTransform(), w, h);
    (select(svg).transition().duration(ZOOM_MS) as Transition<SVGSVGElement, unknown, null, undefined>).call(
      zoomRef.current.transform,
      next,
    );
  };

  useImperativeHandle(ref, () => ({
    resetView: () => transitioned(() => zoomIdentity),
    zoomIn: () => transitioned((t, w, h) => zoomAround(t, w / 2, h / 2, 1.5)),
    zoomOut: () => transitioned((t, w, h) => zoomAround(t, w / 2, h / 2, 1 / 1.5)),
    zoomToCountry: (c) => {
      const p = pathsRef.current.find((d) => d.entry?.code === c.code);
      if (!p) {
        if (c.lat != null && c.lng != null) {
          const topo = (window as unknown as { __worldTopo?: unknown }).__worldTopo;
          if (topo) {
            transitioned((t, w, h) => {
              const proj = geoEqualEarth();
              proj.fitExtent([[0, 0], [w, h]], { type: "Sphere" } as never);
              const [x, y] = proj([c.lng, c.lat] as never) ?? [w / 2, h / 2];
              return zoomAround(zoomIdentity, x, y, 9);
            });
          }
        }
        return;
      }
      transitioned((t, w, h) => {
        const k = Math.max(1.6, Math.min(14, Math.sqrt((w * h) / Math.max(p.area, 4)) * 0.5));
        return zoomAround(zoomIdentity, p.cx, p.cy, k);
      });
    },
  }));

  // Suppress country selection after a drag gesture.
  const wasDrag = (e: React.MouseEvent) => {
    const d = pointerDown.current;
    if (!d) return false;
    return Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8;
  };

  const [graticuleD, setGraticuleD] = useState("");
  const [sphereD, setSphereD] = useState("");

  return (
    <svg
      ref={svgRef}
      width={size.w}
      height={size.h}
      className="block h-full w-full touch-none select-none"
      role="application"
      aria-label="Interactive world map of entry requirements for Colombian passport holders"
      onPointerDown={(e) => {
        pointerDown.current = { x: e.clientX, y: e.clientY, t: Date.now() };
      }}
    >
      <defs>
        <radialGradient id="ocean-glow" cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor="var(--ocean)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--background)" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width={size.w} height={size.h} fill="url(#ocean-glow)" />
      <g id="map-zoom-layer">
        <path d={sphereD} fill="none" stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={graticuleD} fill="none" stroke="oklch(1 0 0 / 4%)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        {paths.map((p) => {
          const entry = p.entry;
          const cat = entry ? categoryMeta(entry) : null;
          const dimmed = activeFilter != null && entry != null && entry.category !== activeFilter;
          const selected = entry?.code === selectedCode;
          const fill = cat ? `var(${cat.colorVar})` : "var(--land)";
          return (
            <path
              key={p.id + p.d.slice(0, 12)}
              d={p.d}
              fill={fill}
              fillOpacity={entry ? (dimmed ? 0.13 : 0.82) : 0.9}
              stroke={selected ? "var(--beacon)" : "oklch(1 0 0 / 14%)"}
              strokeWidth={selected ? 1.8 : 0.5}
              vectorEffect="non-scaling-stroke"
              className="country-path"
              tabIndex={entry ? -1 : undefined}
              onClick={(e) => {
                if (wasDrag(e)) return;
                onSelect(entry ?? null);
              }}
            >
              {entry && (
                <title>{`${entry.flag} ${entry.name} — ${cat?.label}`}</title>
              )}
            </path>
          );
        })}
      </g>
      <g id="map-labels" style={{ pointerEvents: "none" }}>
        {visibleLabels(paths, currentTransform())}
      </g>
    </svg>
  );
});

// --- helpers -------------------------------------------------------------

function d3Pointer(event: MouseEvent, svg: SVGSVGElement): [number, number] {
  const rect = svg.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top];
}

function zoomAround(t: ZoomTransform, x: number, y: number, kFactor: number): ZoomTransform {
  const k = Math.max(1, Math.min(36, t.k * kFactor));
  return zoomIdentity
    .translate(x, y)
    .scale(k)
    .translate(-x, -y)
    .translate(t.x, t.y);
}

function zoomToPoint(
  svgSel: Selection<SVGSVGElement, unknown, null, undefined>,
  zb: ReturnType<typeof zoom<SVGSVGElement, unknown>>,
  x: number,
  y: number,
  factor: number,
) {
  (svgSel.transition().duration(ZOOM_MS) as Transition<SVGSVGElement, unknown, null, undefined>).call(
    zb.scaleBy,
    factor,
    [x, y],
  );
}

// Keep screen-fixed label size by counter-scaling inside the zoom layer clone.
function applyLabelTransforms(
  labels: Selection<SVGGElement, unknown, null, undefined>,
  paths: PathDatum[],
  t: ZoomTransform,
) {
  labels
    .selectAll<SVGTextElement, PathDatum>("text")
    .attr("transform", (d) => `translate(${d.cx * t.k + t.x}, ${d.cy * t.k + t.y})`);
}

function makeProjection(size: { w: number; h: number }) {
  const proj = geoEqualEarth();
  proj.fitExtent(
    [
      [size.w * 0.015, size.h * 0.05],
      [size.w * 0.985, size.h * 0.95],
    ],
    { type: "Sphere" } as never,
  );
  return proj;
}

// Progressively reveal labels: top 18 large countries always, smaller ones as
// their on-screen area grows with zoom.
function visibleLabels(paths: PathDatum[], t: ZoomTransform) {
  const k = t.k;
  const ranked = [...paths]
    .filter((p) => p.entry && p.area > 0 && Number.isFinite(p.cx) && Number.isFinite(p.cy))
    .sort((a, b) => b.area - a.area);
  const out: PathDatum[] = [];
  ranked.forEach((p, rank) => {
    const screenArea = p.area * k * k;
    const always = rank < 18;
    if (screenArea >= 220 || always) out.push(p);
  });
  const cap = Math.min(110, Math.round(16 + k * 9));
  return out.slice(0, cap).map((p) => (
    <text
      key={p.id}
      transform={`translate(${p.cx * t.k + t.x}, ${p.cy * t.k + t.y})`}
      textAnchor="middle"
      className="font-sans"
      fontSize={10.5}
      fontWeight={500}
      fill="oklch(0.97 0.008 90 / 88%)"
      stroke="oklch(0.15 0.014 255 / 80%)"
      strokeWidth={2.4}
      paintOrder="stroke"
      style={{ letterSpacing: "0.04em", textTransform: "uppercase" }}
    >
      {p.entry!.name}
    </text>
  ));
}
