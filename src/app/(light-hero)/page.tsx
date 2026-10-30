import type { Metadata } from "next";
import { AboutMotion } from "@/components/about/about-motion";
import {
  Brands,
  ClientShowcase,
  ProductShowcase,
  ScrollEngage,
  VideoAds,
  WhoWeServe,
} from "@/components/home/growth-sections";
import { CtaDecor } from "@/components/home/cta-decor";
import { Hero } from "@/components/home/hero";
import { BadgeBar, Faq, Founder, Process, Results, StripeBand, Testimonials } from "@/components/home/sections";
import { MediaPlayback } from "@/components/media/media-playback";
import { CtaPanel } from "@/components/page-parts";
import { jsonLd, OG_IMAGES, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getBadges, getHomeContent, getResults, getTestimonials, SHOW_PLACEHOLDERS } from "@/lib/home-data";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

// Home page (R13). Order: hero slider, full-width partner strip, who we
// serve, product showcase, scroll-engage-convert, video ads & reels,
// results, client showcase, a decorative stripe band, process, brands we've
// worked with, testimonials, founder + Book a Call, FAQ, final CTA. Bands
// alternate light and dark; every section ends with a Book a Call. No
// "Industries we serve" section (rule 6). Every image/video slot is a
// MediaSlot; MediaPlayback starts the looping clips while they're in view.

export const metadata: Metadata = {
  title: { absolute: "RohTre Media | Digital marketing and growth agency" },
  description:
    "RohTre Media plans and runs Meta and Google ad campaigns, makes the creatives and videos, and builds the pages they land on.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "RohTre Media | Digital marketing and growth agency",
    description:
      "RohTre Media plans and runs Meta and Google ad campaigns, makes the creatives and videos, and builds the pages they land on.",
    url: "/",
    type: "website",
    images: OG_IMAGES,
  },
};

export default async function HomePage() {
  const [home, badges, results, testimonials, settings] = await Promise.all([
    getHomeContent(),
    getBadges(),
    getResults(),
    getTestimonials(),
    getSettings(),
  ]);
  const whatsappHref = settings.whatsapp.enabled
    ? whatsappLink(settings.whatsapp.number, "Hi RohTre Media, I'd like to grow my brand.")
    : null;
  const faqVisible = home.faq.items.some((f) => SHOW_PLACEHOLDERS || f.approved);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd([organizationJsonLd(settings), websiteJsonLd()]) }}
      />
      <Hero hero={home.hero} whatsappHref={whatsappHref} />
      {home.badges.enabled && badges.length > 0 && <BadgeBar s={home.badges} badges={badges} />}
      {home.whoWeServe.enabled && <WhoWeServe s={home.whoWeServe} />}
      {home.products.enabled && <ProductShowcase s={home.products} />}
      {home.engage.enabled && <ScrollEngage s={home.engage} />}
      {home.videoAds.enabled && <VideoAds s={home.videoAds} />}
      {home.results.enabled && results.length > 0 && <Results s={home.results} results={results} />}
      <AboutMotion />
      {home.showcase.enabled && <ClientShowcase s={home.showcase} />}
      <StripeBand />
      {home.process.enabled && <Process s={home.process} phoneCta />}
      {home.brands.enabled && <Brands s={home.brands} />}
      {home.testimonials.enabled && testimonials.length > 0 && (
        <Testimonials s={home.testimonials} items={testimonials} />
      )}
      {home.founder.enabled && <Founder s={home.founder} />}
      {home.faq.enabled && faqVisible && <Faq s={home.faq} />}
      <CtaPanel
        {...home.finalCta}
        whatsappHref={whatsappHref}
        size="lg"
        id="lets-talk"
        decor={home.finalCta.animated ? <CtaDecor /> : undefined}
      />
      <MediaPlayback />
    </>
  );
}
