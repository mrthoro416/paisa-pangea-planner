import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COUNTRIES, PASSPORT, type CountryEntry } from "@/data/countries";

export const PASSPORT_PREF_KEY = "paisa-passport";

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
/** The dataset's passport — also the default when no preference is saved. */
const DEFAULT_CODE = PASSPORT.code;

interface Ctx {
  /** Effective passport country (defaults to Colombia, the dataset's passport). */
  country: CountryEntry;
  /** False on first visit until the visitor picks a passport. */
  chosen: boolean;
  setPassport: (code: string) => void;
}

const PassportPrefContext = createContext<Ctx>({
  country: BY_CODE.get(DEFAULT_CODE)!,
  chosen: true,
  setPassport: () => {},
});

/**
 * Stores the visitor's passport-issuing country as a local preference only.
 * It never feeds the visa dataset: all entry rules remain Colombian-passport data.
 */
export function PassportPrefProvider({ children }: { children: ReactNode }) {
  // Start with the default and "chosen" so SSR and first client render match; sync after hydration.
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [chosen, setChosen] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(PASSPORT_PREF_KEY);
    if (saved && BY_CODE.has(saved)) setCode(saved);
    else setChosen(false);
  }, []);

  const setPassport = useCallback((next: string) => {
    if (!BY_CODE.has(next)) return;
    window.localStorage.setItem(PASSPORT_PREF_KEY, next);
    setCode(next);
    setChosen(true);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ country: BY_CODE.get(code) ?? BY_CODE.get(DEFAULT_CODE)!, chosen, setPassport }),
    [code, chosen, setPassport],
  );
  return <PassportPrefContext.Provider value={value}>{children}</PassportPrefContext.Provider>;
}

export function usePassportPref() {
  return useContext(PassportPrefContext);
}
