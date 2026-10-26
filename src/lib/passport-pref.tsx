import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { COUNTRIES, PASSPORT, type CountryEntry } from "@/data/countries";

export const PASSPORT_PREF_KEY = "paisa-passport";

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
/** The dataset's passport — also the default when no preference is saved. */
const DEFAULT_CODE = PASSPORT.code;
function getDefaultCountry(): CountryEntry {
  const country = BY_CODE.get(DEFAULT_CODE);
  if (!country) throw new Error("Dataset passport is missing from COUNTRIES");
  return country;
}
const DEFAULT_COUNTRY = getDefaultCountry();

export function resolvePassportCountry(code: string | null | undefined): CountryEntry {
  return (code ? BY_CODE.get(code) : undefined) ?? DEFAULT_COUNTRY;
}

interface Ctx {
  /** Effective passport country (defaults to Colombia, the dataset's passport). */
  country: CountryEntry;
  /** False on first visit until the visitor picks a passport. */
  chosen: boolean;
  setPassport: (code: string) => void;
}

const PassportPrefContext = createContext<Ctx>({
  country: resolvePassportCountry(DEFAULT_CODE),
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
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(PASSPORT_PREF_KEY);
    } catch {
      // A blocked storage area must not prevent an in-memory choice.
    }
    if (saved && BY_CODE.has(saved)) setCode(saved);
    else setChosen(false);
  }, []);

  const setPassport = useCallback((next: string) => {
    if (!BY_CODE.has(next)) return;
    try {
      window.localStorage.setItem(PASSPORT_PREF_KEY, next);
    } catch {
      // The choice remains usable for this visit when storage is unavailable.
    }
    setCode(next);
    setChosen(true);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ country: resolvePassportCountry(code), chosen, setPassport }),
    [code, chosen, setPassport],
  );
  return <PassportPrefContext.Provider value={value}>{children}</PassportPrefContext.Provider>;
}

export function usePassportPref() {
  return useContext(PassportPrefContext);
}
