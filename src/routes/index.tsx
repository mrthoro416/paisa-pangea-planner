import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { COUNTRIES, type CountryEntry } from "@/data/countries";
import { FILTERS, filterByKey, isAccessible, type FilterKey } from "@/lib/filters";
import { GlobeMap, type GlobeHandle } from "@/components/GlobeMap";
import { PassportHUD } from "@/components/PassportHUD";
import { FilterBar } from "@/components/FilterBar";
import { CommandSearch } from "@/components/CommandSearch";
import { CountrySheet } from "@/components/CountrySheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paisa Planner — Where can a Colombian passport take you?" },
      {
        name: "description",
        content:
          "A 3D globe of entry requirements for Colombian passport holders — visa-free, visa on arrival, eVisa, ETA or embassy visa, with verification dates and official sources.",
      },
      { property: "og:title", content: "Paisa Planner — Colombian Passport Globe" },
      { property: "og:description", content: "Spin the globe. See where your Colombian passport takes you — in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [selected, setSelected] = useState<CountryEntry | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const globe = useRef<GlobeHandle>(null);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, COUNTRIES.filter(f.test).length])) as Record<FilterKey, number>,
    [],
  );
  const accessible = useMemo(() => COUNTRIES.filter(isAccessible).length, []);
  const hudCount = filter === "all" ? accessible : counts[filter];
  const hudLabel = filter === "all" ? "without embassy visa" : filterByKey.get(filter)!.label.toLowerCase();

  const reset = () => {
    setSelected(null);
    setFilter("all");
    globe.current?.resetView();
  };
  const pick = (c: CountryEntry | null) => {
    setSelected(c);
    if (c) globe.current?.flyTo(c);
  };

  return (
    <div className="app-fixed bg-background">
      <h1 className="sr-only">Paisa Planner — entry requirements for Colombian passport holders</h1>
      <GlobeMap ref={globe} selectedCode={selected?.code ?? null} filter={filter} onSelect={pick} />

      {/* Top HUD */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 lg:px-5"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <div className="pointer-events-auto min-w-0">
          <PassportHUD count={hudCount} total={COUNTRIES.length} label={hudLabel} onReset={reset} />
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="map-overlay pointer-events-auto hidden h-12 shrink-0 items-center gap-3 rounded-full pl-4 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
        >
          ⌕ Search destinations
          <kbd className="mono rounded-full bg-accent px-2 py-1 text-faint">⌘K</kbd>
        </button>
      </div>

      {/* Bottom controls — thumb zone */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 transition-opacity duration-300 lg:items-start lg:px-5 ${selected ? "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100" : ""}`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.9rem)" }}
      >
        <div className="w-full max-w-full lg:w-auto lg:max-w-[calc(100vw-460px)]">
          <FilterBar value={filter} counts={counts} onChange={setFilter} />
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="map-overlay flex h-14 w-full items-center gap-3 rounded-full px-5 text-[16px] text-muted-foreground transition-transform active:scale-[0.98] lg:hidden"
        >
          <span aria-hidden>⌕</span> Where to?
        </button>
        <a href="/about" className="mono hidden text-faint hover:text-muted-foreground lg:block">
          Data & sources
        </a>
      </div>

      <CommandSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPickCountry={pick}
        onPickFilter={(k) => {
          setSelected(null);
          setFilter(k);
        }}
      />
      <CountrySheet country={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
