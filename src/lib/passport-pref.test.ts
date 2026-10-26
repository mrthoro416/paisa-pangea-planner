import { describe, expect, test } from "bun:test";
import { PASSPORT } from "../data/countries";
import { resolvePassportCountry } from "./passport-pref";

describe("display-only passport preference", () => {
  test("saved ISO country code resolves to Japan", () => {
    expect(resolvePassportCountry("JP").code).toBe("JP");
  });
  test("missing and invalid preferences default to Colombia", () => {
    expect(resolvePassportCountry(null).code).toBe("CO");
    expect(resolvePassportCountry("invalid").code).toBe("CO");
  });
  test("another preference leaves the Colombian dataset passport unchanged", () => {
    resolvePassportCountry("US");
    expect(PASSPORT.code).toBe("CO");
  });
});
