import { usePassportPref } from "@/lib/passport-pref";
import { BeaconMark } from "@/components/BeaconLogo";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useLang } from "@/lib/i18n";

interface Props {
  count: number;
  total: number;
  label: string;
  onReset: () => void;
}

export function PassportHUD({ count, total, label, onReset }: Props) {
  const { lang, t, name } = useLang();
  const { country } = usePassportPref();
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
          {country.flag}{" "}
          {lang === "es" ? `${t("passport")} ${name(country)}` : `${country.name} passport`}
        </p>
        <p className="mono truncate text-muted-foreground">
          <AnimatedNumber value={count} className="text-foreground" />
          {count !== total ? ` / ${total}` : ""} {t(label)}
        </p>
      </div>
    </div>
  );
}
