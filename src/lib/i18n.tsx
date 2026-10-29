import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "es";
export const LANG_KEY = "paisa-lang";

/** Countries where Spanish is the main language — used to suggest Spanish from the visitor's IP. */
export const SPANISH_COUNTRIES = new Set([
  "CO",
  "ES",
  "MX",
  "AR",
  "CL",
  "PE",
  "VE",
  "EC",
  "BO",
  "PY",
  "UY",
  "CR",
  "PA",
  "GT",
  "HN",
  "SV",
  "NI",
  "DO",
  "CU",
  "PR",
  "GQ",
]);

const ES: Record<string, string> = {
  "Freedom of movement": "Libre circulación",
  "Free movement": "Libre circulación",
  "Travel permit required": "Permiso de viaje requerido",
  "Travel permit": "Permiso de viaje",
  "Entry restriction reported": "Restricción de entrada reportada",
  Restriction: "Restricción",
  "Requirements unconfirmed": "Requisitos sin confirmar",
  Unconfirmed: "Sin confirmar",
  "Information unavailable": "Información no disponible",
  "eVisa required": "Visa electrónica requerida",
  "Electronic travel authorisation required": "Autorización electrónica de viaje requerida",
  "Choose your passport": "Elige tu pasaporte",
  "Planning data": "Datos orientativos",
  Imported: "Importado",
  "Imported planning data": "Datos orientativos importados",
  Discrepancies: "Discrepancias",
  "Entry categories": "Categorías de entrada",
  "Registered sources": "Fuentes registradas",
  "Colombian discrepancies retained": "Discrepancias colombianas conservadas",
  "Choose your passport nationality, not your residence or location. Sourced planning data covers 199 passports; confirm entry rules before booking.":
    "Elige la nacionalidad de tu pasaporte, no tu residencia o ubicación. Los datos orientativos cubren 199 pasaportes; confirma las reglas de entrada antes de reservar.",
  "Sourced planning data covers 199 passports and 199 destinations. Not every pair is independently verified. Confirm entry rules before booking.":
    "Los datos orientativos cubren 199 pasaportes y 199 destinos. No todas las combinaciones están verificadas individualmente. Confirma las reglas de entrada antes de reservar.",
  "Colombian discrepancy — review pending": "Discrepancia colombiana — revisión pendiente",
  "Existing Colombian result retained until reviewed.":
    "Se conserva el resultado colombiano existente hasta su revisión.",
  "Workbook category": "Categoría del archivo",
  "Workbook stay": "Estadía del archivo",
  "Existing source date": "Fecha de la fuente existente",
  "Workbook details": "Detalles del archivo",
  "Raw requirement": "Requisito original",
  "Extension (days)": "Extensión (días)",
  "Stay window": "Período de estadía",
  "Window (days)": "Período (días)",
  "Visa type IDs": "Identificadores de visa",
  "Workbook source": "Fuente del archivo",
  "Source level": "Nivel de fuente",
  "Passport–destination source": "Fuente de pasaporte–destino",
  "Destination policy source": "Fuente de política del destino",
  "Source provenance": "Procedencia de la fuente",
  "Publisher last verified": "Última verificación del editor",
  "Publisher source date — not an official review by Paisa Planner.":
    "Fecha de revisión del editor; no es una verificación oficial de Paisa Planner.",
  "Open recorded source — new tab": "Abrir fuente registrada — pestaña nueva",
  "Source archive — new tab": "Archivo de la fuente — pestaña nueva",
  "Open recorded entry source": "Abrir fuente de entrada registrada",
  "Ordinary passports, direct entry, short-stay tourism only. Transit, work, study and residence exceptions are not fully covered.":
    "Solo pasaportes ordinarios, entrada directa y turismo de corta duración. No se cubren plenamente tránsito, trabajo, estudio ni excepciones por residencia.",
  "Free movement reported by the source; confirm applicable conditions.":
    "La fuente informa libre circulación; confirma las condiciones aplicables.",
  "A special travel permit is reported; verify eligibility with the linked source.":
    "Se informa un permiso especial de viaje; verifica la elegibilidad con la fuente enlazada.",
  "An entry restriction is reported; exceptions are not fully covered.":
    "Se informa una restricción de entrada; no se cubren todas las excepciones.",
  "Unconfirmed does not mean visa-free or entry permitted.":
    "Sin confirmar no significa entrada sin visa ni entrada permitida.",
  "first-party": "Autoridad del destino",
  "third-party-government": "Gobierno de un tercer país",
  intergovernmental: "Organismo intergubernamental",
  "designated-operator": "Operador designado",

  Unknown: "Desconocido",
  "Visa information not available": "Información de visa no disponible",
  "Not yet verified": "Aún no verificado",
  "Only Colombian passport rules are imported so far. Other passports show unknown results, not Colombian rules. Confirm current eligibility with official authorities.":
    "Por ahora solo se importaron reglas para pasaportes colombianos. Otros pasaportes muestran resultados desconocidos, no reglas colombianas. Confirma tu elegibilidad actual con las autoridades oficiales.",
  Partial: "Parcial",
  Missing: "Sin datos",
  "Partial — imported": "Parcial — importado",
  "Home-country logic": "Lógica del país de origen",
  "Home-country logic, not a visa-policy record":
    "Lógica del país de origen, no un registro de política de visas",
  "View coverage": "Ver cobertura",
  Coverage: "Cobertura",
  "Passport data coverage": "Cobertura de datos por pasaporte",
  "Passport options": "Opciones de pasaporte",
  Pairs: "Combinaciones",
  "Officially verified": "Verificados oficialmente",
  "Coverage status": "Estado de cobertura",
  Provenance: "Procedencia",
  "Source date": "Fecha del conjunto de datos",
  "Official verification": "Verificación oficial",
  "Not available": "No disponible",
  "Source conditions": "Condiciones de la fuente",
  "Original source note (English)": "Nota original de la fuente (en inglés)",
  "Travel documents": "Documentos de viaje",
  "Dataset-derived guidance, not individually verified against official authorities.":
    "Orientación derivada de un conjunto de datos, no verificada individualmente con las autoridades oficiales.",
  "No usable rule for this passport and destination. Missing data does not mean visa-free.":
    "No hay una regla disponible para este pasaporte y destino. La falta de datos no significa entrada sin visa.",
  "Passport-specific document requirements are not available in this workbook.":
    "Este archivo no contiene requisitos de documentos específicos para cada pasaporte.",
  "General guidance — not confirmed entry requirements":
    "Orientación general — no son requisitos de entrada confirmados",
  "Ask the destination authority about passport validity, visa/eVisa/ETA applications, stay limits, return tickets, accommodation, funds, insurance and vaccinations. Applicability has not been confirmed for this pair.":
    "Consulta con la autoridad del destino sobre vigencia del pasaporte, solicitudes de visa/eVisa/ETA, límites de estadía, tiquetes de regreso, alojamiento, fondos, seguro y vacunas. No se ha confirmado su aplicación para esta combinación.",
  "Confirm eligibility for your passport with the destination authority. Links open in a new tab.":
    "Confirma la elegibilidad de tu pasaporte con la autoridad del destino. Los enlaces se abren en una pestaña nueva.",
  "Original workbook audit fields": "Campos originales de auditoría del archivo",
  "Inherited workbook date — not an official review":
    "Fecha heredada del archivo — no es una revisión oficial",
  "Passport-issuer authority links are not supplied. New sources require licensing, provenance, update cadence and field-definition review before use.":
    "No se proporcionaron enlaces de las autoridades emisoras de pasaportes. Las nuevas fuentes requieren revisión de licencia, procedencia, frecuencia de actualización y definición de campos antes de usarse.",
  "Interactive passport-aware travel globe": "Globo interactivo de viajes según el pasaporte",

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
  "Complete an online visa application before traveling.":
    "Completa una solicitud de visa en línea antes de viajar.",
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
  "On arrival ": "a la llegada",
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
  // Passport preference
  "Which country issued your passport?": "¿Qué país emitió tu pasaporte?",
  "Visa results are for Colombian passport holders only — changing your passport here doesn't change the results yet.":
    "Los resultados de visa son solo para pasaportes colombianos: cambiar tu pasaporte aquí aún no cambia los resultados.",
  "Your passport": "Tu pasaporte",
  "Change passport": "Cambiar pasaporte",
  "Search countries…": "Buscar países…",
  Selected: "Seleccionado",
};

