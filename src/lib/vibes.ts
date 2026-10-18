import type { CountryEntry } from "@/data/countries";

export type VibeKey = "beach" | "ski" | "culture" | "nature";

// Curated holiday-style tags by ISO2 code. These are travel-style groupings, not entry data.
const SETS: Record<VibeKey, string> = {
  beach:
    "MX BR CO CR PA BS JM DO CU BB AG LC GD VC KN DM TT BZ PR AW CW HN NI SV EC PE UY VE " +
    "ES PT IT GR HR ME AL TR CY MT FR BG " +
    "TH ID PH MY VN KH LK MV IN AE OM EG MA TN " +
    "AU NZ FJ WS TO VU PF SC MU MZ TZ KE ZA CV MG",
  ski:
    "CH AT FR IT DE SI SK CZ PL AD ES NO SE FI IS BG RO GE AM KZ KG TR " +
    "CA US CL AR JP KR CN NZ AU IR LB MA BA RS MK",
  culture:
    "IT FR ES PT GR GB IE DE AT CZ HU PL NL BE HR TR EG MA JO IL IR UZ " +
    "IN NP CN JP KR TH VN KH LA MM ID LK PE MX GT CU CO BO EC AR BR ET RU GE AM",
  nature:
    "CR EC PE BR CO AR CL BO BZ GT PA NO IS NZ AU CA US " +
    "KE TZ ZA BW NA ZM ZW RW UG MG NP BT ID MY PH LK FI SE GL CH SC MN",
};

const LOOKUP = Object.fromEntries(
  Object.entries(SETS).map(([k, v]) => [k, new Set(v.split(/\s+/).filter(Boolean))]),
) as Record<VibeKey, Set<string>>;

export const VIBES: Array<{ key: VibeKey; label: string }> = [
  { key: "beach", label: "Beaches" },
  { key: "ski", label: "Ski & snow" },
  { key: "culture", label: "Culture" },
  { key: "nature", label: "Nature" },
];

export function matchesVibe(c: CountryEntry, vibe: VibeKey | null) {
  return !vibe || LOOKUP[vibe].has(c.code);
}
