import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  coverageFor,
  getVisaRule,
  visaCountries,
  resolveVisaCountry,
  PASSPORT_OPTIONS,
} from "./visa-rules";
import { COUNTRIES } from "../data/countries";
import { FILTERS, isAccessible } from "./filters";
import { isHomeCountry } from "./entry";

describe("workbook passport coverage", () => {
  it("preserves 197 partial Colombian rules and one logic-only home row", () => {
    assert.deepEqual(coverageFor("CO"), { partial: 197, home: 1, missing: 0, verified: 0 });
    assert.equal(PASSPORT_OPTIONS.length, 198);
  });
  it("missing Albania and Canada pairs have no visa category, stay or accessible count", () => {
    for (const passport of ["AL", "CA"]) {
      const rows = visaCountries(passport);
      assert.equal(rows.filter(isAccessible).length, 0);
      assert.equal(rows.filter((c) => c.category === "unknown").length, 198);
      for (const filter of FILTERS.filter((f) => f.key !== "all"))
        assert.equal(rows.filter(filter.test).length, 0);
      assert.equal(getVisaRule(passport, "BR").entry_permission, null);
      assert.equal(getVisaRule(passport, "BR").max_stay_days, null);
    }
  });
  it("does not infer home-country permissions for missing passports", () => {
    const canada = visaCountries("CA").find((c) => c.code === "CA");
    assert.ok(canada);
    assert.equal(isHomeCountry(canada), false);
    const colombia = visaCountries("CO").find((c) => c.code === "CO");
    assert.ok(colombia);
    assert.equal(isHomeCountry(colombia), true);
  });
  it("imports Colombian categories and stays without changing geographic metadata", () => {
    for (const c of COUNTRIES.filter((c) => c.code !== "CO")) {
      const resolved = resolveVisaCountry(c, "CO");
      assert.equal(resolved.category, c.category);
      assert.equal(resolved.maxStayDays, c.maxStayDays);
      assert.equal(resolved.lat, c.lat);
      assert.equal(resolved.lng, c.lng);
    }
  });
  it("retains source provenance without claiming official verification or fabricating documents", () => {
    const rule = getVisaRule("CO", "BR");
    assert.equal(rule.source_as_of, "2026-09-26");
    assert.equal(rule.coverage_status, "partial");
    assert.match(rule.verification_status, /not independently verified/);
    assert.deepEqual(rule.document_requirements, []);
    assert.equal(rule.passport_issuer_authority_url, null);
    assert.equal(getVisaRule("CA", "BR").destination_authority_url, rule.destination_authority_url);
  });
});
