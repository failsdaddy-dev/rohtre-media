import type { Metadata } from "next";
import { AboutMotion } from "@/components/about/about-motion";
import { MediaPlayback } from "@/components/media/media-playback";
import { Container, CtaPanel } from "@/components/page-parts";
import { BrandGrid, StatStrip, TextBlock, VideoPair, WorkHero } from "@/components/work/work-sections";
import { getBrands, getWorkContent } from "@/lib/work-data";

// Work. Same content and order as the live page (https://rohtremedia.com/work-2/),
// drawn with the site's design system: photo hero, red strip (counts up),
// intro, the brand cards (one link each to /work/[slug]), the two video
// frames and the closing card. Edited in Admin → Work page; brands added
// there appear here at once.

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getWorkContent();
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/work" },
    openGraph: { title: `${seo.title} | RohTre Media`, description: seo.description, url: "/work", type: "website" },
  };
}

export default async function WorkPage() {
  const [work, brands] = await Promise.all([getWorkContent(), getBrands()]);
  return (
    <>
      <WorkHero s={work.hero} />
      {work.stats.enabled && <StatStrip items={work.stats.items} label="Our numbers" />}

      <section aria-label="Our work" className="rm-work-band py-20 md:py-28">
        <Container>
          <TextBlock {...work.intro} />
          {(work.brands.eyebrow || work.brands.title || work.brands.pointer) && (
            <div className="mb-10 mt-16 flex flex-col gap-3 md:mb-12 md:mt-24">
              {work.brands.eyebrow && <p className="rm-label">{work.brands.eyebrow}</p>}
              {work.brands.title && (
                <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] font-bold leading-[1.05] tracking-[-0.045em]">
                  {work.brands.title}
                </h2>
              )}
              {work.brands.pointer && <p className="text-lg text-[#3a3a3a]">{work.brands.pointer}</p>}
            </div>
          )}
          <BrandGrid brands={brands} label={work.brands.cardLabel} />
        </Container>
      </section>

      {work.videos.enabled && (
        <section aria-label="Videos" className="rm-hero-sky overflow-clip py-20 md:py-28">
          <Container>
            <TextBlock eyebrow={work.videos.eyebrow} title={work.videos.title} body={work.videos.body} />
            <div className="mt-14 md:mt-20">
              <VideoPair s={work.videos} />
            </div>
          </Container>
        </section>
      )}

      <div className="bg-white pt-16 md:pt-24">
        <CtaPanel {...work.cta} />
      </div>
      <AboutMotion />
      <MediaPlayback />
    </>
  );
}
