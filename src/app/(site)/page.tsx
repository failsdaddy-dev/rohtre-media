import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { BadgeBar, Faq, Founder, Process, Results, Services, Testimonials } from "@/components/home/sections";
import { CtaPanel } from "@/components/page-parts";
import { getBadges, getHomeContent, getResults, getTestimonials, SHOW_PLACEHOLDERS } from "@/lib/home-data";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

// Home page (R13). Order: hero slider, badge bar, services, results, process,
// testimonials, founder + Book a Call, FAQ, final CTA. Bands alternate light
// and dark; every section ends with a Book a Call. No "Industries we serve"
// section (rule 6).

export const metadata: Metadata = {
  title: { absolute: "RohTre Media | Digital marketing and growth agency" },
  description:
    "RohTre Media plans and runs Meta and Google ad campaigns, makes the creatives and videos, and builds the pages they land on.",
  alternates: { canonical: "/" },
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
  const faqVisible = home.faq.items.some((f) => SHOW_PLACEHOLDERS || f.status === "ready");

  return (
    <>
      <Hero hero={home.hero} whatsappHref={whatsappHref} />
      {home.badges.enabled && badges.length > 0 && <BadgeBar s={home.badges} badges={badges} />}
      {home.services.enabled && <Services s={home.services} />}
      {home.results.enabled && results.length > 0 && <Results s={home.results} results={results} />}
      {home.process.enabled && <Process s={home.process} />}
      {home.testimonials.enabled && testimonials.length > 0 && (
        <Testimonials s={home.testimonials} items={testimonials} />
      )}
      {home.founder.enabled && <Founder s={home.founder} />}
      {home.faq.enabled && faqVisible && <Faq s={home.faq} />}
      <CtaPanel {...home.finalCta} whatsappHref={whatsappHref} />
    </>
  );
}
