import type { Metadata } from "next";
import { AboutMotion } from "@/components/about/about-motion";
import { AboutHero, Counters, Diversity, Highlights, Team, WhoWeAre, YearInReview } from "@/components/about/about-sections";
import { CtaDecor } from "@/components/home/cta-decor";
import { MediaPlayback } from "@/components/media/media-playback";
import { CtaPanel } from "@/components/page-parts";
import { getAboutContent } from "@/lib/about-data";

// About (R33). Same sections and order as the live About page
// (https://rohtremedia.com/about/), drawn with the home page's design
// system; every word, number, photo and the video are edited in
// Admin → About page (page_content "about").

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getAboutContent();
  return { title: seo.title, description: seo.description, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const about = await getAboutContent();
  return (
    <>
      <AboutHero s={about.hero} />
      {about.highlights.enabled && <Highlights s={about.highlights} />}
      <WhoWeAre intro={about.intro} values={about.values} />
      {about.numbers.enabled && <Counters s={about.numbers} />}
      {about.diversity.enabled && <Diversity s={about.diversity} />}
      {about.review.enabled && <YearInReview s={about.review} />}
      <Team s={about.team} />
      <CtaPanel id="lets-talk" {...about.cta} decor={about.cta.animated ? <CtaDecor /> : undefined} />
      <AboutMotion />
      <MediaPlayback />
    </>
  );
}
