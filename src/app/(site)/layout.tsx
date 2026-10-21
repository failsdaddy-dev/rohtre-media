import { SiteChrome } from "@/components/site-chrome";
import { GROUP_TONES } from "@/lib/header-tone";

// Default group for public pages (Privacy, Terms, and any new page): no tone
// is declared, so the header is the safe "solid" bar. A page with a dark
// hero belongs in (dark-hero) instead.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome tone={GROUP_TONES["(site)"]}>{children}</SiteChrome>;
}
