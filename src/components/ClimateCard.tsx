import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import climate from "@/data/climate.json";
import { useLang, longText, MONTHS as M } from "@/lib/i18n";

type Row = { hi: number[]; lo: number[]; mm: number[] };

export function ClimateCard({ code, name }: { code: string; name: string }) {
  const data = (climate as Record<string, Row>)[code];
  const [month, setMonth] = useState(0);
  const [open, setOpen] = useState(false);
  const { lang, t } = useLang();
  const MONTHS = M[lang].short;
  const FULL = M[lang].full;
  useEffect(() => setMonth(new Date().getMonth()), []);
  if (!data) return null;
  const hi = data.hi[month] ?? 0;
  const lo = data.lo[month] ?? 0;
  const mm = data.mm[month] ?? 0;

  return (
    <section className="mt-6">
      <h3 className="mono mb-1 text-faint">{t("Average weather")}</h3>
      <div className="rounded-2xl border border-border">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm text-muted-foreground">{FULL[month]}</span>
            <span className="mono text-foreground">
              {lo}° / {hi}°C · {mm} {t("mm rain")}
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {t(open ? "Close" : "Other months")}
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
        {open && (
          <div className="border-t border-border p-2">
            <div role="radiogroup" aria-label={t("Choose a month")} className="grid grid-cols-6 gap-1">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={i === month}
                  onClick={() => setMonth(i)}
                  className={`min-h-11 rounded-xl text-xs font-medium transition-colors ${
                    i === month ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        {longText(lang, "climateNote", { name })}
      </p>
    </section>
  );
}
