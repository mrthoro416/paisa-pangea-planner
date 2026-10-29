import matrix from "@/data/global-travel-rules.json";
import { COUNTRIES, type CountryEntry, type EntryCategory } from "@/data/countries";

export type CoverageStatus = "partial" | "logic_only" | "missing" | "verified";
export interface WorkbookRule {
  destination_iso2: string; destination_name: string; passport_code: string; passport_country: string;
  requirement_raw: string; app_category: EntryCategory; max_stay_days: number | null;
  extendable_days: number | null; visa_type_ids: string | null; stay_window_basis: string | null; stay_window_days: number | null;
  destination_rule_source: string | null; source_url: string | null; source_provenance: string | null;
  source_level: string | null; source_last_verified: string | null; source_archive_url: string | null; unverifiable_reason: string | null;
}
export interface DocumentRequirement {
  type:
    | "passport_validity"
    | "visa_application"
    | "evisa_application"
    | "eta_application"
    | "stay_limit"
    | "return_ticket"
    | "accommodation"
    | "funds"
    | "insurance"
    | "vaccination"
    | "other";
  status: "required" | "conditional" | "recommended" | "unknown";
  description: string;
  applicability: string;
  source_authority: string | null;
  source_url: string | null;
  verification_status: string;
  verified_at: string | null;
}
export interface VisaRule {
  passport_code: string;
  destination_code: string;
  entry_permission: EntryCategory | "home_country" | null;
  max_stay_days: number | null;
  entry_conditions_notes: string | null;
  destination_authority_name: string | null;
  destination_authority_url: string | null;
  passport_issuer_authority_name: string | null;
  passport_issuer_authority_url: string | null;
  source_dataset: string | null;
  source_as_of: string | null;
  verification_status: string;
  coverage_status: CoverageStatus;
  rule_last_verified: string | null;
  provenance_notes: string;
  document_requirements: DocumentRequirement[];
  workbook_rule: WorkbookRule | null;
  conflict: boolean;
}
export type VisaCountry = Omit<CountryEntry, "category"> & {
  category: EntryCategory | "unknown";
  rule: VisaRule;
};
export const PASSPORT_OPTIONS = matrix.passports.map((p) => ({ code: p.passport_code, name: p.passport_country }));
export const MATRIX_INFO = {
  workbook: matrix.workbook, sha256: matrix.sha256, totalPairs: Object.keys(matrix.records).length,
  missingPairs: 0, attribution: matrix.attribution, modified: matrix.modified,
  sourceCount: matrix.source_count, conflictCount: Object.keys(matrix.colombian_conflicts).length,
};
const packed = matrix.records as unknown as Record<string, Array<string | number | null>>;
const retained = matrix.colombian_conflicts as unknown as Record<string, Omit<VisaRule, "document_requirements" | "workbook_rule" | "conflict">>;
export const pairKey = (passport: string, destination: string) => `${passport}:${destination}`;
export function getWorkbookRule(passport: string, destination: string): WorkbookRule | null {
  const values = packed[pairKey(passport, destination)];
  if (!values) return null;
  const citationId = values[matrix.columns.length];
  const citation = typeof citationId === "number" ? matrix.citations[citationId] : undefined;
  if (!citation) return null;
  return Object.fromEntries([
    ...matrix.columns.map((k, i) => [k, values[i] ?? null]),
    ...matrix.citation_columns.map((k, i) => [k, citation[i] ?? null]),
  ]) as unknown as WorkbookRule;
}
export function getVisaRule(passport: string, destination: string): VisaRule {
  const raw = getWorkbookRule(passport, destination);
  const old = retained[pairKey(passport, destination)];
  if (old) return { ...old, document_requirements: [], workbook_rule: raw, conflict: true };
  // Policy-level sources are fallback references, never evidence for a missing pair.
  const reference = raw ?? getWorkbookRule("CO", destination);
  return {
    passport_code: passport, destination_code: destination,
    entry_permission: raw?.app_category ?? null, max_stay_days: raw?.max_stay_days ?? null,
    entry_conditions_notes: null, destination_authority_name: reference?.destination_rule_source ?? null,
    destination_authority_url: reference?.source_url ?? null,
    passport_issuer_authority_name: null, passport_issuer_authority_url: null,
    source_dataset: MATRIX_INFO.attribution, source_as_of: MATRIX_INFO.modified,
    verification_status: "Publisher source checks; not individually verified by Paisa Planner",
    coverage_status: raw ? "partial" : "missing", rule_last_verified: raw?.source_last_verified ?? null,
    provenance_notes: raw?.source_provenance ?? "Missing pair", document_requirements: [],
    workbook_rule: raw, conflict: false,
  };
}

export function resolveVisaCountry(country: CountryEntry, passport: string): VisaCountry {
  const rule = getVisaRule(passport, country.code);
  const usable = rule.coverage_status !== "missing" && rule.entry_permission != null;
  return {
    ...country,
    category:
      usable && rule.entry_permission !== "home_country"
        ? (rule.entry_permission ?? "unknown")
        : "unknown",
    maxStayDays: usable ? rule.max_stay_days : null,
    note: usable ? rule.entry_conditions_notes : null,
    rule,
  };
}
export function visaCountries(passport: string) {
  return COUNTRIES.map((c) => resolveVisaCountry(c, passport));
}
export function coverageFor(passport: string) {
  const rows = visaCountries(passport);
  return {
    partial: rows.filter((c) => c.rule.coverage_status === "partial").length,
    home: rows.filter((c) => c.rule.coverage_status === "logic_only").length,
    missing: rows.filter((c) => c.rule.coverage_status === "missing").length,
    verified: rows.filter((c) => c.rule.coverage_status === "verified").length,
    unknown: rows.filter((c) => c.category === "unknown" && c.rule.coverage_status !== "missing").length,
    conflicts: rows.filter((c) => c.rule.conflict).length,
  };
}
