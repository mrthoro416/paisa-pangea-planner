import type { CountryEntry, EntryCategory } from "@/data/countries";
import { OFFICIAL_SOURCES, type OfficialSource } from "@/data/sources";

export const CATEGORY_ORDER: EntryCategory[] = [
  "visa_free",
  "visa_on_arrival",
  "evisa",
  "eta",
  "visa_required",
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
  visa_free: {
    key: "visa_free",
    label: "Visa-free",
    short: "Visa-free",
    description: "Passport only — no visa or electronic authorization required for a standard short-term tourist visit.",
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
    label: "eVisa",
    short: "eVisa",
    description: "Complete an online visa application before traveling.",
    colorVar: "--cat-purple",
  },
  eta: {
    key: "eta",
    label: "ETA / Authorization",
    short: "ETA",
    description: "Electronic travel authorization, tourist registration or arrival card required before travel.",
    colorVar: "--cat-yellow",
  },
  visa_required: {
    key: "visa_required",
    label: "Visa required",
    short: "Visa required",
    description: "Traditional visa through an embassy or consulate application required before travel.",
    colorVar: "--cat-orange",
  },
};

export function categoryMeta(c: CountryEntry): CategoryMeta {
  return CATEGORIES[c.category];
}

export function maxStayText(c: CountryEntry): string | null {
  if (c.maxStayDays == null) return null;
  if (c.maxStayDays >= 365) {
    const years = c.maxStayDays / 365;
    return years === 1 ? "Up to 1 year" : `Up to ${Math.round(years)} year${years > 1 ? "s" : ""}`;
  }
  return `Up to ${c.maxStayDays} day${c.maxStayDays === 1 ? "" : "s"}`;
}

// Requirement notes are generic, standard entry conditions — shown only where
// they plausibly apply, never country-specific claims we can't verify.
export function requirementItems(c: CountryEntry): string[] {
  const items: string[] = [];
  switch (c.category) {
    case "visa_free":
      items.push("Passport valid for the duration of the stay — many countries require 6 months' validity");
      if ((c.maxStayDays ?? 0) > 30) items.push("Return or onward ticket may be requested at check-in or arrival");
      items.push("Proof of accommodation and sufficient funds may be requested");
      if (c.maxStayDays != null) items.push(`Maximum stay: ${maxStayText(c)?.replace("Up to ", "")} per visit`);
      break;
    case "visa_on_arrival":
      items.push("Passport valid for at least 6 months beyond arrival");
      items.push("Visa fee is paid at the border — carry cash in the accepted currency");
      items.push("Return/onward ticket and proof of accommodation usually required");
      items.push("Queues at arrival counters can be long — check eligible entry points");
      break;
    case "evisa":
      items.push("Apply online well before departure — processing time varies");
      items.push("Passport valid for at least 6 months beyond arrival");
      items.push("Digital passport photo and accommodation details commonly required");
      items.push("Print or save the approved eVisa to show at check-in and the border");
      break;
    case "eta":
      items.push("Authorization must be approved before boarding — most are processed quickly online");
      items.push("Passport valid for the duration of the stay");
      items.push("Return/onward ticket may be requested by the carrier");
      break;
    case "visa_required":
      items.push("Apply at an embassy or consulate (or its official visa centre) before travel");
      items.push("Applications typically require invitation letters, itinerary and bank statements");
      items.push("Processing can take weeks — apply well in advance");
      items.push("Passport validity beyond 6 months is commonly required");
      break;
  }
  if (c.note) items.push(c.note);
  return items;
}

export function requirementSummary(c: CountryEntry): string {
  const stayTxt = maxStayText(c)?.replace(/^Up to /, "") ?? null;
  const stayClause = stayTxt ? ` for stays of up to ${stayTxt}` : "";
  switch (c.category) {
    case "visa_free":
      return `Colombian passport holders may enter ${c.name} without a visa for short-term tourism${stayClause}.`;
    case "visa_on_arrival":
      return `Colombian passport holders can obtain a visa on arrival in ${c.name} at the border${stayTxt ? ` — typically ${stayTxt.toLowerCase()}` : ""}.`;
    case "evisa":
      return `Colombian passport holders must complete ${c.name}'s online visa application before traveling${stayTxt ? ` — stays of ${stayTxt.toLowerCase()} are typical` : ""}.`;
    case "eta":
      return `Colombian passport holders need an electronic travel authorization or registration before traveling to ${c.name}${stayTxt ? ` — ${stayTxt.toLowerCase()} permitted` : ""}.`;
    case "visa_required":
      return `Colombian passport holders must obtain a visa from ${c.name}'s embassy or consulate before traveling.`;
  }
}

export function officialSource(c: CountryEntry): OfficialSource | null {
  return OFFICIAL_SOURCES[c.code] ?? null;
}
