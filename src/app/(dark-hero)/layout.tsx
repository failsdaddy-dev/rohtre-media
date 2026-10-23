import { SiteChrome } from "@/components/site-chrome";
import { GROUP_TONES } from "@/lib/header-tone";

// Pages whose first screen is a dark hero (Careers, Contact):
// the header starts transparent with white logo and links.
export default function DarkHeroLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome tone={GROUP_TONES["(dark-hero)"]}>{children}</SiteChrome>;
}
