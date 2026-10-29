import { isHomeCountry } from "@/lib/entry";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Map as MLMap, MapGeoJSONFeature } from "maplibre-gl";
import { feature } from "topojson-client";
import { countryByNumeric, COUNTRIES, type CountryEntry } from "@/data/countries";
import { CATEGORIES, categoryMeta } from "@/lib/entry";
import { filterByKey, type FilterKey } from "@/lib/filters";
import { CompatibleGlobeMap, type CompatibleGlobeHandle } from "@/components/CompatibleGlobeMap";
import { useLang } from "@/lib/i18n";
import { useVisaCountries } from "@/lib/use-visa-countries";
import { matchesVibe, type VibeKey } from "@/lib/vibes";

export interface GlobeHandle {
  resetView: () => void;
  flyTo: (c: CountryEntry) => void;
}

interface Props {
  selectedCode: string | null;
  filter: FilterKey;
  vibe?: VibeKey | null;
  onSelect: (c: CountryEntry | null) => void;
}

const HOME = { center: [-40, 12] as [number, number], zoom: 1.35 };

// Resolve CSS variables to concrete colors for WebGL paint properties.
function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#2c2c35";
}

interface Label {
  code: string;
  iso3: string;
  name: string;
  lng: number;
  lat: number;
  color: string;
  rank: number;
}

