import matrix from "@/data/visa-matrix.json";
import { COUNTRIES, type CountryEntry, type EntryCategory } from "@/data/countries";

export type CoverageStatus = "partial" | "logic_only" | "missing" | "verified";
export interface DocumentRequirement {
  type: "passport_validity" | "visa_application" | "evisa_application" | "eta_application" | "stay_limit" | "return_ticket" | "accommodation" | "funds" | "insurance" | "vaccination" | "other";
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
}
export type VisaCountry = Omit<CountryEntry, "category"> & {
  category: EntryCategory | "unknown";
  rule: VisaRule;
};
export const PASSPORT_OPTIONS = matrix.passports;
export const MATRIX_INFO = { workbook: matrix.workbook, sha256: matrix.sha256, totalPairs: matrix.total_pairs, missingPairs: matrix.missing_count };
const records = matrix.records as unknown as Record<string, Omit<VisaRule, "document_requirements">>;
const authorities = matrix.destination_authorities as Record<string, { name: string | null; url: string | null }>;
export const pairKey = (passport: string, destination: string) => `${passport}:${destination}`;

export function getVisaRule(passport: string, destination: string): VisaRule {
  const record = records[pairKey(passport, destination)];
  if (record) return { ...record, document_requirements: [] };
  const authority = authorities[destination];
  return {
    ...matrix.missing_template,
    passport_code: passport,
    destination_code: destination,
    entry_permission: null,
    coverage_status: "missing",
    destination_authority_name: authority?.name ?? null,
    destination_authority_url: authority?.url ?? null,
    document_requirements: [],
  };
}

export function resolveVisaCountry(country: CountryEntry, passport: string): VisaCountry {
  const rule = getVisaRule(passport, country.code);
  const usable = rule.coverage_status !== "missing" && rule.entry_permission != null;
  return {
    ...country,
    category: usable && rule.entry_permission !== "home_country" ? rule.entry_permission ?? "unknown" : "unknown",
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
  };
}