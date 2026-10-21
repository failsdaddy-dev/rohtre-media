import { SiteChrome } from "@/components/site-chrome";
import { getLandingPage } from "@/lib/landing-data";
import { pageHeaderTone } from "@/sections/tone";

// Landing pages keep the full site header and footer (R8, never standalone).
// The header tone comes from the page's first enabled section (a dark hero →
// white header text; anything else → the safe solid header).
export default async function LandingLayout({ children, params }: LayoutProps<"/lp/[slug]">) {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  return <SiteChrome tone={pageHeaderTone(page?.content)}>{children}</SiteChrome>;
}
