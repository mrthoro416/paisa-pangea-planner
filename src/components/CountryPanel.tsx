import { maxStayText, requirementItems, requirementSummary, categoryMeta, officialSource } from "@/lib/entry";
import { PASSPORT, type CountryEntry } from "@/data/countries";

interface CountryPanelProps {
  country: CountryEntry | null;
  onClose: () => void;
}

export function CountryPanel({ country, onClose }: CountryPanelProps) {
  if (!country) return null;
  const meta = categoryMeta(country);
  const stay = maxStayText(country);
  const source = officialSource(country);
  const items = requirementItems(country);

  return (
    <aside
      role="dialog"
      aria-label={`${country.name} entry requirements`}
      className="sheet-in map-overlay fixed inset-x-0 bottom-0 z-40 max-h-[74dvh] overflow-y-auto rounded-t-3xl pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-20 lg:max-h-none lg:w-[380px] lg:rounded-3xl lg:pb-0"
      style={{ boxShadow: "0 -12px 48px -12px rgb(0 0 0 / 0.55)" }}
    >
      <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-muted-foreground/40 lg:hidden" aria-hidden="true" />
      <div className="p-5 pb-3 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Entry requirements for {PASSPORT.flag} {PASSPORT.name} passport holders
            </p>
            <h2 className="masthead mt-1 text-2xl text-foreground">
              {country.flag} {country.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close country panel"
            className="tap-target -mr-2 -mt-2 flex shrink-0 items-center justify-center rounded-full text-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Status */}
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl border p-3.5"
          style={{
            borderColor: `color-mix(in oklab, var(${meta.colorVar}) 45%, transparent)`,
            background: `color-mix(in oklab, var(${meta.colorVar}) 12%, transparent)`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="size-3.5 shrink-0 rounded-full"
              style={{ background: `var(${meta.colorVar})` }}
              aria-hidden="true"
            />
            <span className="masthead text-lg" style={{ color: `var(${meta.colorVar})` }}>
              {meta.label}
            </span>
          </div>
          {stay && (
            <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
              {stay}
            </span>
          )}
        </div>
        <p className="sr-only">{`${meta.label}: ${meta.description}`}</p>

        <p className="mt-4 text-sm leading-relaxed text-foreground/90">{requirementSummary(country)}</p>
        {country.note && (
          <p className="mt-3 rounded-xl border border-beacon/30 bg-beacon-soft p-3 text-sm leading-relaxed text-foreground">
            {country.note}
          </p>
        )}

        <h3 className="mt-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Important requirements
        </h3>
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
              <span
                className="mt-[7px] size-1.5 shrink-0 rounded-full"
                style={{ background: `var(${meta.colorVar})` }}
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Last verified: {country.lastVerified} · {country.region}
        </p>

        {/* Primary CTA */}
        <div className="mt-4 lg:pb-2">
          {source ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-beacon px-4 py-3.5 text-center text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.015] active:scale-[0.99]"
            >
              {source.label ?? "Official Entry Information"} <span aria-hidden="true">→</span>
            </a>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-4 text-center">
              <p className="text-sm font-medium text-foreground">Official source needs verification</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                We couldn't confidently identify {country.name}'s official portal. Check the country's
                immigration authority or foreign ministry directly before you book.
              </p>
            </div>
          )}
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            Opens in a new tab · Entry requirements can change — always verify with official sources
            before traveling.
          </p>
        </div>
      </div>
    </aside>
  );
}
