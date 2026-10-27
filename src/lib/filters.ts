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
  { key: "visa_free", label: "Visa-free", test: (c) => !isHomeCountry(c) && c.category === "visa_free" },
  { key: "visa_on_arrival", label: "On arrival", test: (c) => !isHomeCountry(c) && c.category === "visa_on_arrival" },
  { key: "evisa", label: "eVisa", test: (c) => !isHomeCountry(c) && c.category === "evisa" },
  { key: "eta", label: "ETA", test: (c) => !isHomeCountry(c) && c.category === "eta" },
  { key: "visa_required", label: "Visa req.", test: (c) => !isHomeCountry(c) && c.category === "visa_required" },
  {
    key: "stay90",
    label: "90+ days",
    test: (c) => !isHomeCountry(c) && c.category !== "unknown" && c.category !== "visa_required" && (c.maxStayDays ?? 0) >= 90,
  },
  {
    key: "stay30",
    label: "30+ days",
    test: (c) => !isHomeCountry(c) && c.category !== "unknown" && c.category !== "visa_required" && (c.maxStayDays ?? 0) >= 30,
  },
];

export const filterByKey = new Map(FILTERS.map((f) => [f.key, f]));

/** Countries a Colombian passport can reach without applying in advance at an embassy. */
export function isAccessible(c: VisaCountry) {
  return !isHomeCountry(c) && c.category !== "unknown" && c.category !== "visa_required";
}

export function formatVerified(iso: string, lang: "en" | "es" = "en") {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString(lang === "es" ? "es-CO" : "en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .replace(/\./g, "")
    .toUpperCase();
}
