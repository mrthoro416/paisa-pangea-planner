import { useMemo } from "react";
import { usePassportPref } from "@/lib/passport-pref";
import { visaCountries } from "@/lib/visa-rules";

export function useVisaCountries() {
  const { country, chosen } = usePassportPref();
  return useMemo(() => visaCountries(chosen ? country.code : ""), [country.code, chosen]);
}
