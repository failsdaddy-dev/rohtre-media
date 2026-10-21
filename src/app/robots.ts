import type { MetadataRoute } from "next";
import { robotsRules } from "@/lib/crawlers";
import { SITE_URL } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { aiBots } = await getSettings();
  return { rules: robotsRules(aiBots), sitemap: `${SITE_URL}/sitemap.xml` };
}