const LONG: Record<Lang, Record<string, string>> = {
  en: {
    aboutIntro:
      "Paisa Planner connects your saved passport choice to available destination rules. The workbook covers 199 passports and 199 destinations. Unconfirmed rules remain unknown; Colombian discrepancies retain the earlier result pending review. Climate and holiday styles remain available for every destination.",
    aboutData:
      "TravelRequirements.info v1.3.0, dataset modified {date}, supplies the canonical rules. Source citations may apply to a passport–destination pair or only to the destination policy. Publisher verification dates are not independent checks by Paisa Planner. Earlier Colombian rules are retained where categories or stay limits conflict. Ordinary passports, direct entry and short-stay tourism only; no passport-issuer links or complete supporting-document lists are supplied.",
    aboutVerify:
      "Entry requirements can change at short notice. Always verify current requirements with the destination's official immigration or foreign ministry website — and with your airline — before traveling. This guide is an information tool, not a visa service.",
    aboutPrivacy:
      "Paisa Planner collects nothing: no passport numbers, no dates of birth, no payment details. The map and country data are cached on your device so the guide keeps working offline.",
    homeBody:
      "This is the passport's home country. {passport} citizens don't need a visa to enter or stay.",
    confirmEmbassy: "Confirm with the embassy or consulate of {name} before travel.",
    climateNote:
      "Long-term averages near the geographic centre of {name} (NASA POWER climatology). Coasts and mountains can differ.",
  },
  es: {
    aboutIntro:
      "Paisa Planner conecta tu elección de pasaporte con las reglas disponibles de cada destino. El archivo cubre 199 pasaportes y 199 destinos. Las reglas sin confirmar siguen siendo desconocidas; las discrepancias colombianas conservan el resultado anterior hasta su revisión. El clima y los estilos de viaje siguen disponibles para todos los destinos.",
    aboutData:
      "TravelRequirements.info v1.3.0, modificado el {date}, proporciona las reglas. Las fuentes pueden corresponder a la combinación pasaporte–destino o solo a la política del destino. Las fechas del editor no son verificaciones independientes de Paisa Planner. Se conservan reglas colombianas anteriores cuando hay diferencias de categoría o estadía. Solo pasaportes ordinarios, entrada directa y turismo corto; no hay enlaces de emisores ni listas completas de documentos.",
    aboutVerify:
      "Los requisitos de entrada pueden cambiar sin previo aviso. Verifica siempre los requisitos vigentes en el sitio oficial de migración o cancillería del destino, y con tu aerolínea, antes de viajar. Esta guía es una herramienta informativa, no un servicio de visas.",
    aboutPrivacy:
      "Paisa Planner no recopila nada: ni números de pasaporte, ni fechas de nacimiento, ni datos de pago. El mapa y los datos se guardan en tu dispositivo para que la guía funcione sin conexión.",
    homeBody:
      "Este es el país de origen del pasaporte. Los ciudadanos de {passport} no necesitan visa para entrar ni quedarse.",
    confirmEmbassy: "Confirma con la embajada o el consulado de {name} antes de viajar.",
    climateNote:
      "Promedios de largo plazo cerca del centro geográfico de {name} (climatología NASA POWER). Las costas y montañas pueden variar.",
  },
};

export const MONTHS: Record<Lang, { short: string[]; full: string[] }> = {
  en: {
    short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    full: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  es: {
    short: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    full: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
  },
};

export function translate(lang: Lang, s: string) {
  return lang === "es" ? (ES[s] ?? s) : s;
}

export function longText(
  lang: Lang,
  key: keyof (typeof LONG)["en"],
  vars: Record<string, string> = {},
) {
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
    () => ({
      lang,
      chosen,
      setLang,
      t: (s) => translate(lang, s),
      name: (c) => localName(lang, c),
    }),
    [lang, chosen, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
