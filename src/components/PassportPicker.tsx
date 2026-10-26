import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { COUNTRIES, PASSPORT, type CountryEntry } from "@/data/countries";
import { useLang } from "@/lib/i18n";
import { usePassportPref } from "@/lib/passport-pref";
import { BeaconMark } from "@/components/BeaconLogo";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Searchable A–Z country list shared by the onboarding prompt and the HUD selector. */
function PassportSearchList({
  onPick,
  autoFocus,
}: {
  onPick: (c: CountryEntry) => void;
  autoFocus?: boolean;
}) {
  const { t, name } = useLang();
  const { country: current } = usePassportPref();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 30);
  }, [autoFocus]);

  const results = useMemo(() => {
    const sorted = [...COUNTRIES].sort((a, b) => name(a).localeCompare(name(b)));
    const n = norm(q.trim());
    if (!n) {
      // Current passport first, then Colombia (the dataset's passport), then A–Z.
      const pinned = [
        current,
        ...sorted.filter((c) => c.code === PASSPORT.code && c.code !== current.code),
      ];
      return [
        ...pinned,
        ...sorted.filter((c) => c.code !== current.code && c.code !== PASSPORT.code),
      ];
    }
    return sorted
      .filter(
        (c) =>
          norm(c.name).includes(n) ||
          norm(name(c)).includes(n) ||
          c.code.toLowerCase() === n ||
          c.iso3.toLowerCase() === n ||
          c.altNames.some((a) => norm(a).includes(n)),
      )
      .slice(0, 12);
  }, [q, name, current]);

  const choose = (i: number) => {
    const c = results[i];
    if (c) onPick(c);
  };

  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl border border-border px-4">
        <span className="text-muted-foreground" aria-hidden>
          ⌕
        </span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown")
              (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)));
            if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
            if (e.key === "Enter") choose(active);
          }}
          placeholder={t("Search countries…")}
          aria-label={t("Search countries…")}
          role="combobox"
          aria-expanded
          aria-controls="passport-results"
          className="h-12 flex-1 bg-transparent text-[16px] text-foreground outline-none placeholder:text-faint"
        />
      </div>
      <ul id="passport-results" role="listbox" className="mt-2 max-h-[46dvh] overflow-y-auto">
        {results.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">{t("No matches")}</li>
        )}
        {results.map((c, i) => {
          const sel = i === active;
          const isCurrent = c.code === current.code;
          return (
            <li
              key={c.code}
              role="option"
              aria-selected={isCurrent}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 text-left transition-colors ${sel ? "bg-accent" : ""}`}
            >
              <span
                className={`fi fi-${c.code.toLowerCase()} shrink-0 rounded-[2px] text-[18px]`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-foreground">{name(c)}</span>
                <span className="mono text-faint">{c.iso3}</span>
              </span>
              {isCurrent && <span className="mono text-beacon">{t("Selected")}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Shown wherever a passport is picked: the dataset only covers Colombian passports. */
function DataDisclosure({ className = "" }: { className?: string }) {
  const { t } = useLang();
  return (
    <p className={`text-[11px] leading-relaxed text-faint ${className}`}>
      {t(
        "Visa results are for Colombian passport holders only — changing your passport here doesn't change the results yet.",
      )}
    </p>
  );
}

/** First-visit onboarding: ask which country issued the visitor's passport. */
export function PassportPrompt() {
  const { chosen: langChosen, t } = useLang();
  const { chosen, setPassport } = usePassportPref();
  const open = langChosen && !chosen;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="passport-title"
            className="map-overlay w-full max-w-sm rounded-[28px] p-6"
            initial={{ y: 16, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="flex justify-center">
              <BeaconMark size={40} className="beacon-glow" />
            </div>
            <h2 id="passport-title" className="masthead mt-4 text-center text-xl text-foreground">
              {t("Which country issued your passport?")}
            </h2>
            <DataDisclosure className="mt-2 text-center" />
            <div className="mt-5">
              <PassportSearchList autoFocus onPick={(c) => setPassport(c.code)} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Top-left HUD control: shows the saved passport and opens the picker dialog. */
export function PassportSelector() {
  const { t, name } = useLang();
  const { country, setPassport } = usePassportPref();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${t("Change passport")} — ${name(country)}`}
        title={t("Change passport")}
        className="map-overlay tap-target flex h-12 shrink-0 items-center gap-2 rounded-full px-3.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <span
          className={`fi fi-${country.code.toLowerCase()} rounded-[2px] text-[15px]`}
          aria-hidden
        />
        <span className="mono text-foreground/80">{country.iso3}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center bg-background/70 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-md sm:pt-[14vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-label={t("Change passport")}
              className="map-overlay flex max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl p-4"
              initial={{ y: -12, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <h2 className="masthead text-lg text-foreground">{t("Your passport")}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("Close")}
                  className="tap-target flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <PassportSearchList
                autoFocus
                onPick={(c) => {
                  setPassport(c.code);
                  setOpen(false);
                }}
              />
              <DataDisclosure className="mt-3 border-t border-border px-1 pt-3" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
