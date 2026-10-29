import type { EntryCategory } from "@/data/countries";
import type { VisaCountry } from "@/lib/visa-rules";
import { isHomeCountry } from "@/lib/entry";

export type FilterKey = "all" | EntryCategory | "stay90" | "stay30";

export interface FilterDef {
  key: FilterKey;
  label: string;
  test: (c: VisaCountry) => boolean;
}

export const FILTERS: FilterDef[] = [
  { key: "all", label: "All", test: () => true },
  {
    key: "visa_free",
    label: "Visa-free",
    test: (c) => !isHomeCountry(c) && c.category === "visa_free",
  },
  {
    key: "visa_on_arrival",
    label: "On arrival",
    test: (c) => !isHomeCountry(c) && c.category === "visa_on_arrival",
  },
  { key: "evisa", label: "eVisa", test: (c) => !isHomeCountry(c) && c.category === "evisa" },
  { key: "eta", label: "ETA", test: (c) => !isHomeCountry(c) && c.category === "eta" },
  {
    key: "visa_required",
    label: "Visa req.",
    test: (c) => !isHomeCountry(c) && c.category === "visa_required",
  },
  ...(["freedom_of_movement", "travel_permit_required", "entry_banned", "unknown"] as const).map(
    (key) => ({
      key,
      label: {
        freedom_of_movement: "Free movement",
        travel_permit_required: "Travel permit",
        entry_banned: "Restriction",
        unknown: "Unconfirmed",
      }[key],
      test: (c: VisaCountry) => !isHomeCountry(c) && c.category === key,
    }),
  ),
  {
    key: "stay90",
    label: "90+ days",
    test: (c) => !isHomeCountry(c) && isAccessible(c) && (c.maxStayDays ?? 0) >= 90,
  },
  {
    key: "stay30",
    label: "30+ days",
    test: (c) => !isHomeCountry(c) && isAccessible(c) && (c.maxStayDays ?? 0) >= 30,
  },
];

export const filterByKey = new Map(FILTERS.map((f) => [f.key, f]));

/** Countries a Colombian passport can reach without applying in advance at an embassy. */
export function isAccessible(c: VisaCountry) {
  return (
    !isHomeCountry(c) &&
    ["visa_free", "visa_on_arrival", "evisa", "eta", "freedom_of_movement"].includes(c.category)
  );
}

export function formatVerified(iso: string, lang: "en" | "es" = "en") {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString(lang === "es" ? "es-CO" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    .replace(/\./g, "")
    .toUpperCase();
}
