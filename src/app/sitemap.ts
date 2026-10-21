import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { listPublishedLanding } from "@/lib/landing-data";

// Sitemap (R36). Public pages only: unlisted and private landing pages are
// never listed (R42). Driven by the database, so publishing a public landing
// page adds it (the landing cache tag refreshes this too).
const STATIC_PATHS = ["/", "/about", "/careers", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const landing = (await listPublishedLanding()).filter((p) => p.visibility === "public");
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...landing.map((p) => ({ url: `${SITE_URL}/lp/${p.slug}`, lastModified: new Date(p.updated_at) })),
  ];
}
