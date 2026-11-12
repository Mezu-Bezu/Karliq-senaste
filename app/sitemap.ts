import type { MetadataRoute } from "next";
import { alternatePaths, locales, pagePath, siteOrigin, type SitePage } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: SitePage[] = ["home", "tour", "privacy"];
  return pages.flatMap((page) => {
    const languages = Object.fromEntries(
      Object.entries(alternatePaths(page)).map(([language, path]) => [language, new URL(path, siteOrigin).href]),
    );
    return locales.map((locale) => ({
      url: new URL(pagePath(locale, page), siteOrigin).href,
      alternates: { languages },
    }));
  });
}
