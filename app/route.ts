import { getCloudflareContext } from "@opennextjs/cloudflare";
import { pagePath, preferredLocale } from "../lib/site";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  let country: string | undefined;
  try {
    country = getCloudflareContext().cf?.country;
  } catch {
    // A standalone Next.js server has no Cloudflare request context.
  }

  const locale = preferredLocale(country, request.headers.get("accept-language"));
  const search = new URL(request.url).search;
  return new Response(null, {
    status: 307,
    headers: {
      Location: pagePath(locale) + search,
      "Cache-Control": "private, no-store",
      Vary: "Accept-Language",
    },
  });
}
