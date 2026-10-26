import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { PASSPORT } from "../data/countries";
import { resolvePassportCountry } from "./passport-pref";

describe("display-only passport preference", () => {
  test("saved ISO country code resolves to Japan", () => {
    assert.equal(resolvePassportCountry("JP").code, "JP");
  });
  test("missing and invalid preferences default to Colombia", () => {
    assert.equal(resolvePassportCountry(null).code, "CO");
    assert.equal(resolvePassportCountry("invalid").code, "CO");
  });
  test("another preference leaves the Colombian dataset passport unchanged", () => {
    resolvePassportCountry("US");
    assert.equal(PASSPORT.code, "CO");
  });
});
