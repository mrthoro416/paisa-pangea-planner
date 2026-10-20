import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/** Visitor's country from the hosting edge (IP-based). Only used to suggest a language. */
export const getVisitorCountry = createServerFn({ method: "GET" }).handler(async () => {
  const country = getRequestHeader("cf-ipcountry") ?? null;
  return { country: country && country !== "XX" ? country.toUpperCase() : null };
});
