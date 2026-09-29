import type { CountryEntry, EntryCategory } from "@/data/countries";

export type FilterKey = "all" | EntryCategory | "stay90" | "stay30";

export interface FilterDef {
  key: FilterKey;
  label: string;
  test: (c: CountryEntry) => boolean;
}

export const FILTERS: FilterDef[] = [
  { key: "all", label: "All", test: () => true },
  { key: "visa_free", label: "Visa-free", test: (c) => c.category === "visa_free" },
  { key: "visa_on_arrival", label: "On arrival", test: (c) => c.category === "visa_on_arrival" },
  { key: "evisa", label: "eVisa", test: (c) => c.category === "evisa" },
  { key: "eta", label: "ETA", test: (c) => c.category === "eta" },
  { key: "visa_required", label: "Visa req.", test: (c) => c.category === "visa_required" },
  {
    key: "stay90",
    label: "90+ days",
    test: (c) => c.category !== "visa_required" && (c.maxStayDays ?? 0) >= 90,
  },
  {
    key: "stay30",
    label: "30+ days",
    test: (c) => c.category !== "visa_required" && (c.maxStayDays ?? 0) >= 30,
  },
];

export const filterByKey = new Map(FILTERS.map((f) => [f.key, f]));

/** Countries a Colombian passport can reach without applying in advance at an embassy. */
export function isAccessible(c: CountryEntry) {
  return c.category !== "visa_required";
}

export function formatVerified(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}
