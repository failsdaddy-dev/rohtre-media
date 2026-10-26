import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AboutMotion } from "@/components/about/about-motion";
import { ArrowRightIcon } from "@/components/icons";
import { MediaPlayback } from "@/components/media/media-playback";
import { Container, CtaPanel } from "@/components/page-parts";
import { BrandGrid, BrandHero, BrandMedia, BrandStory, moreBrands, StatStrip } from "@/components/work/work-sections";
import { getBrand, getBrands, getWorkContent } from "@/lib/work-data";

// One brand page per published brand (/work/<slug>), one template, the
// brand's content from Admin → Work page → Brands. A slug that isn't a
// published brand is a 404 (unpublished brands included). Brands added
// later are rendered on their first visit (no redeploy).

/** Cache Components needs at least one sample; "_" is not a valid brand slug, so it 404s. */
export async function generateStaticParams() {
  const brands = await getBrands();
  return (brands.length ? brands.map((b) => b.slug) : ["_"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBrand(slug);
  if (!b) return { robots: { index: false, follow: false } };
  return {
    title: b.seo.title,
    description: b.seo.description,
    alternates: { canonical: `/work/${b.slug}` },
    openGraph: {
      title: `${b.seo.title} | RohTre Media`,
      description: b.seo.description,
      url: `/work/${b.slug}`,
      type: "website",
    },
  };
}

/**
 * The slug comes from the URL, so the brand is read inside <Suspense>: a
 * client navigation shows the sky hero shape at once and the brand streams
 * in (Cache Components' instant navigation). Brand data itself is cached.
 */
export default function BrandPage({ params }: PageProps<"/work/[slug]">) {
  return (
    <Suspense fallback={<section aria-busy="true" className="rm-hero-sky rm-hero-dark min-h-[70svh]" />}>
      <Brand params={params} />
    </Suspense>
  );
}

async function Brand({ params }: { params: PageProps<"/work/[slug]">["params"] }) {
  const { slug } = await params;
  const [b, all, work] = await Promise.all([getBrand(slug), getBrands(), getWorkContent()]);
  if (!b) notFound();
  const more = moreBrands(all, b);

  return (
    <>
      <BrandHero b={b} />
      <StatStrip items={b.metrics} label={`${b.name} results`} />

      <section aria-label={`${b.name} case study`} className="rm-work-band py-16 md:py-24">
        <Container className="flex flex-col gap-10 md:gap-14">
          <BrandStory b={b} />
          <BrandMedia b={b} />
        </Container>
      </section>

      {more.length > 0 && (
        <section aria-labelledby="more-work" className="rm-hero-sky py-16 md:py-24">
          <Container>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2
                id="more-work"
                className="text-[clamp(1.9rem,4.4vw,3rem)] font-bold leading-[1.05] tracking-[-0.045em]"
              >
                More work
              </h2>
              <Link href="/work" className="rm-work-back">
                Back to all work <ArrowRightIcon size={18} />
              </Link>
            </div>
            <BrandGrid brands={more} label={work.brands.cardLabel} />
          </Container>
        </section>
      )}

      <div className="pt-16 md:pt-24">
        <CtaPanel {...work.cta} />
      </div>
      <AboutMotion />
      <MediaPlayback />
    </>
  );
}
