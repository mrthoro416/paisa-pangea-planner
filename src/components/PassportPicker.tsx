import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { COUNTRIES, PASSPORT, type CountryEntry } from "@/data/countries";
import { useLang } from "@/lib/i18n";
import { usePassportPref } from "@/lib/passport-pref";
import * as Dialog from "@radix-ui/react-dialog";
import { PASSPORT_OPTIONS, coverageFor } from "@/lib/visa-rules";
import { Link } from "@tanstack/react-router";
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
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const results = useMemo(() => {
    const sorted = COUNTRIES.filter((c) => PASSPORT_OPTIONS.some((p) => p.code === c.code)).sort(
      (a, b) => name(a).localeCompare(name(b)),
    );
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
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.max(0, Math.min(a + 1, results.length - 1)));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            }
            if (e.key === "Enter") choose(active);
          }}
          placeholder={t("Search countries…")}
          aria-label={t("Search countries…")}
          role="combobox"
          aria-expanded
          aria-controls="passport-results"
          aria-activedescendant={
            results[active] ? `passport-option-${results[active].code}` : undefined
          }
          className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-foreground outline-none placeholder:text-faint"
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
              id={`passport-option-${c.code}`}
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
              <span className="mono text-muted-foreground">
                {t(c.code === "CO" ? "Partial" : "Missing")}
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
    <p className={`text-[11px] leading-relaxed text-muted-foreground ${className}`}>
      {t(
        "Only Colombian passport rules are imported so far. Other passports show unknown results, not Colombian rules. Confirm current eligibility with official authorities.",
      )}
    </p>
  );
}

/** First-visit onboarding: ask which country issued the visitor's passport. */
export function PassportPrompt() {
  const { chosen: langChosen, t } = useLang();
  const { chosen, setPassport } = usePassportPref();
  const [languageSettled, setLanguageSettled] = useState(false);
  useEffect(() => {
    if (!langChosen) {
      setLanguageSettled(false);
      return;
    }
    const timer = setTimeout(() => setLanguageSettled(true), 400);
    return () => clearTimeout(timer);
  }, [langChosen]);
  const open = languageSettled && !chosen;

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-md" />
        <Dialog.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="map-overlay fixed left-1/2 top-1/2 z-[61] max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] p-6"
        >
          <div className="flex justify-center">
            <BeaconMark size={40} className="beacon-glow" />
          </div>
          <Dialog.Title className="masthead mt-4 text-center text-xl text-foreground">
            {t("Which country issued your passport?")}
          </Dialog.Title>
          <Dialog.Description asChild>
            <DataDisclosure className="mt-2 text-center" />
          </Dialog.Description>
          <div className="mt-5">
            <PassportSearchList autoFocus onPick={(c) => setPassport(c.code)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Top-left HUD control: shows the saved passport and opens the picker dialog. */
export function PassportSelector() {
  const { t, name } = useLang();
  const { country, setPassport } = usePassportPref();
  const [open, setOpen] = useState(false);
  const coverage = coverageFor(country.code);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          aria-label={`${t("Change passport")} — ${name(country)}`}
          className="map-overlay tap-target flex h-12 shrink-0 items-center gap-2 rounded-full px-3 text-muted-foreground"
        >
          <span className={`fi fi-${country.code.toLowerCase()} text-[15px]`} aria-hidden />
          <span className="mono lg:hidden">{country.iso3}</span>
          <span className="hidden max-w-32 truncate text-sm lg:block">{name(country)}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md" />
        <Dialog.Content className="map-overlay fixed left-1/2 top-1/2 z-[51] max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl p-4">
          <div className="flex items-center justify-between gap-3 pb-3">
            <Dialog.Title className="masthead text-lg">{t("Your passport")}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label={t("Close")} className="tap-target rounded-full">
                ✕
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description asChild>
            <DataDisclosure className="mb-3" />
          </Dialog.Description>
          <PassportSearchList
            autoFocus
            onPick={(c) => {
              setPassport(c.code);
              setOpen(false);
            }}
          />
          <p className="mono mt-3 text-muted-foreground">
            {coverage.partial} {t("Partial")} · {coverage.missing} {t("Missing")}
          </p>
          <Link
            to="/coverage"
            onClick={() => setOpen(false)}
            className="tap-target mt-2 flex items-center text-sm text-beacon"
          >
            {t("View coverage")} →
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
