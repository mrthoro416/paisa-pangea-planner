import { PASSPORT, type CountryEntry, type EntryCategory } from "@/data/countries";
import { OFFICIAL_SOURCES, type OfficialSource } from "@/data/sources";
import type { VisaCountry } from "@/lib/visa-rules";
import type { Lang } from "@/lib/i18n";

export const CATEGORY_ORDER: EntryCategory[] = [
  "visa_free",
  "visa_on_arrival",
  "evisa",
  "eta",
  "visa_required",
  "freedom_of_movement",
  "travel_permit_required",
  "entry_banned",
  "unknown",
];

export interface CategoryMeta {
  key: EntryCategory;
  label: string;
  short: string;
  description: string;
  /** CSS custom property holding the category color */
  colorVar: string;
}

export const CATEGORIES: Record<EntryCategory, CategoryMeta> = {
  freedom_of_movement: { key: "freedom_of_movement", label: "Freedom of movement", short: "Free movement", description: "Free movement reported by the source; confirm applicable conditions.", colorVar: "--cat-green" },
  travel_permit_required: { key: "travel_permit_required", label: "Travel permit required", short: "Travel permit", description: "A special travel permit is reported; verify eligibility with the linked source.", colorVar: "--cat-yellow" },
  entry_banned: { key: "entry_banned", label: "Entry restriction reported", short: "Restriction", description: "An entry restriction is reported; exceptions are not fully covered.", colorVar: "--destructive" },
  unknown: { key: "unknown", label: "Requirements unconfirmed", short: "Unconfirmed", description: "Unconfirmed does not mean visa-free or entry permitted.", colorVar: "--muted-foreground" },
  visa_free: {
    key: "visa_free",
    label: "Visa-free",
    short: "Visa-free",
    description:
      "Passport only — no visa or electronic authorization required for a standard short-term tourist visit.",
    colorVar: "--cat-green",
  },
  visa_on_arrival: {
    key: "visa_on_arrival",
    label: "Visa on arrival",
    short: "On arrival",
    description: "Obtain the visa after arriving at the destination — apply and pay at the border.",
    colorVar: "--cat-blue",
  },
  evisa: {
    key: "evisa",
    label: "eVisa required",
    short: "eVisa",
    description: "Complete an online visa application before traveling.",
    colorVar: "--cat-purple",
  },
  eta: {
    key: "eta",
    label: "Electronic travel authorisation required",
    short: "ETA",
    description:
      "Electronic travel authorization, tourist registration or arrival card required before travel.",
    colorVar: "--cat-yellow",
  },
  visa_required: {
    key: "visa_required",
    label: "Visa required",
    short: "Visa required",
    description:
      "Traditional visa through an embassy or consulate application required before travel.",
    colorVar: "--cat-orange",
  },
};

export const UNKNOWN_META = {
  key: "unknown",
  label: "Requirements unconfirmed",
  short: "Unknown",
  description: "Not yet verified",
  colorVar: "--muted-foreground",
} as const;
export const HOME_META = {
  key: "home_country",
  label: "Home country",
  short: "Home country",
  description: "Home-country logic, not a visa-policy record",
  colorVar: "--beacon",
} as const;
export function categoryMeta(c: CountryEntry | VisaCountry) {
  if (isHomeCountry(c)) return HOME_META;
  return c.category === "unknown" ? UNKNOWN_META : CATEGORIES[c.category];
}

/** Stay length without the "Up to" prefix, e.g. "90 days" / "90 días". */
export function stayLength(c: Pick<CountryEntry, "maxStayDays">, lang: Lang = "en"): string | null {
  if (c.maxStayDays == null) return null;
  if (c.maxStayDays >= 365) {
    const y = Math.round(c.maxStayDays / 365);
    return lang === "es" ? `${y} año${y > 1 ? "s" : ""}` : `${y} year${y > 1 ? "s" : ""}`;
  }
  const d = c.maxStayDays;
  return lang === "es" ? `${d} día${d === 1 ? "" : "s"}` : `${d} day${d === 1 ? "" : "s"}`;
}

export function maxStayText(
  c: Pick<CountryEntry, "maxStayDays">,
  lang: Lang = "en",
): string | null {
  const s = stayLength(c, lang);
  if (!s) return null;
  return lang === "es" ? `Hasta ${s}` : `Up to ${s}`;
}

export function officialSource(c: CountryEntry): OfficialSource | null {
  return OFFICIAL_SOURCES[c.code] ?? null;
}

/** The passport's own country: citizens enter freely, so it is never a visa destination. */
export function isHomeCountry(c: CountryEntry | VisaCountry) {
  return "rule" in c
    ? c.rule.entry_permission === "home_country" && c.rule.coverage_status === "logic_only"
    : c.code === PASSPORT.code;
}
