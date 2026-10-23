import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, type PanInfo } from "motion/react";
import { PASSPORT, type CountryEntry } from "@/data/countries";
import { isHomeCountry, categoryMeta, maxStayText, officialSource, requirementItems, requirementSummary } from "@/lib/entry";
import { formatVerified } from "@/lib/filters";
import { ClimateCard } from "@/components/ClimateCard";
import { useLang, longText } from "@/lib/i18n";

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
  if (isHomeCountry(country)) return <HomeContent country={country} onClose={onClose} />;
  const cname = name(country);
  const meta = categoryMeta(country);
  const stay = maxStayText(country, lang);
  const source = officialSource(country);
  const items = requirementItems(country, lang).filter((i) => i !== country.note);
  const color = `var(${meta.colorVar})`;
  const host = source ? new URL(source.url).hostname.replace(/^www\./, "") : null;

  return (
    <div className="px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 lg:pt-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono text-faint">
            {country.iso3} · {t(country.region)}
          </p>
          <h2 className="masthead mt-1 truncate text-[28px] leading-tight text-foreground">
            <span className="mr-2" aria-hidden>{country.flag}</span>
            {cname}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close")}
          className="tap-target -mr-2 flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="mono flex items-center gap-2 rounded-full px-2.5 py-1.5" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 30%, transparent)` }}>
          <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} aria-hidden />
          {t(meta.label)}
        </span>
        {country.maxStayDays != null && <span className="mono text-foreground/80">{country.maxStayDays} {t("days")}</span>}
      </div>

      <p className="mt-5 text-[15px] leading-relaxed text-foreground/80">{requirementSummary(country, lang, cname)}</p>

      <Section title={t("Entry")}>
        <Row k={t("Type")} v={t(meta.label)} />
        <Row k={t("Stay")} v={stay?.replace(/^(Up to|Hasta) /, "") ?? t("Varies")} />
        <Row k={t("Passport")} v={`${PASSPORT.flag} ${name(PASSPORT)}`} />
      </Section>

      <ClimateCard code={country.code} name={cname} />

      {country.note && (
        <p className="mt-5 rounded-2xl bg-beacon-soft p-4 text-sm leading-relaxed text-foreground/90">{country.note}</p>
      )}

      <Section title={t("Requirements")}>
        <ul className="space-y-2.5 py-1">
          {items.map((i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/75">
              <span className="mt-[8px] size-1 shrink-0 rounded-full bg-foreground/40" aria-hidden />
              {i}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("Verified")}>
        <Row k={t("Date")} v={formatVerified(country.lastVerified, lang)} mono />
        <Row k={t("Source")} v={host ?? t("Needs verification")} mono />
      </Section>

      <div className="mt-6">
        {source ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
          >
            {lang === "es" ? t("Official entry information") : (source.label ?? "Official entry information")} <span aria-hidden>↗</span>
          </a>
        ) : (
          <p className="rounded-2xl border border-border p-4 text-sm leading-relaxed text-muted-foreground">
            <span className="mono block text-foreground/80">{t("Official source needs verification")}</span>
            <span className="mt-1 block">{longText(lang, "confirmEmbassy", { name: cname })}</span>
          </p>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          {t("Entry rules change. Always confirm with official government sources before booking. Links open in a new tab.")}
        </p>
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
      <span className={mono ? "mono text-foreground/85" : "text-sm text-foreground"}>{v}</span>
    </div>
  );
}

function HomeContent({ country, onClose }: { country: CountryEntry; onClose: () => void }) {
  const { lang, t, name } = useLang();
  const pname = name(PASSPORT);
  return (
    <div className="px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 lg:pt-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono text-faint">{country.iso3} · {t(country.region)}</p>
          <h2 className="masthead mt-1 truncate text-[28px] leading-tight text-foreground">
            <span className="mr-2" aria-hidden>{country.flag}</span>
            {name(country)}
          </h2>
        </div>
        <button type="button" onClick={onClose} aria-label={t("Close")} className="tap-target -mr-2 flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">✕</button>
      </div>
      <div className="mt-3">
        <span className="mono inline-flex items-center gap-2 rounded-full bg-beacon-soft px-2.5 py-1.5 text-beacon">
          <span className="size-1.5 rounded-full bg-beacon" aria-hidden />
          {t("Home country")}
        </span>
      </div>
      <p className="mt-5 text-[15px] leading-relaxed text-foreground/80">
        {longText(lang, "homeBody", { passport: pname })}
      </p>
      <Section title={t("Entry")}>
        <Row k={t("Type")} v={t("Citizen — no visa")} />
        <Row k={t("Stay")} v={t("No limit")} />
        <Row k={t("Passport")} v={`${PASSPORT.flag} ${pname}`} />
      </Section>
      <ClimateCard code={country.code} name={name(country)} />
    </div>
  );
}
