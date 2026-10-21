import type { MetadataRoute } from "next";
import { robotsRules } from "@/lib/crawlers";
import { SITE_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return { rules: robotsRules(), sitemap: `${SITE_URL}/sitemap.xml` };
}
