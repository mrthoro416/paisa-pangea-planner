import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Drama, MountainSnow, Moon, Palmtree, Sun, Trees } from "lucide-react";
import { VIBES, type VibeKey } from "@/lib/vibes";

const VIBE_ICONS = { beach: Palmtree, ski: MountainSnow, culture: Drama, nature: Trees } as const;
import { useTheme } from "@/hooks/use-theme";
import { useLang } from "@/lib/i18n";
import { LanguagePrompt } from "@/components/LanguagePrompt";
import { PassportPrompt, PassportSelector } from "@/components/PassportPicker";
import { useVisaCountries } from "@/lib/use-visa-countries";
import { type CountryEntry } from "@/data/countries";
import { FILTERS, filterByKey, isAccessible, type FilterKey } from "@/lib/filters";
import { GlobeMap, type GlobeHandle } from "@/components/GlobeMap";
import { PassportHUD } from "@/components/PassportHUD";
import { FilterBar } from "@/components/FilterBar";
import { CommandSearch } from "@/components/CommandSearch";
import { CountrySheet } from "@/components/CountrySheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paisa Planner — Passport-aware travel map" },
      {
        name: "description",
        content:
          "A passport-aware travel globe with partial Colombian seed rules, explicit missing coverage, climate averages and destination-authority references.",
      },
      { property: "og:title", content: "Paisa Planner — Passport & Visa Globe" },
      {
        property: "og:description",
        content: "Spin the globe. Explore entry categories where data exists; missing passport rules remain unknown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [selected, setSelected] = useState<CountryEntry | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [vibe, setVibe] = useState<VibeKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const globe = useRef<GlobeHandle>(null);
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useLang();

  const countries = useVisaCountries();
  const counts = useMemo(
    () =>
      Object.fromEntries(FILTERS.map((f) => [f.key, countries.filter(f.test).length])) as Record<
        FilterKey,
        number
      >,
    [countries],
  );
  const accessible = useMemo(() => countries.filter(isAccessible).length, [countries]);
  const hudCount = filter === "all" ? accessible : counts[filter];
  const hudLabel = filter === "all" ? "without embassy visa" : filterByKey.get(filter)?.label ?? "All";

  const reset = () => {
    setSelected(null);
    setFilter("all");
    setVibe(null);
    globe.current?.resetView();
  };
  const pick = (c: CountryEntry | null) => {
    setSelected(c);
    if (c) globe.current?.flyTo(c);
  };

  return (
    <div className="app-fixed bg-background">
      <h1 className="sr-only">Paisa Planner — passport-aware travel requirements</h1>
      <GlobeMap
        key={theme}
        ref={globe}
        selectedCode={selected?.code ?? null}
        filter={filter}
        vibe={vibe}
        onSelect={pick}
      />

      {/* Top HUD */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 lg:px-5"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
          <PassportHUD count={hudCount} total={countries.length} label={hudLabel} onReset={reset} />
          <PassportSelector />
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            aria-label={t("Switch to Spanish")}
            title={lang === "en" ? "Español" : "English"}
            className="map-overlay tap-target flex h-12 items-center gap-2 rounded-full px-3.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span
              className={`fi fi-${lang === "en" ? "us" : "co"} rounded-[2px] text-[15px]`}
              aria-hidden
            />
            <span className="mono text-foreground/80">{lang === "en" ? "EN" : "ES"}</span>
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
            className="map-overlay tap-target flex size-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="map-overlay hidden h-12 items-center gap-3 rounded-full pl-4 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
          >
            ⌕ {t("Search destinations")}
            <kbd className="mono rounded-full bg-accent px-2 py-1 text-faint">⌘K</kbd>
          </button>
        </div>
      </div>

      {/* Bottom controls — thumb zone */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 transition-opacity duration-300 lg:items-start lg:px-5 ${selected ? "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100" : ""}`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.9rem)" }}
      >
        <div className="w-full max-w-full lg:w-auto lg:max-w-[calc(100vw-460px)]">
          <FilterBar value={filter} counts={counts} onChange={setFilter} />
        </div>
        <div className="map-overlay flex h-14 w-full items-center rounded-full pl-5 pr-1.5 lg:w-auto lg:pl-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-full min-w-0 flex-1 items-center gap-3 text-[16px] text-muted-foreground lg:hidden"
          >
            <span aria-hidden>⌕</span> {t("Where to?")}
          </button>
          <div role="group" aria-label={t("Holiday style")} className="flex items-center gap-0.5">
            {VIBES.map((v) => {
              const Icon = VIBE_ICONS[v.key];
              const on = vibe === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={on}
                  aria-label={t(v.label)}
                  title={t(v.label)}
                  onClick={() => setVibe(on ? null : v.key)}
                  className={`flex size-11 items-center justify-center rounded-full transition-all active:scale-90 ${
                    on ? "bg-foreground text-background" : "text-faint hover:text-foreground"
                  }`}
                >
                  <Icon className="size-[18px]" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </div>
        <a href="/about" className="mono hidden text-faint hover:text-muted-foreground lg:block">
          {t("Data & sources")}
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
      <LanguagePrompt />
      <PassportPrompt />
    </div>
  );
}
