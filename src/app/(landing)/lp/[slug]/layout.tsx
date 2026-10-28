import { SiteChrome } from "@/components/site-chrome";
import { GROUP_TONES } from "@/lib/header-tone";

// Landing pages keep the full site header and footer (R8, never standalone).
// Every landing page opens on the light sky hero (the publish check keeps the
// hero first), so the header starts see-through with the dark logo, like the
// (light-hero) pages. Not read from the URL, so navigation stays instant.
export default function LandingLayout({ children }: LayoutProps<"/lp/[slug]">) {
  return <SiteChrome tone={GROUP_TONES["(light-hero)"]}>{children}</SiteChrome>;
}
