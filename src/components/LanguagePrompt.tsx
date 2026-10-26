import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLang, SPANISH_COUNTRIES, type Lang } from "@/lib/i18n";
import { getVisitorCountry } from "@/lib/geo.functions";
import { BeaconMark } from "@/components/BeaconLogo";

const OPTIONS: Array<{ lang: Lang; flag: string; label: string; hint: string }> = [
  { lang: "en", flag: "us", label: "English", hint: "Continue in English" },
  { lang: "es", flag: "co", label: "Español", hint: "Continuar en español" },
];

/** First-visit language picker. Suggests a language from the visitor's IP country. */
export function LanguagePrompt() {
  const { chosen, setLang } = useLang();
  const [suggested, setSuggested] = useState<Lang | null>(null);

  useEffect(() => {
    if (chosen) return;
    const fromBrowser: Lang = navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
    getVisitorCountry()
      .then(({ country }) => setSuggested(country ? (SPANISH_COUNTRIES.has(country) ? "es" : "en") : fromBrowser))
      .catch(() => setSuggested(fromBrowser));
  }, [chosen]);

  const ordered = suggested === "es" ? [...OPTIONS].reverse() : OPTIONS;

  return (
    <AnimatePresence>
      {!chosen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lang-title"
            className="map-overlay w-full max-w-sm rounded-[28px] p-6"
            initial={{ y: 16, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-center">
              <BeaconMark size={40} className="beacon-glow" />
            </div>
            <h2 id="lang-title" className="masthead mt-4 text-center text-xl text-foreground">
              Choose your language
            </h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">Elige tu idioma</p>
            <div className="mt-6 space-y-2">
              {ordered.map((o) => {
                const rec = suggested === o.lang;
                return (
                  <button
                    key={o.lang}
                    type="button"
                    autoFocus={rec}
                    onClick={() => setLang(o.lang)}
                    className={`flex min-h-16 w-full items-center gap-4 rounded-2xl px-4 text-left transition-all active:scale-[0.98] ${
                      rec ? "bg-foreground text-background" : "border border-border text-foreground hover:bg-accent"
                    }`}
                  >
                    <span className={`fi fi-${o.flag} shrink-0 rounded-sm text-[22px]`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold">{o.label}</span>
                      <span className={`block text-xs ${rec ? "text-background/60" : "text-muted-foreground"}`}>{o.hint}</span>
                    </span>
                    {rec && (
                      <span className="mono text-background/60">{o.lang === "es" ? "Sugerido" : "Suggested"}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-center text-[11px] text-faint">
              You can change this anytime · Puedes cambiarlo cuando quieras
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
