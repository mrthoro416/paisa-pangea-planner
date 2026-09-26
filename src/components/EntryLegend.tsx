import { CATEGORY_ORDER, CATEGORIES } from "@/lib/entry";
import type { EntryCategory } from "@/data/countries";

interface EntryLegendProps {
  counts: Record<EntryCategory, number>;
  activeFilter: EntryCategory | null;
  onFilter: (c: EntryCategory | null) => void;
  orientation?: "row" | "column";
}

export function EntryLegend({ counts, activeFilter, onFilter, orientation = "row" }: EntryLegendProps) {
  const isColumn = orientation === "column";

  const items = CATEGORY_ORDER.map((key) => {
    const meta = CATEGORIES[key];
    const active = activeFilter === null || activeFilter === key;
    return (
      <button
        key={key}
        type="button"
        aria-pressed={activeFilter === key}
        onClick={() => onFilter(activeFilter === key ? null : key)}
        className={`tap-target group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-all ${
          activeFilter === key ? "bg-beacon-soft ring-1 ring-beacon" : ""
        } ${active ? "" : "opacity-45"}`}
      >
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: `var(${meta.colorVar})` }}
          aria-hidden="true"
        />
        <span className="flex flex-col leading-tight">
          <span className="whitespace-nowrap text-[11.5px] font-medium text-foreground">
            {meta.short}
            <span className="ml-1.5 tabular-nums text-muted-foreground">{counts[key]}</span>
          </span>
          {isColumn && (
            <span className="whitespace-nowrap text-[10px] text-muted-foreground">
              {meta.description}
            </span>
          )}
        </span>
      </button>
    );
  });

  return (
    <nav
      aria-label="Entry requirement categories"
      className={`map-overlay rounded-2xl ${isColumn ? "p-2" : "px-1.5 py-1"}`}
    >
      <div
        className={
          isColumn ? "flex flex-col items-stretch" : "flex max-w-full items-center gap-0.5 overflow-x-auto"
        }
      >
        {items}
      </div>
      {activeFilter && (
        <button
          type="button"
          onClick={() => onFilter(null)}
          className="tap-target mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
        >
          ✕ Show all countries
        </button>
      )}
    </nav>
  );
}
