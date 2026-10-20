import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "es";
export const LANG_KEY = "paisa-lang";

/** Countries where Spanish is the main language — used to suggest Spanish from the visitor's IP. */
export const SPANISH_COUNTRIES = new Set([
  "CO", "ES", "MX", "AR", "CL", "PE", "VE", "EC", "BO", "PY", "UY", "CR", "PA", "GT", "HN", "SV", "NI", "DO", "CU", "PR", "GQ",
]);

const ES: Record<string, string> = {
  // Categories
  "Visa-free": "Sin visa",
  "Visa on arrival": "Visa a la llegada",
  "On arrival": "A la llegada",
  eVisa: "Visa electrónica",
  "ETA / Authorization": "ETA / Autorización",
  ETA: "ETA",
  "Visa required": "Visa requerida",
  "Passport only — no visa or electronic authorization required for a standard short-term tourist visit.":
    "Solo pasaporte: no se requiere visa ni autorización electrónica para una visita turística corta.",
  "Obtain the visa after arriving at the destination — apply and pay at the border.":
    "La visa se obtiene al llegar al destino: se solicita y se paga en la frontera.",
  "Complete an online visa application before traveling.": "Completa una solicitud de visa en línea antes de viajar.",
  "Electronic travel authorization, tourist registration or arrival card required before travel.":
    "Se requiere autorización electrónica de viaje, registro turístico o tarjeta de llegada antes de viajar.",
  "Traditional visa through an embassy or consulate application required before travel.":
    "Se requiere una visa tradicional tramitada en una embajada o consulado antes de viajar.",
  // Filters
  All: "Todos",
  "Visa req.": "Con visa",
  "90+ days": "90+ días",
  "30+ days": "30+ días",
  "Filter destinations": "Filtrar destinos",
  // Vibes
  Beaches: "Playas",
  "Ski & snow": "Esquí y nieve",
  Culture: "Cultura",
  Nature: "Naturaleza",
  "Holiday style": "Tipo de viaje",
  // Home / HUD
  "without embassy visa": "sin visa de embajada",
  passport: "pasaporte",
  verified: "verificado",
  "Paisa Planner — reset globe and start over": "Paisa Planner: reiniciar el globo",
  "Reset and start over": "Reiniciar",
  "Search destinations": "Buscar destinos",
  "Where to?": "¿A dónde?",
  "Data & sources": "Datos y fuentes",
  "Switch to light mode": "Cambiar a modo claro",
  "Switch to dark mode": "Cambiar a modo oscuro",
  "Switch to Spanish": "Cambiar a inglés",
  "Interactive globe of entry requirements for Colombian passport holders":
    "Globo interactivo de requisitos de entrada para pasaportes colombianos",
  // Sheet
  "entry requirements": "requisitos de entrada",
  Close: "Cerrar",
  "Collapse details": "Contraer detalles",
  "Expand details": "Ampliar detalles",
  days: "días",
  Entry: "Entrada",
  Type: "Tipo",
  Stay: "Estadía",
  Passport: "Pasaporte",
  Varies: "Varía",
  Requirements: "Requisitos",
  Verified: "Verificado",
  Date: "Fecha",
  Source: "Fuente",
  "Needs verification": "Requiere verificación",
  "Official entry information": "Información oficial de entrada",
  "Official source needs verification": "La fuente oficial requiere verificación",
  "Entry rules change. Always confirm with official government sources before booking. Links open in a new tab.":
    "Las reglas de entrada cambian. Confirma siempre con fuentes oficiales del gobierno antes de reservar. Los enlaces se abren en una pestaña nueva.",
  "Home country": "País de origen",
  "Citizen — no visa": "Ciudadano: sin visa",
  "No limit": "Sin límite",
  // Climate
  "Average weather": "Clima promedio",
  "Other months": "Otros meses",
  "Choose a month": "Elige un mes",
  "mm rain": "mm de lluvia",
  // Search
  "Japan, visa-free Europe, 90 days…": "Japón, Europa sin visa, 90 días…",
  "Search countries, regions or entry types": "Busca países, regiones o tipos de entrada",
  Suggested: "Sugeridos",
  "No matches": "Sin resultados",
  Filter: "Filtro",
  destinations: "destinos",
  "Fly to": "Ir a",
  // Regions
  Africa: "África",
  Americas: "América",
  Asia: "Asia",
  Europe: "Europa",
  Oceania: "Oceanía",
  // About
  "Back to the map": "Volver al mapa",
  "← Back to map": "← Volver al mapa",
  "About this guide": "Sobre esta guía",
  "The five categories": "Las cinco categorías",
  "Where the data comes from": "De dónde vienen los datos",
  "Verify before you travel": "Verifica antes de viajar",
  "Your privacy": "Tu privacidad",
  "Open the world map →": "Abrir el mapa mundial →",
};

