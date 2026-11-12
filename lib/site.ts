export const siteOrigin = "https://karliq.se";
export const email = "erik@karliq.se";
export const telephone = "+46763050531";
export const telephoneLabel = "+46 76 305 05 31";
export const linkedin = "https://www.linkedin.com/in/erik-karlsson-b41329424/";
export const instagram = "https://www.instagram.com/karliq.se/";

export const locales = ["sv", "en"] as const;
export type Locale = (typeof locales)[number];
export type SitePage = "home" | "tour" | "privacy";

const pageSlugs = {
  sv: { tour: "3d-visningar", privacy: "integritet" },
  en: { tour: "3d-tours", privacy: "privacy" },
} as const;

export function isLocale(value: string): value is Locale {
  return value === "sv" || value === "en";
}

export function pagePath(locale: Locale, page: SitePage = "home") {
  return page === "home" ? `/${locale}` : `/${locale}/${pageSlugs[locale][page]}`;
}

export function alternatePaths(page: SitePage) {
  return {
    sv: pagePath("sv", page),
    en: pagePath("en", page),
    "x-default": page === "home" ? "/" : pagePath("en", page),
  };
}

export function preferredLocale(country: string | undefined, acceptLanguage: string | null): Locale {
  if (country === "SE") return "sv";
  if (country && /^[A-Z]{2}$/.test(country) && country !== "XX") return "en";
  if (!acceptLanguage) return "sv";

  let preferred: Locale = "en";
  let highestWeight = 0;
  for (const preference of acceptLanguage.toLowerCase().split(",")) {
    const [tag, quality] = preference.trim().split(/\s*;\s*/, 2);
    const language = tag.split("-")[0];
    const weight = quality?.startsWith("q=") ? Number(quality.slice(2)) : 1;
    if (isLocale(language) && weight > highestWeight && weight <= 1) {
      preferred = language;
      highestWeight = weight;
    }
  }
  return preferred;
}
