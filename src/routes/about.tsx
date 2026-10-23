import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { BeaconMark } from "@/components/BeaconLogo";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/entry";
import { COUNTRIES, PASSPORT } from "@/data/countries";
import { useLang, longText } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Data Sources — Paisa Planner" },
      {
        name: "description",
        content:
          "How Paisa Planner classifies entry requirements for Colombian passport holders, where the data comes from, and how to verify it before you travel.",
      },
      { property: "og:title", content: "About & Data Sources — Paisa Planner" },
      {
        property: "og:description",
        content: "Methodology, category definitions and official sources behind the Colombian passport entry guide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

function About() {
  const { lang, t, name } = useLang();
  const counts = CATEGORY_ORDER.map((key) => ({
    key,
    n: COUNTRIES.filter((c) => c.category === key).length,
  }));
  return (
    <div className="min-h-dvh bg-background px-5 pb-16" style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label={t("Back to the map")}>
            <BeaconMark size={34} />
            <span className="masthead text-sm text-foreground">Paisa Planner</span>
          </Link>
          <Link
            to="/"
            className="tap-target flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            {t("← Back to map")}
          </Link>
        </div>

        <h1 className="font-display mt-10 text-3xl font-semibold text-foreground">{t("About this guide")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          {longText(lang, "aboutIntro", { passport: `${PASSPORT.flag} ${name(PASSPORT)}` })}
        </p>

        <h2 className="font-display mt-10 text-xl font-semibold text-foreground">{t("The five categories")}</h2>
        <ul className="mt-4 space-y-3">
          {counts.map(({ key, n }) => (
            <li key={key} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <span
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{ background: `var(${CATEGORIES[key].colorVar})` }}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t(CATEGORIES[key].label)}{" "}
                  <span className="ml-1 font-normal tabular-nums text-muted-foreground">{n} {t("destinations")}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t(CATEGORIES[key].description)}</p>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="font-display mt-10 text-xl font-semibold text-foreground">{t("Where the data comes from")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          {longText(lang, "aboutData", { date: COUNTRIES[0]?.lastVerified ?? "2026-09-26" })}
        </p>

        <h2 className="font-display mt-10 text-xl font-semibold text-foreground">{t("Verify before you travel")}</h2>
        <p className="mt-3 rounded-2xl border border-beacon/30 bg-beacon-soft p-4 text-sm leading-relaxed text-foreground">
          {longText(lang, "aboutVerify")}
        </p>

        <h2 className="font-display mt-10 text-xl font-semibold text-foreground">{t("Your privacy")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          {longText(lang, "aboutPrivacy")}
        </p>

        <Link
          to="/"
          className="tap-target mt-10 flex w-full items-center justify-center rounded-2xl bg-beacon px-4 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          {t("Open the world map →")}
        </Link>
      </div>
    </div>
  );
}
