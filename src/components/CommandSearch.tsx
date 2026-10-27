import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { COUNTRIES, type CountryEntry } from "@/data/countries";
import { categoryMeta } from "@/lib/entry";
import { FILTERS, type FilterKey } from "@/lib/filters";
import { useVisaCountries } from "@/lib/use-visa-countries";
import { type VisaCountry } from "@/lib/visa-rules";
import { useLang } from "@/lib/i18n";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPickCountry: (c: CountryEntry) => void;
  onPickFilter: (k: FilterKey, region?: string) => void;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const FILTER_WORDS: Array<[RegExp, FilterKey]> = [
  [/visa[\s-]?free|no visa|sin visa/, "visa_free"],
  [/on arrival|voa|llegada/, "visa_on_arrival"],
  [/e-?visa|online|en linea|electronica/, "evisa"],
  [/\beta\b|authori/, "eta"],
  [/visa required|embassy|embajada|visa requerida/, "visa_required"],
  [/\b(90|180)\b/, "stay90"],
  [/\b(30|60)\b/, "stay30"],
];

const REGIONS = [...new Set(COUNTRIES.map((c) => c.region))].filter(Boolean);

export function CommandSearch({ open, onOpenChange, onPickCountry, onPickFilter }: Props) {
  const countries = useVisaCountries();
  const [q, setQ] = useState("");
  const { t, name } = useLang();
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => {
    const n = norm(q.trim());
    type R = { kind: "filter"; key: FilterKey; region?: string | undefined; label: string } | { kind: "country"; c: VisaCountry };
    const out: R[] = [];
    if (!n) return countries.filter((c) => ["JP", "BR", "ES", "US", "MX", "TH"].includes(c.code)).map((c) => ({ kind: "country", c }) as R);
    const fk = FILTER_WORDS.find(([re]) => re.test(n))?.[1];
    const region = REGIONS.find((r) => n.includes(norm(r)) || n.includes(norm(t(r))));
    if (fk) {
      const label = t(FILTERS.find((f) => f.key === fk)?.label ?? "All");
      out.push({ kind: "filter", key: fk, region, label: region ? `${label} · ${t(region)}` : `${label} · ${t("destinations")}` });
    } else if (region) {
      out.push({ kind: "filter", key: "all", region, label: `${t("Fly to")} ${t(region)}` });
    }
    const countryQ = n.replace(/passport|pasaporte|sin visa|visa[\s-]?free|destinations?|destinos?|\bdays?\b|\bdias?\b|\d+/g, "").trim();
    const matches = countries.filter((c) => {
      if (!countryQ) return fk && (!region || c.region === region) && FILTERS.find((f) => f.key === fk)?.test(c);
      return (
        norm(c.name).includes(countryQ) ||
        norm(name(c)).includes(countryQ) ||
        c.code.toLowerCase() === countryQ ||
        c.iso3.toLowerCase() === countryQ ||
        c.altNames.some((a) => norm(a).includes(countryQ)) ||
        norm(c.subregion).includes(countryQ)
      );
    })
      .sort((a, b) => Number(!norm(name(a)).startsWith(countryQ)) - Number(!norm(name(b)).startsWith(countryQ)))
      .slice(0, 12);
    return [...out, ...matches.map((c) => ({ kind: "country", c }) as R)];
  }, [q, t, name, countries]);

  const choose = (i: number) => {
    const r = results[i];
    if (!r) return;
    onOpenChange(false);
    if (r.kind === "country") onPickCountry(r.c);
    else onPickFilter(r.key, r.region);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center bg-background/70 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-md sm:pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            role="dialog"
            aria-label={t("Search destinations")}
            className="map-overlay flex max-h-[80dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl"
            initial={{ y: -12, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <span className="text-muted-foreground" aria-hidden>
                ⌕
              </span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onOpenChange(false);
                  if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)));
                  if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
                  if (e.key === "Enter") choose(active);
                }}
                placeholder={t("Japan, visa-free Europe, 90 days…")}
                aria-label={t("Search countries, regions or entry types")}
                role="combobox"
                aria-expanded
                aria-controls="cmd-results"
                className="h-14 flex-1 bg-transparent text-[17px] text-foreground outline-none placeholder:text-faint"
              />
              <button type="button" onClick={() => onOpenChange(false)} className="mono tap-target text-muted-foreground">
                Esc
              </button>
            </div>
            <ul id="cmd-results" role="listbox" className="overflow-y-auto p-2">
              {!q && <li className="mono px-3 pb-1 pt-2 text-faint">{t("Suggested")}</li>}
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">{t("No matches")}</li>}
              {results.map((r, i) => {
                const sel = i === active;
                const base = `flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 text-left transition-colors ${sel ? "bg-accent" : ""}`;
                if (r.kind === "filter")
                  return (
                    <li key={"f" + r.key + r.region} role="option" aria-selected={sel} className={base} onMouseEnter={() => setActive(i)} onClick={() => choose(i)}>
                      <span className="grid size-7 place-items-center rounded-full bg-accent text-xs" aria-hidden>◎</span>
                      <span className="flex-1 text-[15px] text-foreground">{r.label}</span>
                      <span className="mono text-faint">{t("Filter")}</span>
                    </li>
                  );
                const m = categoryMeta(r.c);
                return (
                  <li key={r.c.code} role="option" aria-selected={sel} className={base} onMouseEnter={() => setActive(i)} onClick={() => choose(i)}>
                    <span className="text-xl" aria-hidden>{r.c.flag}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-foreground">{name(r.c)}</span>
                      <span className="mono text-faint">{r.c.iso3} · {t(r.c.region)}</span>
                    </span>
                    <span className="mono flex items-center gap-1.5" style={{ color: `var(${m.colorVar})` }}>
                      <span className="size-1.5 rounded-full" style={{ background: `var(${m.colorVar})` }} />
                      {t(m.short)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
