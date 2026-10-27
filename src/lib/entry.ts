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

export const UNKNOWN_META = { key: "unknown", label: "Visa information not available", short: "Unknown", description: "Not yet verified", colorVar: "--muted-foreground" } as const;
export const HOME_META = { key: "home_country", label: "Home country", short: "Home country", description: "Home-country logic, not a visa-policy record", colorVar: "--beacon" } as const;
export function categoryMeta(c: CountryEntry | VisaCountry) {
  if (isHomeCountry(c)) return HOME_META;
  return c.category === "unknown" ? UNKNOWN_META : CATEGORIES[c.category];
}

/** Stay length without the "Up to" prefix, e.g. "90 days" / "90 días". */
export function stayLength(c: CountryEntry, lang: Lang = "en"): string | null {
  if (c.maxStayDays == null) return null;
  if (c.maxStayDays >= 365) {
    const y = Math.round(c.maxStayDays / 365);
    return lang === "es" ? `${y} año${y > 1 ? "s" : ""}` : `${y} year${y > 1 ? "s" : ""}`;
  }
  const d = c.maxStayDays;
  return lang === "es" ? `${d} día${d === 1 ? "" : "s"}` : `${d} day${d === 1 ? "" : "s"}`;
}

export function maxStayText(c: CountryEntry, lang: Lang = "en"): string | null {
  const s = stayLength(c, lang);
  if (!s) return null;
  return lang === "es" ? `Hasta ${s}` : `Up to ${s}`;
}

const ITEMS_ES: Record<EntryCategory, string[]> = {
  visa_free: [
    "Pasaporte vigente durante toda la estadía; muchos países exigen 6 meses de vigencia",
    "Pueden pedir tiquete de regreso o de salida al registrarte o al llegar",
    "Pueden pedir prueba de alojamiento y de fondos suficientes",
  ],
  visa_on_arrival: [
    "Pasaporte vigente al menos 6 meses después de la llegada",
    "La visa se paga en la frontera: lleva efectivo en la moneda aceptada",
    "Normalmente se exige tiquete de regreso o salida y prueba de alojamiento",
    "Las filas en los mostradores de llegada pueden ser largas; revisa los puntos de entrada habilitados",
  ],
  evisa: [
    "Solicítala en línea con bastante anticipación; el tiempo de trámite varía",
    "Pasaporte vigente al menos 6 meses después de la llegada",
    "Suelen pedir foto digital del pasaporte y datos del alojamiento",
    "Imprime o guarda la visa aprobada para mostrarla al registrarte y en la frontera",
  ],
  eta: [
    "La autorización debe estar aprobada antes de abordar; la mayoría se tramita rápido en línea",
    "Pasaporte vigente durante toda la estadía",
    "La aerolínea puede pedir tiquete de regreso o de salida",
  ],
  visa_required: [
    "Solicítala en una embajada o consulado (o su centro oficial de visas) antes de viajar",
    "Las solicitudes suelen exigir cartas de invitación, itinerario y extractos bancarios",
    "El trámite puede tardar semanas; solicítala con anticipación",
    "Normalmente se exige pasaporte con más de 6 meses de vigencia",
  ],
};

// Requirement notes are generic, standard entry conditions — shown only where
// they plausibly apply, never country-specific claims we can't verify.
export function requirementItems(c: CountryEntry, lang: Lang = "en"): string[] {
  if (lang === "es") {
    let items = [...ITEMS_ES[c.category]];
    if (c.category === "visa_free") {
      if ((c.maxStayDays ?? 0) <= 30) items = items.filter((_, i) => i !== 1);
      if (c.maxStayDays != null) items.push(`Estadía máxima: ${stayLength(c, "es")} por visita`);
    }
    if (c.note) items.push(c.note);
    return items;
  }
  const items: string[] = [];
  switch (c.category) {
    case "visa_free":
      items.push("Passport valid for the duration of the stay — many countries require 6 months' validity");
      if ((c.maxStayDays ?? 0) > 30) items.push("Return or onward ticket may be requested at check-in or arrival");
      items.push("Proof of accommodation and sufficient funds may be requested");
      if (c.maxStayDays != null) items.push(`Maximum stay: ${stayLength(c)} per visit`);
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

export function requirementSummary(c: CountryEntry, lang: Lang = "en", name: string = c.name): string {
  const stayTxt = stayLength(c, lang);
  if (lang === "es") {
    switch (c.category) {
      case "visa_free":
        return `Con pasaporte colombiano puedes entrar a ${name} sin visa por turismo de corta duración${stayTxt ? ` por estadías de hasta ${stayTxt}` : ""}.`;
      case "visa_on_arrival":
        return `Con pasaporte colombiano puedes obtener la visa al llegar a ${name}, en la frontera${stayTxt ? `; normalmente por ${stayTxt}` : ""}.`;
      case "evisa":
        return `Con pasaporte colombiano debes completar la solicitud de visa en línea de ${name} antes de viajar${stayTxt ? `; lo usual son estadías de ${stayTxt}` : ""}.`;
      case "eta":
        return `Con pasaporte colombiano necesitas una autorización electrónica de viaje o registro antes de viajar a ${name}${stayTxt ? `; se permiten ${stayTxt}` : ""}.`;
      case "visa_required":
        return `Con pasaporte colombiano debes obtener una visa en la embajada o el consulado de ${name} antes de viajar.`;
    }
  }
  const stayClause = stayTxt ? ` for stays of up to ${stayTxt}` : "";
  switch (c.category) {
    case "visa_free":
      return `Colombian passport holders may enter ${name} without a visa for short-term tourism${stayClause}.`;
    case "visa_on_arrival":
      return `Colombian passport holders can obtain a visa on arrival in ${name} at the border${stayTxt ? ` — typically ${stayTxt}` : ""}.`;
    case "evisa":
      return `Colombian passport holders must complete ${name}'s online visa application before traveling${stayTxt ? ` — stays of ${stayTxt} are typical` : ""}.`;
    case "eta":
      return `Colombian passport holders need an electronic travel authorization or registration before traveling to ${name}${stayTxt ? ` — ${stayTxt} permitted` : ""}.`;
    case "visa_required":
      return `Colombian passport holders must obtain a visa from ${name}'s embassy or consulate before traveling.`;
  }
}

export function officialSource(c: CountryEntry): OfficialSource | null {
  return OFFICIAL_SOURCES[c.code] ?? null;
}

/** The passport's own country: citizens enter freely, so it is never a visa destination. */
export function isHomeCountry(c: CountryEntry | VisaCountry) {
  return "rule" in c ? c.rule.entry_permission === "home_country" && c.rule.coverage_status === "logic_only" : c.code === PASSPORT.code;
}
