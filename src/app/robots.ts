import type { MetadataRoute } from "next";
import { robotsRules } from "@/lib/crawlers";

// The sitemap line is added in Phase 3, when sitemap.xml exists.
export default function robots(): MetadataRoute.Robots {
  return { rules: robotsRules() };
}
