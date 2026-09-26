import { useMemo, useRef, useState, useEffect } from "react";
import { COUNTRIES, type CountryEntry } from "@/data/countries";
import { categoryMeta } from "@/lib/entry";

interface CountrySearchProps {
  onSelect: (c: CountryEntry) => void;
}

export function CountrySearch({ onSelect }: CountrySearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return COUNTRIES.filter((c) => {
      if (c.name.toLowerCase().startsWith(q)) return true;
      if (c.code.toLowerCase() === q || c.iso3.toLowerCase() === q) return true;
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.region.toLowerCase().includes(q)) return true;
      return c.altNames.some((n) => n.toLowerCase().includes(q));
    })
      .sort((a, b) => a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q) || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [query]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  const pick = (c: CountryEntry) => {
    onSelect(c);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative w-full sm:w-72">
      <div className="map-overlay flex items-center gap-2 rounded-full px-4">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-muted-foreground">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) pick(results[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Where are you going?"
          aria-label="Search a country"
          role="combobox"
          aria-expanded={open}
          aria-controls="country-search-results"
          className="tap-target w-full bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      {open && results.length > 0 && (
        <ul
          id="country-search-results"
          role="listbox"
          className="map-overlay absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl p-1.5 shadow-xl shadow-black/40"
        >
          {results.map((c) => {
            const meta = categoryMeta(c);
            return (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => pick(c)}
                  className="tap-target flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: `var(${meta.colorVar})` }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-sm text-foreground">
                    {c.flag} {c.name}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {meta.short}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="map-overlay absolute inset-x-0 top-full z-50 mt-2 rounded-2xl p-4 text-sm text-muted-foreground">
          No country found for “{query}”.
        </div>
      )}
    </div>
  );
}