const LONG: Record<Lang, Record<string, string>> = {
  en: {
    aboutIntro:
      "Paisa Planner answers one question: as a {passport} passport holder, what do you need to enter a country? Every destination is classified into one of five entry categories, and the map, search, legend and statistics all derive from a single structured dataset.",
    aboutData:
      "Visa classifications are compiled from the open-source passport-index dataset (github.com/ilyankou/passport-index-dataset), which aggregates official government announcements and IATA travel information, reviewed as of {date}. Links in each country panel point to official government portals wherever one could be confidently identified — destinations without a verified official source say so explicitly instead of guessing.",
    aboutVerify:
      "Entry requirements can change at short notice. Always verify current requirements with the destination's official immigration or foreign ministry website — and with your airline — before traveling. This guide is an information tool, not a visa service.",
    aboutPrivacy:
      "Paisa Planner collects nothing: no passport numbers, no dates of birth, no payment details. The map and country data are cached on your device so the guide keeps working offline.",
    homeBody: "This is the passport's home country. {passport} citizens don't need a visa to enter or stay.",
    confirmEmbassy: "Confirm with the embassy or consulate of {name} before travel.",
    climateNote: "Long-term averages near the geographic centre of {name} (NASA POWER climatology). Coasts and mountains can differ.",
  },
  es: {
    aboutIntro:
      "Paisa Planner responde una pregunta: con pasaporte de {passport}, ¿qué necesitas para entrar a un país? Cada destino se clasifica en una de cinco categorías de entrada, y el mapa, la búsqueda, la leyenda y las estadísticas salen de un mismo conjunto de datos.",
    aboutData:
      "Las clasificaciones de visa provienen del conjunto de datos abierto passport-index (github.com/ilyankou/passport-index-dataset), que reúne anuncios oficiales de gobiernos e información de viaje de IATA, revisado al {date}. Los enlaces de cada país llevan a portales oficiales del gobierno cuando se pudo identificar uno con certeza; los destinos sin fuente oficial verificada lo indican en lugar de adivinar.",
    aboutVerify:
      "Los requisitos de entrada pueden cambiar sin previo aviso. Verifica siempre los requisitos vigentes en el sitio oficial de migración o cancillería del destino, y con tu aerolínea, antes de viajar. Esta guía es una herramienta informativa, no un servicio de visas.",
    aboutPrivacy:
      "Paisa Planner no recopila nada: ni números de pasaporte, ni fechas de nacimiento, ni datos de pago. El mapa y los datos se guardan en tu dispositivo para que la guía funcione sin conexión.",
    homeBody: "Este es el país de origen del pasaporte. Los ciudadanos de {passport} no necesitan visa para entrar ni quedarse.",
    confirmEmbassy: "Confirma con la embajada o el consulado de {name} antes de viajar.",
    climateNote: "Promedios de largo plazo cerca del centro geográfico de {name} (climatología NASA POWER). Las costas y montañas pueden variar.",
  },
};

export const MONTHS: Record<Lang, { short: string[]; full: string[] }> = {
  en: {
    short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    full: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
  es: {
    short: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    full: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  },
};

export function translate(lang: Lang, s: string) {
  return lang === "es" ? (ES[s] ?? s) : s;
}

export function longText(lang: Lang, key: keyof (typeof LONG)["en"], vars: Record<string, string> = {}) {
  return (LONG[lang][key] ?? "").replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

const esNames = new Map<string, string>();
/** Country name in the chosen language (Spanish via the browser's built-in country names). */
export function localName(lang: Lang, c: { code: string; name: string }) {
  if (lang === "en") return c.name;
  let n = esNames.get(c.code);
  if (n == null) {
    try {
      n = new Intl.DisplayNames(["es"], { type: "region" }).of(c.code) ?? c.name;
    } catch {
      n = c.name;
    }
    if (n === c.code) n = c.name;
    esNames.set(c.code, n);
  }
  return n;
}

interface Ctx {
  lang: Lang;
  /** True once the visitor has picked a language (or a saved choice exists). */
  chosen: boolean;
  setLang: (l: Lang) => void;
  t: (s: string) => string;
  name: (c: { code: string; name: string }) => string;
}

const LangContext = createContext<Ctx>({
  lang: "en",
  chosen: true,
  setLang: () => {},
  t: (s) => s,
  name: (c) => c.name,
});

export function LangProvider({ children }: { children: ReactNode }) {
  // Start in English with "chosen" so SSR and first client render match; sync after hydration.
  const [lang, setLangState] = useState<Lang>("en");
  const [chosen, setChosen] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "es") setLangState(saved);
    else setChosen(false);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    window.localStorage.setItem(LANG_KEY, l);
    setLangState(l);
    setChosen(true);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, chosen, setLang, t: (s) => translate(lang, s), name: (c) => localName(lang, c) }),
    [lang, chosen, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