export const GlobeMap = forwardRef<GlobeHandle, Props>(function GlobeMap(
  { selectedCode, filter, vibe, onSelect },
  ref,
) {
  const countries = useVisaCountries();
  const el = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<CompatibleGlobeHandle>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const { t, name } = useLang();
  const [labels, setLabels] = useState<
    Array<Label & { x: number; y: number; mode: "code" | "name" }>
  >([]);
  const [hover, setHover] = useState<{ x: number; y: number; c: CountryEntry } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const labelData = useRef<Label[]>([]);
  const reduced = useRef(false);

  useEffect(() => {
    let disposed = false;
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isAppleMobile = /iP(?:ad|hone|od)/i.test(navigator.userAgent);
    const isDesktopSafari =
      /AppleWebKit/i.test(navigator.userAgent) &&
      !/(Chrome|Chromium|Edg|OPR)/i.test(navigator.userAgent);
    const isWebKit = isAppleMobile || isDesktopSafari;
    if (isWebKit) {
      setUseFallback(true);
      return () => {
        disposed = true;
      };
    }
    (async () => {
      const [maplibregl, workerUrl, topo] = await Promise.all([
        import("maplibre-gl"),
        // ?worker&url bundles the worker with its shared chunk so production never 404s.
        import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url").then(
          (m) => m.default as string,
        ),
        fetch("/data/world-50m.json").then((r) => r.json()),
      ]);
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (disposed || !el.current) return;
      maplibregl.setWorkerUrl(workerUrl);

      const fc = feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection;
      fc.features = fc.features.filter((f) => String(f.id) !== "010"); // Antarctica draws a seam on the globe
      fc.features.forEach((f, i) => {
        const entry =
          f.properties?.["name"] === "Kosovo"
            ? COUNTRIES.find((c) => c.code === "XK")
            : countryByNumeric.get(String(f.id ?? ""));
        f.id = i + 1;
        f.properties = {
          code: entry?.code ?? "",
          cat: entry ? (isHomeCountry(entry) ? "home" : entry.category) : "none",
        };
      });

      const colors: Record<string, string> = {
        ...Object.fromEntries(Object.values(CATEGORIES).map((m) => [m.key, cssVar(m.colorVar)])),
        home: "#e8c25a",
      };
      labelData.current = COUNTRIES.filter((c) => c.lat != null && c.lng != null).map((c, i) => ({
        code: c.code,
        iso3: c.iso3,
        name: c.name,
        lng: c.lng ?? 0,
        lat: c.lat ?? 0,
        color: (isHomeCountry(c) ? colors["home"] : colors[c.category]) ?? "#fff",
        rank: i,
      }));

      const map = new maplibregl.Map({
        container: el.current,
        style: {
          version: 8,
          projection: { type: "globe" },
          sources: {},
          layers: [
            { id: "bg", type: "background", paint: { "background-color": cssVar("--background") } },
          ],
          sky: {
            "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.6, 5, 0.2, 7, 0],
            "sky-color": "#08080a",
            "horizon-color": "#1c1c21",
            "fog-color": "#0d0d10",
          },
        } as never,
        center: HOME.center,
        zoom: HOME.zoom,
        minZoom: 0.8,
        maxZoom: 8,
        attributionControl: false,
        renderWorldCopies: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;

      // Watchdog: if the 3D globe never finishes loading (worker/WebGL failure), use the SVG globe.
      let loaded = false;
      const watchdog = window.setTimeout(() => {
        if (!loaded && !disposed) setUseFallback(true);
      }, 4000);
      map.on("error", (e) => {
        const msg = String((e as unknown as { error?: Error }).error?.message ?? "");
        if (!loaded && !disposed && /worker|webgl|shader/i.test(msg)) setUseFallback(true);
      });

      map.on("load", () => {
        loaded = true;
        window.clearTimeout(watchdog);
        map.addSource("countries", { type: "geojson", data: fc });
        const catColor = [
          "match",
          ["coalesce", ["feature-state", "cat"], ["get", "cat"]],
          ...Object.entries(colors).flat(),
          cssVar("--land"),
        ] as never;
        map.addLayer({
          id: "fill",
          type: "fill",
          source: "countries",
          paint: {
            "fill-color": catColor,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.82,
              ["boolean", ["feature-state", "dim"], false],
              0.07,
              ["boolean", ["feature-state", "hover"], false],
              0.78,
              ["==", ["coalesce", ["feature-state", "cat"], ["get", "cat"]], "none"],
              0.5,
              0.55,
            ],
            "fill-opacity-transition": { duration: 350 },
          },
        });
        map.addLayer({
          id: "line",
          type: "line",
          source: "countries",
          paint: {
            "line-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "rgba(255,255,255,0.95)",
              ["boolean", ["feature-state", "hover"], false],
              "rgba(255,255,255,0.55)",
              "rgba(8,8,10,0.85)",
            ],
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 1.6, 0.5],
          },
        });
        map.addLayer({
          id: "glow",
          type: "line",
          source: "countries",
          paint: {
            "line-color": catColor,
            "line-blur": 6,
            "line-width": 10,
            "line-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.45, 0],
          },
        });
        (map as unknown as { __fc: GeoJSON.FeatureCollection }).__fc = fc;
        if (!disposed) setReady(true);
        updateLabels();
        // Some browsers/GPUs render only the atmosphere and drop the country
        // layers. Verify the fill layer actually produced pixels; otherwise
        // switch to the SVG globe.
        map.once("idle", () => {
          if (disposed) return;
          const { width, height } = map.getContainer().getBoundingClientRect();
          const rendered = map.queryRenderedFeatures(
            [
              [width * 0.25, height * 0.25],
              [width * 0.75, height * 0.75],
            ],
            { layers: ["fill"] },
          );
          if (rendered.length === 0) setUseFallback(true);
        });
      });

      let hoverId: number | null = null;
      const setHoverId = (id: number | null) => {
        if (hoverId != null)
          map.setFeatureState({ source: "countries", id: hoverId }, { hover: false });
        hoverId = id;
        if (id != null) map.setFeatureState({ source: "countries", id }, { hover: true });
      };
      const entryOf = (f?: MapGeoJSONFeature) =>
        f
          ? (COUNTRIES.find((c) => c.code === (f.properties as { code?: string }).code) ?? null)
          : null;

      map.on(
        "mousemove",
        "fill",
        (e: { features?: MapGeoJSONFeature[]; point: { x: number; y: number } }) => {
          const f = e.features?.[0];
          const c = entryOf(f);
          setHoverId(c ? (f?.id as number) : null);
          map.getCanvas().style.cursor = c ? "pointer" : "";
          setHover(c ? { x: e.point.x, y: e.point.y, c } : null);
        },
      );
      map.on("mouseleave", "fill", () => {
        setHoverId(null);
        setHover(null);
        map.getCanvas().style.cursor = "";
      });
      map.on(
        "click",
        (e: {
          point: Parameters<MLMap["project"]>[0] extends never
            ? never
            : import("maplibre-gl").Point;
        }) => {
          const f = map.queryRenderedFeatures(e.point, { layers: ["fill"] })[0];
          onSelectRef.current(entryOf(f));
        },
      );

      const updateLabels = () => {
        const z = map.getZoom();
        if (z < 3) {
          setLabels([]);
          return;
        }
        const mode = z >= 3.5 ? "name" : "code";
        const c = map.getCenter();
        const { width, height } = map.getContainer().getBoundingClientRect();
        const boxes: Array<[number, number, number, number]> = [];
        const out: Array<Label & { x: number; y: number; mode: "code" | "name" }> = [];
        for (const l of labelData.current) {
          // Skip the far side of the globe.
          const dLng = ((l.lng - c.lng + 540) % 360) - 180;
          if (Math.abs(dLng) > 80 || Math.abs(l.lat - c.lat) > 70) continue;
          const p = map.project([l.lng, l.lat]);
          if (p.x < 0 || p.y < 0 || p.x > width || p.y > height) continue;
          const w = mode === "name" ? l.name.length * 6.6 + 16 : 62;
          const box: [number, number, number, number] = [
            p.x - w / 2,
            p.y - 10,
            p.x + w / 2,
            p.y + 10,
          ];
          if (
            boxes.some((b) => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))
          )
            continue;
          boxes.push(box);
          out.push({ ...l, x: p.x, y: p.y, mode });
          if (out.length > 60) break;
        }
        setLabels(out);
      };
      map.on("moveend", updateLabels);
      map.on("move", () => {
        if (map.getZoom() >= 3) updateLabels();
        else setLabels((l) => (l.length ? [] : l));
      });
    })();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Labels ranked by country size proxy: bigger countries first (dataset order is alphabetical).
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current as unknown as { __fc: GeoJSON.FeatureCollection } | null;
    if (!map) return;
    const area = new Map<string, number>();
    for (const f of map.__fc.features) {
      const code = (f.properties as { code: string }).code;
      area.set(code, JSON.stringify(f.geometry).length);
    }
    labelData.current.sort((a, b) => (area.get(b.code) ?? 0) - (area.get(a.code) ?? 0));
  }, [ready]);

  // Feature-state: selection + filter dimming.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const fc = (map as unknown as { __fc: GeoJSON.FeatureCollection }).__fc;
    const test = filterByKey.get(filter)?.test ?? (() => true);
    for (const f of fc.features) {
      const code = (f.properties as { code: string }).code;
      const entry = code ? countries.find((c) => c.code === code) : undefined;
      map.setFeatureState(
        { source: "countries", id: f.id as number },
        {
          cat: entry ? (isHomeCountry(entry) ? "home" : entry.category) : "none",
          selected: code !== "" && code === selectedCode,
          dim:
            (filter !== "all" || vibe != null) &&
            (!entry || !test(entry) || !matchesVibe(entry, vibe ?? null)),
        },
      );
    }
  }, [ready, selectedCode, filter, vibe, countries]);

  useImperativeHandle(
    ref,
    () => ({
      resetView: () => {
        if (useFallback) {
          fallbackRef.current?.resetView();
          return;
        }
        mapRef.current?.flyTo({ ...HOME, duration: reduced.current ? 0 : 1600, essential: true });
      },
      flyTo: (c) => {
        if (useFallback) {
          fallbackRef.current?.flyTo(c);
          return;
        }
        const map = mapRef.current;
        if (!map || c.lat == null || c.lng == null) return;
        const mobile = window.innerWidth < 1024;
        map.flyTo({
          center: [c.lng, c.lat],
          zoom: 3.2,
          duration: reduced.current ? 0 : 1800,
          curve: 1.5,
          padding: mobile
            ? { top: 0, bottom: window.innerHeight * 0.4, left: 0, right: 0 }
            : { right: 420, top: 0, bottom: 0, left: 0 },
          essential: true,
        });
      },
    }),
    [useFallback],
  );

  if (useFallback) {
    return (
      <CompatibleGlobeMap
        ref={fallbackRef}
        selectedCode={selectedCode}
        filter={filter}
        vibe={vibe ?? null}
        onSelect={onSelect}
      />
    );
  }

  return (
    <div className="absolute inset-0">
      <div
        ref={el}
        className="inset-0"
        style={{ position: "absolute", inset: 0 }}
        role="application"
        aria-label={t("Interactive passport-aware travel globe")}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {labels.map((l) => (
          <div
            key={l.code}
            className="fade-in absolute flex items-center gap-1.5 whitespace-nowrap"
            style={{
              transform: `translate(${l.x}px, ${l.y}px) translate(-50%, -50%)`,
              left: 0,
              top: 0,
            }}
          >
            {l.mode === "code" ? (
              <span
                className={`fi fi-${l.code.toLowerCase()} shrink-0 text-[12px] leading-none`}
                role="img"
                aria-label={`${name(l)} flag`}
              />
            ) : (
              <span
                className="size-1 rounded-full"
                style={{
                  background: `var(${categoryMeta(countries.find((c) => c.code === l.code) ?? (COUNTRIES[0] as CountryEntry)).colorVar})`,
                }}
              />
            )}
            <span
              className={
                l.mode === "code"
                  ? "mono text-[9.5px] text-foreground/60"
                  : "text-[11px] font-medium text-foreground/80"
              }
              style={{ textShadow: "0 1px 6px var(--background), 0 0 2px var(--background)" }}
            >
              {l.mode === "code" ? l.iso3 : name(l)}
            </span>
          </div>
        ))}
      </div>
      {hover && (
        <div
          className="map-overlay pointer-events-none absolute z-20 hidden rounded-xl px-3 py-2 md:block"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <p className="text-[13px] font-medium text-foreground">
            {hover.c.flag} {name(hover.c)}
          </p>
          <p
            className="mono mt-0.5"
            style={{
              color: `var(${categoryMeta(countries.find((c) => c.code === hover.c.code) ?? hover.c).colorVar})`,
            }}
          >
            {t(categoryMeta(countries.find((c) => c.code === hover.c.code) ?? hover.c).label)}
            {countries.find((c) => c.code === hover.c.code)?.maxStayDays
              ? ` · ${countries.find((c) => c.code === hover.c.code)?.maxStayDays} ${t("days")}`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
});
