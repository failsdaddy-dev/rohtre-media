import { SiteChrome } from "@/components/site-chrome";
import { GROUP_TONES } from "@/lib/header-tone";

// Home, About, Careers, Contact and the legal pages: the first screen is the light sky-blue hero, so the header
// starts as a see-through white bar with the dark logo and links.
export default function LightHeroLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome tone={GROUP_TONES["(light-hero)"]}>{children}</SiteChrome>;
}
