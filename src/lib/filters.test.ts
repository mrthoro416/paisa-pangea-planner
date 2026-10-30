import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { FILTERS, filterByKey } from "./filters";
import { CATEGORIES, isHomeCountry } from "./entry";
import { PASSPORT_OPTIONS, visaCountries } from "./visa-rules";

describe("passport-aware map filters", () => {
  it("keeps Portugal's 31 free-movement destinations in the green visa-free filter", () => {
    const rows = visaCountries("PT");
    const freeMovement = rows.filter((c) => c.category === "freedom_of_movement");
    assert.equal(freeMovement.length, 31);
    for (const code of ["DE", "FR", "ES", "IT", "NL", "CH", "NO", "PT"]) {
      const country = rows.find((c) => c.code === code);
      assert.ok(country);
      assert.equal(country.category, "freedom_of_movement");
      assert.equal(filterByKey.get("visa_free")?.test(country), true);
      assert.equal(filterByKey.get("freedom_of_movement")?.test(country), true);
    }
    assert.ok(freeMovement.every((c) => filterByKey.get("visa_free")?.test(c)));
  });

  it("matches all green sourced destinations across all 199 passports without including unknowns", () => {
    const filter = filterByKey.get("visa_free");
    assert.ok(filter);
    for (const passport of PASSPORT_OPTIONS) {
      for (const country of visaCountries(passport.code)) {
        const expected = !isHomeCountry(country) &&
          CATEGORIES[country.category].colorVar === "--cat-green";
        assert.equal(filter.test(country), expected, `${passport.code}:${country.code}`);
      }
    }
  });

  it("preserves exact on-arrival, eVisa, ETA and other category filters across every passport", () => {
    const exact = FILTERS.filter((f) => !["all", "visa_free", "stay30", "stay90"].includes(f.key));
    for (const passport of PASSPORT_OPTIONS) {
      for (const country of visaCountries(passport.code)) {
        for (const filter of exact) {
          assert.equal(filter.test(country), !isHomeCountry(country) && country.category === filter.key,
            `${passport.code}:${country.code}:${filter.key}`);
        }
      }
    }
  });

  it("never treats missing passport rules as visa-free", () => {
    assert.equal(visaCountries("invalid").filter((c) => filterByKey.get("visa_free")?.test(c)).length, 0);
  });
});