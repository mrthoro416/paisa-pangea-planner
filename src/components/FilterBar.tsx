import { FILTERS, type FilterKey } from "@/lib/filters";
import { CATEGORIES } from "@/lib/entry";
import type { EntryCategory } from "@/data/countries";
import { useLang } from "@/lib/i18n";

interface Props {
  value: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (k: FilterKey) => void;
}

export function FilterBar({ value, counts, onChange }: Props) {
  const { t } = useLang();
  return (
    <div
      role="radiogroup"
      aria-label={t("Filter destinations")}
      className="map-overlay scrollbar-hide flex max-w-full gap-0.5 overflow-x-auto rounded-full p-1"
    >
      {FILTERS.map((f) => {
        const active = f.key === value;
        const cat = CATEGORIES[f.key as EntryCategory];
        return (
          <button
            key={f.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active && f.key !== "all" ? "all" : f.key)}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-all duration-300 active:scale-95 ${
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat && <span className="size-1.5 rounded-full" style={{ background: `var(${cat.colorVar})` }} aria-hidden />}
            {t(f.label)}
            <span className={`mono text-[9.5px] ${active ? "text-background/60" : "text-faint"}`}>{counts[f.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
