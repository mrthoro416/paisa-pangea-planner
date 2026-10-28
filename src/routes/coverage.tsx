import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PASSPORT_OPTIONS, MATRIX_INFO, coverageFor } from "@/lib/visa-rules";
import { useVisaCountries } from "@/lib/use-visa-countries";
import { usePassportPref } from "@/lib/passport-pref";
import { useLang } from "@/lib/i18n";
import { PassportSelector } from "@/components/PassportPicker";
import { categoryMeta } from "@/lib/entry";

export const Route = createFileRoute("/coverage")({
  head: () => ({
    meta: [
      { title: "Passport Data Coverage — Paisa Planner" },
      {
        name: "description",
        content:
          "Audit the partial Colombian seed rules and missing passport/destination pairs in Paisa Planner's uploaded matrix.",
      },
      { property: "og:title", content: "Passport Data Coverage — Paisa Planner" },
      {
        property: "og:description",
        content: "Transparent passport coverage, dataset provenance and unverified entry records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Coverage,
});

function Coverage() {
  const { t, name } = useLang();
  const { country } = usePassportPref();
  const countries = useVisaCountries();
  const coverage = coverageFor(country.code);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const rows = useMemo(
    () =>
      countries.filter(
        (c) =>
          (status === "all" || c.rule.coverage_status === status) &&
          `${name(c)} ${c.name} ${c.code} ${c.iso3}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [countries, name, query, status],
  );
  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="tap-target flex items-center text-sm text-beacon">
            {t("← Back to map")}
          </Link>
          <PassportSelector />
        </div>
        <h1 className="masthead mt-8 text-3xl">{t("Passport data coverage")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(
            "Only Colombian passport rules are imported so far. Other passports show unknown results, not Colombian rules. Confirm current eligibility with official authorities.",
          )}
        </p>
        <p className="mono mt-4 text-muted-foreground">
          {PASSPORT_OPTIONS.length} {t("Passport options")} ·{" "}
          {MATRIX_INFO.totalPairs.toLocaleString()} {t("Pairs")} ·{" "}
          {MATRIX_INFO.missingPairs.toLocaleString()} {t("Missing")}
        </p>
        <section className="mt-8 border-y border-border py-5" aria-label={t("Coverage")}>
          <h2 className="masthead text-xl">{name(country)}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Partial — imported", coverage.partial],
              ["Home-country logic", coverage.home],
              ["Missing", coverage.missing],
              ["Officially verified", coverage.verified],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{t(String(label))}</dt>
                <dd className="mt-1 text-2xl tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="mt-6 flex flex-wrap gap-3">
          <input
            aria-label={t("Search destinations")}
            placeholder={t("Search destinations")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 min-w-0 basis-full rounded-lg border border-input bg-transparent px-3 sm:flex-1 sm:basis-auto"
          />
          <select
            aria-label={t("Coverage status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-12 rounded-lg border border-input bg-background px-3"
          >
            {[
              ["all", "All"],
              ["partial", "Partial — imported"],
              ["logic_only", "Home-country logic"],
              ["missing", "Missing"],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {t(label ?? "All")}
              </option>
            ))}
          </select>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {rows.map((c) => (
            <li key={c.code} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <span className={`fi fi-${c.code.toLowerCase()} text-lg`} aria-hidden />
                <div>
                  <p className="text-sm">{name(c)}</p>
                  <p className="mono text-muted-foreground">
                    {country.code}:{c.code} ·{" "}
                    {t(
                      c.rule.coverage_status === "missing"
                        ? "Missing"
                        : c.rule.coverage_status === "logic_only"
                          ? "Home-country logic"
                          : "Partial — imported",
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t(categoryMeta(c).label)}</p>
                {c.rule.source_as_of && (
                  <p className="mono text-muted-foreground">
                    {t("Source date")}: {c.rule.source_as_of}
                  </p>
                )}
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="py-6 text-muted-foreground">{t("No matches")}</li>}
        </ul>
        <section className="mt-8 border-t border-border pt-6">
          <h2 className="masthead text-xl">{t("Provenance")}</h2>
          <p className="mt-3 break-words text-sm text-muted-foreground">{MATRIX_INFO.workbook}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("Dataset-derived guidance, not individually verified against official authorities.")}{" "}
            {t("Source date")}: 2026-09-26.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("Passport-specific document requirements are not available in this workbook.")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(
              "Passport-issuer authority links are not supplied. New sources require licensing, provenance, update cadence and field-definition review before use.",
            )}
          </p>
          <details className="mt-4">
            <summary className="tap-target flex cursor-pointer items-center text-xs text-muted-foreground">
              SHA-256
            </summary>
            <p className="break-all font-mono text-xs text-muted-foreground">
              {MATRIX_INFO.sha256}
            </p>
          </details>
        </section>
      </div>
    </main>
  );
}
