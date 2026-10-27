import { useMemo } from "react";
import { usePassportPref } from "@/lib/passport-pref";
import { visaCountries } from "@/lib/visa-rules";

export function useVisaCountries() {
  const { country } = usePassportPref();
  return useMemo(() => visaCountries(country.code), [country.code]);
}