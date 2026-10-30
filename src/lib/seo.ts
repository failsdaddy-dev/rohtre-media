import { SITE_URL } from "./env";
import type { SiteSettings } from "./settings-schema";

// Shared SEO pieces: the default share image and structured data (schema.org).

/** A page's openGraph replaces the layout's, so each page repeats the image. */
export const OG_IMAGES = [{ url: "/brand/og-default.png", width: 1200, height: 630, alt: "RohTre Media" }];

/** JSON for a <script type="application/ld+json">; "<" is escaped so text can't close the tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export function organizationJsonLd(s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RohTre Media",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-wordmark-black.png`,
    email: s.email,
    address: s.address ?? s.location,
    contactPoint: s.phones.map((p) => ({
      "@type": "ContactPoint",
      telephone: p.tel,
      contactType: "sales",
      areaServed: p.country,
    })),
    sameAs: s.socials.filter((l) => l.enabled && l.url?.startsWith("https://")).map((l) => l.url),
  };
}

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RohTre Media",
  url: SITE_URL,
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});
