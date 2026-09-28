import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { PASSPORT, type CountryEntry, type EntryCategory } from "@/data/countries";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/entry";
import { WorldMap, type WorldMapHandle } from "@/components/WorldMap";
import { BeaconLogo } from "@/components/BeaconLogo";
import { CountrySearch } from "@/components/CountrySearch";
import { EntryLegend } from "@/components/EntryLegend";
import { MapControls } from "@/components/MapControls";
import { CountryPanel } from "@/components/CountryPanel";
import { COUNTRIES } from "@/data/countries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paisa Planner — Colombian Passport Global Entry Guide" },
      {
        name: "description",
        content:
          "Interactive world map showing where Colombian passport holders can travel and what entry authorization they need — visa-free, visa on arrival, eVisa, ETA or embassy visa.",
      },
      { property: "og:title", content: "Paisa Planner — Colombian Passport Global Entry Guide" },
      {
        property: "og:description",
        content: "Where can Colombian citizens travel — and what do they need? Tap any country to find out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [selected, setSelected] = useState<CountryEntry | null>(null);
  const [filter, setFilter] = useState<EntryCategory | null>(null);
  const mapRef = useRef<WorldMapHandle>(null);

  const counts = useMemo(() => {
    const c = { visa_free: 0, visa_on_arrival: 0, evisa: 0, eta: 0, visa_required: 0 } as Record<
      EntryCategory,
      number
    >;
    for (const country of COUNTRIES) c[country.category] += 1;
    return c;
  }, []);

  const resetAll = () => {
    setSelected(null);
    setFilter(null);
    mapRef.current?.resetView();
  };

  const pickCountry = (c: CountryEntry) => {
    setSelected(c);
    mapRef.current?.zoomToCountry(c);
  };

  return (
    <div className="app-fixed flex flex-col bg-background">
      <header
        className="flex shrink-0 items-center gap-2 px-2 pb-1 sm:gap-4 sm:px-4"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.6rem)" }}
      >
        <BeaconLogo onReset={resetAll} />
        <div className="ml-auto w-full max-w-[15rem] sm:max-w-72">
          <CountrySearch onSelect={pickCountry} />
        </div>
      </header>

      <main className="relative flex-1">
        <WorldMap ref={mapRef} selectedCode={selected?.code ?? null} activeFilter={filter} onSelect={setSelected} />

        {/* Persistent legend — never part of the zoomable canvas */}
        <div className="absolute left-2 right-14 top-2 lg:hidden">
          <EntryLegend counts={counts} activeFilter={filter} onFilter={setFilter} orientation="row" />
        </div>
        <div className="absolute bottom-4 left-4 z-10 hidden lg:block">
          <div className="mb-2">
            <EntryLegend counts={counts} activeFilter={filter} onFilter={setFilter} orientation="column" />
          </div>
        </div>

        <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
          <MapControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onReset={() => mapRef.current?.resetView()}
          />
        </div>

        <p className="absolute bottom-1.5 left-3 hidden text-[10px] text-muted-foreground lg:block">
          {PASSPORT.flag} {PASSPORT.name} passport · {COUNTRIES.length} destinations · verified{" "}
          {COUNTRIES[0]?.lastVerified ?? "2026-09-26"} ·{" "}
          <a href="/about" className="underline underline-offset-2 hover:text-foreground">
            data & sources
          </a>
        </p>

        <CountryPanel country={selected} onClose={() => setSelected(null)} />
      </main>
    </div>
  );
}
