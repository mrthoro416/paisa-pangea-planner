import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, type PanInfo } from "motion/react";
import { type CountryEntry } from "@/data/countries";
import { isHomeCountry, categoryMeta, maxStayText } from "@/lib/entry";
import { formatVerified } from "@/lib/filters";
import { ClimateCard } from "@/components/ClimateCard";
import { usePassportPref } from "@/lib/passport-pref";
import { resolveVisaCountry } from "@/lib/visa-rules";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

interface Props {
  country: CountryEntry | null;
  onClose: () => void;
}

type Snap = "peek" | "half" | "full";
const SPRING = { type: "spring", stiffness: 380, damping: 38, mass: 0.9 } as const;

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setD(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return d;
}

export function CountrySheet({ country, onClose }: Props) {
  const { t, name } = useLang();
  const desktop = useIsDesktop();
  return (
    <AnimatePresence>
      {country &&
        (desktop ? (
          <motion.aside
            key={country.code}
            role="dialog"
            aria-label={`${name(country)} · ${t("entry requirements")}`}
            className="map-overlay fixed bottom-4 right-4 top-4 z-30 w-[400px] overflow-y-auto rounded-[28px]"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={SPRING}
          >
            <Content country={country} onClose={onClose} />
          </motion.aside>
        ) : (
          <MobileSheet key={country.code} country={country} onClose={onClose} />
        ))}
    </AnimatePresence>
  );
}

function MobileSheet({ country, onClose }: { country: CountryEntry; onClose: () => void }) {
  const [snap, setSnap] = useState<Snap>("half");
  const controls = useAnimationControls();
  const { t, name } = useLang();
  const [vh, setVh] = useState(800);
  useEffect(() => setVh(window.innerHeight), []);
  const full = vh * 0.92;
  const offsets: Record<Snap, number> = { full: 0, half: full - vh * 0.52, peek: full - 148 };

  useEffect(() => {
    controls.start({ y: offsets[snap], transition: SPRING });
  }, [snap, vh]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const cur = offsets[snap] + info.offset.y + info.velocity.y * 0.2;
    if (cur > offsets.peek + 60) return onClose();
    const order: Snap[] = ["full", "half", "peek"];
    const next = order.reduce((best, s) => (Math.abs(offsets[s] - cur) < Math.abs(offsets[best] - cur) ? s : best), snap);
    setSnap(next);
    controls.start({ y: offsets[next], transition: SPRING });
  };

  return (
    <motion.aside
      role="dialog"
      aria-label={`${name(country)} · ${t("entry requirements")}`}
      className="map-overlay fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[28px]"
      style={{ height: full }}
      initial={{ y: full }}
      animate={controls}
      exit={{ y: full, transition: { duration: 0.25 } }}
      drag="y"
      dragConstraints={{ top: 0, bottom: full }}
      dragElastic={0.08}
      dragListener
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        aria-label={t(snap === "full" ? "Collapse details" : "Expand details")}
        onClick={() => setSnap(snap === "full" ? "half" : snap === "half" ? "full" : "half")}
        className="flex h-6 shrink-0 items-center justify-center"
      >
        <span className="h-1 w-9 rounded-full bg-foreground/25" />
      </button>
      <div className={`flex-1 ${snap === "full" ? "overflow-y-auto" : "overflow-hidden"}`} onPointerDownCapture={(e) => snap === "full" && e.stopPropagation()}>
        <Content country={country} onClose={onClose} />
      </div>
    </motion.aside>
  );
}

function Content({ country, onClose }: { country: CountryEntry; onClose: () => void }) {
  const { lang, t, name } = useLang();
  const { country: passport } = usePassportPref();
  const resolved = resolveVisaCountry(country, passport.code);
  const { rule } = resolved;
  const meta = categoryMeta(resolved);
  const home = isHomeCountry(resolved);
  const known = resolved.category !== "unknown" || home;
  const cname = name(country);
  const sourceUrl = rule.destination_authority_url;
  return (
    <div className="px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 lg:pt-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono text-faint">{country.iso3} · {t(country.region)}</p>
          <h2 className="masthead mt-1 text-[28px] leading-tight text-foreground">
            <span className={`fi fi-${country.code.toLowerCase()} mr-2 text-xl`} aria-hidden />{cname}
          </h2>
        </div>
        <Button variant="ghost" onClick={onClose} aria-label={t("Close")} className="tap-target shrink-0 rounded-full">✕</Button>
      </div>
      <p className="mono mt-4" style={{ color: `var(${meta.colorVar})` }}>{t(meta.label)}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t(known ? "Dataset-derived guidance, not individually verified against official authorities." : "No usable rule for this passport and destination. Missing data does not mean visa-free.")}
      </p>
      <Section title={t("Entry")}>
        <Row k={t("Passport")} v={name(passport)} />
        <Row k={t("Type")} v={t(meta.label)} />
        {known && <Row k={t("Stay")} v={home ? t("No limit") : maxStayText(resolved, lang) ?? t("Not available")} />}
      </Section>
      {home && <p className="mt-4 text-sm text-muted-foreground">{t("Home-country logic, not a visa-policy record")}</p>}
      <ClimateCard code={country.code} name={cname} />
      {rule.entry_conditions_notes && !home && <Section title={t("Source conditions")}><p className="py-3 text-sm text-muted-foreground">{rule.entry_conditions_notes}</p>{lang === "es" && <p className="pb-3 text-xs text-muted-foreground">{t("Original source note (English)")}</p>}</Section>}
      <Section title={t("Travel documents")}>
        <p className="py-3 text-sm leading-relaxed text-muted-foreground">{t("Passport-specific document requirements are not available in this workbook.")}</p>
      </Section>
      <details className="mt-4 border-b border-border pb-3">
        <summary className="tap-target flex cursor-pointer items-center text-sm text-foreground">{t("General guidance — not confirmed entry requirements")}</summary>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("Ask the destination authority about passport validity, visa/eVisa/ETA applications, stay limits, return tickets, accommodation, funds, insurance and vaccinations. Applicability has not been confirmed for this pair.")}</p>
      </details>
      <Section title={t("Data & sources")}>
        <Row k={t("Coverage")} v={t(home ? "Home-country logic" : known ? "Partial — imported" : "Missing")} />
        <Row k={t("Official verification")} v={t("Not yet verified")} />
        {rule.source_as_of && <Row k={t("Source date")} v={formatVerified(rule.source_as_of, lang)} mono />}
        {rule.source_dataset && <p className="py-3 break-words text-xs text-muted-foreground">{t("Source")}: {rule.source_dataset}</p>}
      </Section>
      <details className="mt-4">
        <summary className="tap-target flex cursor-pointer items-center text-sm text-muted-foreground">{t("Provenance")}</summary>
        <p className="break-words text-xs leading-relaxed text-muted-foreground">{t("Original workbook audit fields")}: {rule.verification_status} · {rule.provenance_notes}</p>
        {rule.rule_last_verified && <p className="mt-2 text-xs text-muted-foreground">{t("Inherited workbook date — not an official review")}: {rule.rule_last_verified}</p>}
      </details>
      <div className="mt-6">
        {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="tap-target flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background">{t("Official entry information")} ↗</a> : <p className="text-sm text-muted-foreground">{t("Official source needs verification")}</p>}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("Confirm eligibility for your passport with the destination authority. Links open in a new tab.")}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mono mb-1 text-faint">{title}</h3>
      <div className="divide-y divide-border border-y border-border">{children}</div>
    </section>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground">{k}</span>
      <span className={mono ? "mono text-foreground/85" : "text-right text-sm text-foreground"}>{v}</span>
    </div>
  );
}
