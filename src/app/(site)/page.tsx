import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { CtaStrip } from "@/components/home/parts";
import {
  BadgeStrip,
  Faq,
  FinalCta,
  Founder,
  Process,
  Results,
  Services,
  Testimonials,
} from "@/components/home/sections";
import { getBadges, getHomeContent, getResults, getTestimonials, SHOW_PLACEHOLDERS } from "@/lib/home-data";

// Home page (R13). Order: hero slider, badge strip, services, results,
// process, testimonials, founder + Book a Call, FAQ, final CTA, with a Book a
// Call strip after every section. No "Industries we serve" section (rule 6).

export const metadata: Metadata = {
  title: { absolute: "RohTre Media | Digital marketing and growth agency" },
  description:
    "RohTre Media plans and runs Meta and Google ad campaigns, makes the creatives and videos, and builds the pages they land on.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [home, badges, results, testimonials] = await Promise.all([
    getHomeContent(),
    getBadges(),
    getResults(),
    getTestimonials(),
  ]);

  const faqVisible = home.faq.items.some((f) => SHOW_PLACEHOLDERS || f.status === "ready");

  return (
    <>
      <Hero hero={home.hero} />

      {home.badges.enabled && badges.length > 0 && (
        <>
          <BadgeStrip badges={badges} />
          <div className="pt-10">
            <CtaStrip {...home.badges.cta} />
          </div>
        </>
      )}

      {home.services.enabled && (
        <>
          <Services s={home.services} />
          <CtaStrip {...home.services.cta} />
        </>
      )}

      {home.results.enabled && results.length > 0 && (
        <>
          <Results s={home.results} results={results} />
          <div className="bg-bg-soft">
            <CtaStrip {...home.results.cta} />
          </div>
        </>
      )}

      {home.process.enabled && (
        <>
          <Process s={home.process} />
          <CtaStrip {...home.process.cta} />
        </>
      )}

      {home.testimonials.enabled && testimonials.length > 0 && (
        <>
          <Testimonials s={home.testimonials} items={testimonials} />
          <div className="bg-bg-soft">
            <CtaStrip {...home.testimonials.cta} />
          </div>
        </>
      )}

      {home.founder.enabled && <Founder s={home.founder} />}

      {home.faq.enabled && faqVisible && (
        <>
          <Faq s={home.faq} />
          <div className="bg-bg-soft">
            <CtaStrip {...home.faq.cta} />
          </div>
        </>
      )}

      <FinalCta s={home.finalCta} />
    </>
  );
}
