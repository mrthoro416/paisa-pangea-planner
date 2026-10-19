// Official government entry-information sources, kept separate from the UI so
// URLs can be corrected without touching presentation code.
// Countries without a confidently-identified official portal are simply absent:
// the UI then shows "Official source needs verification" instead of a guess.
// Spec: never fabricate government URLs.

export interface OfficialSource {
  url: string;
  label?: string;
}

const SCHENGEN_INFO: OfficialSource = {
  url: "https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en",
  label: "Official Entry Information (EU Commission)",
};

export const OFFICIAL_SOURCES: Record<string, OfficialSource> = {
  // Schengen area — one authoritative EU source
  AT: SCHENGEN_INFO, BE: SCHENGEN_INFO, HR: SCHENGEN_INFO, CZ: SCHENGEN_INFO,
  DK: SCHENGEN_INFO, EE: SCHENGEN_INFO, FI: SCHENGEN_INFO, FR: SCHENGEN_INFO,
  DE: SCHENGEN_INFO, GR: SCHENGEN_INFO, HU: SCHENGEN_INFO, IS: SCHENGEN_INFO,
  IT: SCHENGEN_INFO, LV: SCHENGEN_INFO, LI: SCHENGEN_INFO, LT: SCHENGEN_INFO,
  LU: SCHENGEN_INFO, MT: SCHENGEN_INFO, NL: SCHENGEN_INFO, NO: SCHENGEN_INFO,
  PL: SCHENGEN_INFO, PT: SCHENGEN_INFO, SK: SCHENGEN_INFO, SI: SCHENGEN_INFO,
  ES: SCHENGEN_INFO, SE: SCHENGEN_INFO, CH: SCHENGEN_INFO, RO: SCHENGEN_INFO,
  BG: SCHENGEN_INFO,

  US: { url: "https://travel.state.gov/content/travel/en/us-visas.html", label: "U.S. Department of State — Visas" },
  CA: { url: "https://ircc.canada.ca/english/visit/index.asp", label: "IRCC — Visit Canada" },
  GB: { url: "https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta", label: "Apply for a UK ETA (GOV.UK)" },
  JP: { url: "https://www.mofa.go.jp/j_info/visit/visa/index.html", label: "Japan Ministry of Foreign Affairs — Visa" },
  IN: { url: "https://indianvisaonline.gov.in/evisa/tvoa.html", label: "India e-Visa (official portal)" },
  TR: { url: "https://www.evisa.gov.tr/en/", label: "Republic of Türkiye e-Visa" },
  VN: { url: "https://evisa.gov.vn/", label: "Viet Nam e-Visa (official portal)" },
  TH: { url: "https://www.thaievisa.go.th/", label: "Thailand e-Visa (official portal)" },
  KR: { url: "https://www.hikorea.go.kr/", label: "Hi Korea — Official Immigration Portal" },
  SG: { url: "https://www.ica.gov.sg/", label: "Immigration & Checkpoints Authority" },
  MY: { url: "https://malaysiavisa.imi.gov.my/", label: "Malaysia eVisa (official portal)" },
  ID: { url: "https://evisa.imigrasi.go.id/", label: "Indonesia eVisa (Directorate General of Immigration)" },
  PH: { url: "https://immigration.gov.ph/", label: "Bureau of Immigration" },
  AE: { url: "https://icp.gov.ae/en/", label: "UAE Federal Authority for Identity & Citizenship" },
  EG: { url: "https://visa2egypt.gov.eg/", label: "Egypt e-Visa Portal" },
  LK: { url: "https://www.srilankaevisa.lk/", label: "Sri Lanka eVisa (official portal)" },
  NP: { url: "https://nepaliport.immigration.gov.np/", label: "Nepal Immigration — NepaliPort" },
  KH: { url: "https://www.evisa.gov.kh/", label: "Cambodia eVisa (Ministry of Foreign Affairs)" },
  MM: { url: "https://evisa.moip.gov.mm/", label: "Myanmar eVisa (official portal)" },
  UZ: { url: "https://e-visa.gov.uz/", label: "Uzbekistan e-Visa (official portal)" },
  AZ: { url: "https://evisa.gov.az/", label: "Azerbaijan ASAN eVisa" },
  GE: { url: "https://www.geoconsul.gov.ge/", label: "Georgia Consular Information Portal" },
  RU: { url: "https://evisa.kdmid.ru/", label: "Russia eVisa (official portal)" },
  KE: { url: "https://www.etakenya.go.ke/", label: "Kenya eTA (official portal)" },
  ET: { url: "https://www.evisa.gov.et/", label: "Ethiopia eVisa (official portal)" },
  ZA: { url: "https://www.dha.gov.za/", label: "South Africa Department of Home Affairs" },
  AU: { url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor/600", label: "Australia Home Affairs — Visitor visa" },
  NZ: { url: "https://www.immigration.govt.nz/", label: "Immigration New Zealand" },
  MX: { url: "https://www.inm.gob.mx/", label: "Instituto Nacional de Migración (México)" },
  BR: { url: "https://www.gov.br/mre/en", label: "Brazil Ministry of Foreign Affairs" },
  PE: { url: "https://www.gob.pe/migraciones", label: "Migraciones Perú" },
  CL: { url: "https://serviciomigraciones.cl/", label: "Servicio Nacional de Migraciones (Chile)" },
  AR: { url: "https://www.migraciones.gob.ar/", label: "Dirección Nacional de Migraciones (Argentina)" },
  DO: { url: "https://eticket.migracion.gob.do/", label: "Dominican Republic e-Ticket (official)" },
  IE: { url: "https://www.irishimmigration.ie/", label: "Irish Naturalisation & Immigration Service" },
  PY: { url: "https://www.migracion.gov.py/", label: "Dirección General de Migraciones (Paraguay)" },
  UY: { url: "https://www.migracion.gub.uy/", label: "Dirección Nacional de Migración (Uruguay)" },
  EC: { url: "https://www.migracion.gob.ec/", label: "Ministerio de Migración (Ecuador)" },
  BO: { url: "https://www.migracion.gob.bo/", label: "Dirección General de Migración (Bolivia)" },
  CR: { url: "https://www.migracion.go.cr/", label: "Dirección General de Migración (Costa Rica)" },
  PA: { url: "https://www.migracion.gob.pa/", label: "Servicio Nacional de Migraciones (Panamá)" },
};
