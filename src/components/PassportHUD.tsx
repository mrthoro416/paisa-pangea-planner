import { PASSPORT, COUNTRIES } from "@/data/countries";
const LAST_VERIFIED = COUNTRIES[0]?.lastVerified ?? "2026-09-26";
import { BeaconMark } from "@/components/BeaconLogo";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { formatVerified } from "@/lib/filters";
import { useLang } from "@/lib/i18n";

interface Props {
  count: number;
  total: number;
  label: string;
  onReset: () => void;
}

export function PassportHUD({ count, total, label, onReset }: Props) {
  const { lang, t, name } = useLang();
  return (
    <div className="map-overlay flex min-w-0 items-center gap-1 rounded-full py-1 pl-1 pr-4">
      <button
        type="button"
        onClick={onReset}
        aria-label={t("Paisa Planner — reset globe and start over")}
        title={t("Reset and start over")}
        className="tap-target flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
      >
        <BeaconMark size={30} className="beacon-glow" />
      </button>
      <div className="min-w-0 leading-tight" aria-live="polite">
        <p className="mono truncate text-foreground/90">
          {PASSPORT.flag}{" "}
          {lang === "es" ? `${t("passport")} ${name(PASSPORT)}` : `${PASSPORT.name} passport`}
        </p>
        <p className="mono truncate text-muted-foreground">
          <AnimatedNumber value={count} className="text-foreground" />
          {count !== total ? ` / ${total}` : ""} {t(label)} · {t("verified")}{" "}
          {formatVerified(LAST_VERIFIED, lang)}
        </p>
      </div>
    </div>
  );
}
