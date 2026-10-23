import { isHomeCountry } from "@/lib/entry";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { countryByNumeric, COUNTRIES, type CountryEntry } from "@/data/countries";
import { CATEGORIES } from "@/lib/entry";
import { filterByKey, type FilterKey } from "@/lib/filters";
import { useLang } from "@/lib/i18n";
import { matchesVibe, type VibeKey } from "@/lib/vibes";

export interface CompatibleGlobeHandle {
  resetView: () => void;
  flyTo: (country: CountryEntry) => void;
}

interface Props {
  selectedCode: string | null;
  filter: FilterKey;
  vibe?: VibeKey | null;
  onSelect: (country: CountryEntry | null) => void;
}

type WorldFeature = GeoJSON.Feature<GeoJSON.Geometry, { code?: string; category?: string }>;

const HOME_ROTATION: [number, number] = [40, -12];

export const CompatibleGlobeMap = forwardRef<CompatibleGlobeHandle, Props>(function CompatibleGlobeMap(
  { selectedCode, filter, vibe = null, onSelect },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; rotation: [number, number] } | null>(null);
  const { t, name } = useLang();
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [features, setFeatures] = useState<WorldFeature[]>([]);
  const [rotation, setRotation] = useState<[number, number]>(HOME_ROTATION);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    fetch("/data/world-50m.json")
      .then((response) => response.json())
      .then((topology) => {
        if (disposed) return;
        const collection = feature(topology, topology.objects.countries) as unknown as GeoJSON.FeatureCollection;
        const mapped = collection.features
          .filter((item) => String(item.id) !== "010")
          .map((item) => {
            const country = countryByNumeric.get(String(item.id ?? ""));
            return {
              ...item,
              properties: { code: country?.code ?? "", category: country?.category ?? "none" },
            } as WorldFeature;
          });
        setFeatures(mapped);
      })
      .catch(() => setFeatures([]));
    return () => {
      disposed = true;
    };
  }, []);

  const projection = useMemo(() => {
    const radius = Math.min(size.width, size.height) * 0.42 * zoom;
    return geoOrthographic()
      .translate([size.width / 2, size.height / 2])
      .scale(radius)
      .rotate(rotation)
      .clipAngle(90)
      .precision(0.3);
  }, [rotation, size, zoom]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const activeTest = filterByKey.get(filter)?.test ?? (() => true);

  useImperativeHandle(ref, () => ({
    resetView: () => {
      setRotation(HOME_ROTATION);
      setZoom(1);
    },
    flyTo: (country) => {
      if (country.lng == null || country.lat == null) return;
      setRotation([-country.lng, -country.lat]);
      setZoom(1.65);
    },
  }));

  const visibleLabels = useMemo(() => {
    if (zoom < 1.35) return [];
    return COUNTRIES.filter((country) => {
      if (country.lat == null || country.lng == null) return false;
      const point = projection([country.lng, country.lat]);
      if (!point) return false;
      const center = projection.invert?.([size.width / 2, size.height / 2]);
      if (!center) return false;
      const deltaLng = ((country.lng - center[0] + 540) % 360) - 180;
      return Math.abs(deltaLng) < 72 && Math.abs(country.lat - center[1]) < 62;
    }).slice(0, 42);
  }, [projection, size, zoom]);

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; zoom: number; mx: number; my: number; rotation: [number, number] } | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;

  // (Re)anchor the gesture whenever the number of fingers changes, so nothing jumps.
  const startGesture = () => {
    const pts = [...pointersRef.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      if (!a || !b) return;
      dragRef.current = null;
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        zoom: zoomRef.current,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
        rotation: rotationRef.current,
      };
    } else if (pts.length === 1 && pts[0]) {
      pinchRef.current = null;
      dragRef.current = { x: pts[0].x, y: pts[0].y, rotation: rotationRef.current };
    } else {
      pinchRef.current = null;
      dragRef.current = null;
    }
  };
  const endPointer = (id: number) => {
    pointersRef.current.delete(id);
    startGesture();
  };

  // Native non-passive wheel listener so trackpad pinch (ctrlKey) and scroll don't zoom/scroll the page.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      const intensity = event.ctrlKey ? 0.01 : 0.0015;
      setZoom((value) => Math.min(3.2, Math.max(0.8, value * Math.exp(-dy * intensity))));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none overflow-hidden"
      role="application"
      aria-label={t("Interactive globe of entry requirements for Colombian passport holders")}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        startGesture();
      }}
      onPointerMove={(event) => {
        const pts = pointersRef.current;
        if (!pts.has(event.pointerId)) return;
        pts.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const pinch = pinchRef.current;
        if (pinch && pts.size >= 2) {
          const [a, b] = [...pts.values()];
          if (!a || !b) return;
          const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
          const nextZoom = Math.min(3.2, Math.max(0.8, pinch.zoom * (dist / pinch.dist)));
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const sensitivity = 0.28 / nextZoom;
          setZoom(nextZoom);
          setRotation([
            pinch.rotation[0] + (mx - pinch.mx) * sensitivity,
            Math.max(-75, Math.min(75, pinch.rotation[1] - (my - pinch.my) * sensitivity)),
          ]);
          return;
        }
        const drag = dragRef.current;
        if (!drag) return;
        const sensitivity = 0.28 / zoomRef.current;
        setRotation([
          drag.rotation[0] + (event.clientX - drag.x) * sensitivity,
          Math.max(-75, Math.min(75, drag.rotation[1] - (event.clientY - drag.y) * sensitivity)),
        ]);
      }}
      onPointerUp={(event) => endPointer(event.pointerId)}
      onPointerCancel={(event) => endPointer(event.pointerId)}
    >
      <svg className="size-full" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
        <defs>
          <radialGradient id="compatible-ocean" cx="38%" cy="30%" r="68%">
            <stop offset="0" stopColor="var(--muted)" />
            <stop offset="1" stopColor="var(--ocean)" />
          </radialGradient>
          <filter id="compatible-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle
          cx={size.width / 2}
          cy={size.height / 2}
          r={Math.min(size.width, size.height) * 0.42 * zoom}
          fill="url(#compatible-ocean)"
          stroke="var(--border)"
          strokeWidth="1.5"
          filter="url(#compatible-glow)"
        />
        {features.map((item, index) => {
          const code = item.properties.code ?? "";
          const country = code ? COUNTRIES.find((entry) => entry.code === code) : undefined;
          const selected = code !== "" && code === selectedCode;
          const dimmed = (filter !== "all" || vibe != null) && (!country || !activeTest(country) || !matchesVibe(country, vibe));
          const category = country?.category;
          const d = path(item);
          if (!d) return null;
          return (
            <path
              key={`${code}-${index}`}
              d={d}
              fill={country && isHomeCountry(country) ? "var(--beacon)" : category ? `var(${CATEGORIES[category].colorVar})` : "var(--land)"}
              fillOpacity={selected ? 0.9 : dimmed ? 0.08 : category ? 0.62 : 0.45}
              stroke={selected ? "var(--foreground)" : "var(--background)"}
              strokeOpacity={selected ? 0.95 : 0.8}
              strokeWidth={selected ? 1.8 : 0.55}
              className={country ? "country-path" : undefined}
              onClick={(event) => {
                event.stopPropagation();
                if (country) onSelect(country);
              }}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {visibleLabels.map((country) => {
          if (country.lng == null || country.lat == null) return null;
          const point = projection([country.lng, country.lat]);
          if (!point) return null;
          return (
            <span
              key={country.code}
              className="mono absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 text-foreground/65"
              style={{ left: point[0], top: point[1], textShadow: "0 1px 5px var(--background)" }}
            >
              <span className={`fi fi-${country.code.toLowerCase()} text-[11px]`} />
              {country.iso3}
            </span>
          );
        })}
      </div>
    </div>
  );
});