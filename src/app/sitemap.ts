import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { listPublishedLanding } from "@/lib/landing-data";
import { getBrands } from "@/lib/work-data";

// Sitemap (R36). Public pages only: unlisted and private landing pages are
// never listed (R42). Driven by the database, so publishing a public landing
// page adds it (the landing cache tag refreshes this too); the same for a
// published brand page (/work/<slug>; unpublished brands are left out).
const STATIC_PATHS = [
  "/",
  "/about",
  "/work",
  "/recognition",
  "/careers",
  "/contact",
  "/terms-of-service",
  "/privacy-notice",
  "/fraudulent-use",
  "/cookie-settings",
  "/do-not-sell",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [published, brands] = await Promise.all([listPublishedLanding(), getBrands()]);
  const landing = published.filter((p) => p.visibility === "public");
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...brands.map((b) => ({ url: `${SITE_URL}/work/${b.slug}` })),
    ...landing.map((p) => ({ url: `${SITE_URL}/lp/${p.slug}`, lastModified: new Date(p.updated_at) })),
  ];
}
