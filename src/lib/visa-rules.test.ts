import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  getVisaRule,
  getWorkbookRule,
  visaCountries,
  PASSPORT_OPTIONS,
  MATRIX_INFO,
} from "./visa-rules";
import { FILTERS, isAccessible } from "./filters";
import { COUNTRIES } from "../data/countries";

describe("canonical global workbook", () => {
  it("imports 199 passports, 199 destinations and 39,601 unique pairs", () => {
    assert.equal(PASSPORT_OPTIONS.length, 199);
    assert.equal(COUNTRIES.length, 199);
    assert.equal(MATRIX_INFO.totalPairs, 39601);
    assert.equal(MATRIX_INFO.sourceCount, 19107);
  });
  for (const [passport, brazil, japan, usa] of [
    ["CO", "visa_free", "visa_required", "visa_required"],
    ["AL", "visa_free", "visa_required", "visa_required"],
    ["CA", "evisa", "visa_free", "visa_free"],
    ["HU", "visa_free", "visa_free", "eta"],
    ["IR", "visa_required", "visa_required", "entry_banned"],
    ["RW", "visa_required", "visa_required", "visa_required"],
  ]) {
    it(`looks up ${passport} against Brazil, Japan and USA`, () => {
      if (!passport) throw new Error("Missing test passport");
      assert.equal(getVisaRule(passport, "BR").entry_permission, brazil);
      assert.equal(getVisaRule(passport, "JP").entry_permission, japan);
      assert.equal(getVisaRule(passport, "US").entry_permission, usa);
    });
  }
  it("retains existing Colombian category/stay conflicts and both source versions", () => {
    assert.equal(MATRIX_INFO.conflictCount, 81);
    const af = getVisaRule("CO", "AF");
    assert.equal(af.entry_permission, "visa_required");
    assert.equal(af.workbook_rule?.app_category, "evisa");
    assert.equal(af.source_as_of, "2026-09-26");
    const ae = getVisaRule("CO", "AE");
    assert.equal(ae.entry_permission, "visa_free");
    assert.equal(ae.workbook_rule?.app_category, "visa_on_arrival");
    assert.equal(getVisaRule("CO", "PE").max_stay_days, 180);
    assert.equal(getWorkbookRule("CO", "PE")?.max_stay_days, 90);
    assert.equal(getVisaRule("CO", "GB").entry_permission, "visa_required");
  });
  it("unknown and missing pairs never imply visa-free, permission or unlimited stay", () => {
    const unknown = visaCountries("AL").find((c) => c.code === "AF");
    assert.ok(unknown);
    assert.equal(unknown.category, "unknown");
    assert.equal(unknown.maxStayDays, null);
    assert.equal(isAccessible(unknown), false);
    const missing = visaCountries("invalid");
    assert.equal(missing.filter(isAccessible).length, 0);
    assert.equal(missing.filter((c) => c.category === "unknown").length, 199);
    assert.equal(getVisaRule("invalid", "BR").entry_permission, null);
    assert.equal(getVisaRule("invalid", "BR").max_stay_days, null);
  });
  it("restriction and permit categories are not counted as accessible", () => {
    for (const [passport, destination] of [
      ["IR", "US"],
      ["HK", "CN"],
    ]) {
      const c = visaCountries(passport ?? "").find((r) => r.code === destination);
      assert.ok(c);
      assert.equal(isAccessible(c), false);
      assert.equal(FILTERS.find((f) => f.key === "stay30")?.test(c), false);
    }
  });
  it("preserves blank stays, provenance and publisher dates without invented documents", () => {
    const rule = getVisaRule("CA", "CA");
    assert.equal(rule.entry_permission, "freedom_of_movement");
    assert.equal(rule.max_stay_days, null);
    assert.equal(rule.workbook_rule?.source_level, "row");
    assert.equal(rule.workbook_rule?.source_provenance, "intergovernmental");
    assert.equal(rule.workbook_rule?.source_last_verified, "2026-10-13");
    assert.deepEqual(rule.document_requirements, []);
    assert.equal(rule.passport_issuer_authority_url, null);
  });
});
