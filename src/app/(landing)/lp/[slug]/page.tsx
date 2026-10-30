import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { AboutMotion } from "@/components/about/about-motion";
import { getBadges } from "@/lib/home-data";
import { getLandingPage, getLandingProof, getRedirect, listLandingSlugs } from "@/lib/landing-data";
import { getSettings } from "@/lib/settings";
import { OG_IMAGES } from "@/lib/seo";
import { fillTemplate, whatsappLink } from "@/lib/whatsapp";
import { LandingSections } from "@/sections/render";

// Landing pages: /lp/{service}-{niche}-brands-{country} (R1-R4). Rendered on
// the server from the page's published sections (drafts only while
// building), cached, and refreshed when a page is published (R35).
// Unlisted pages (the default) send noindex here and in the X-Robots-Tag
// header, stay out of the sitemap, and AI crawlers are refused in proxy.ts (R42).

/** Cache Components needs at least one sample; "_" is a reserved slug that 404s. */
export async function generateStaticParams() {
  const slugs = await listLandingSlugs();
  return (slugs.length ? slugs : ["_"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/lp/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  if (!page) return { robots: { index: false, follow: false } };
  const indexable = page.visibility === "public" && !page.isDraft;
  return {
    title: { absolute: page.content.meta.title },
    description: page.content.meta.description,
    alternates: { canonical: `/lp/${page.slug}` },
    openGraph: {
      title: page.content.meta.title,
      description: page.content.meta.description,
      url: `/lp/${page.slug}`,
      type: "website",
      images: OG_IMAGES,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  };
}

/**
 * The slug comes from the URL, so the page is read inside <Suspense>: a
 * client navigation shows the sky hero shape at once and the page streams in
 * (Cache Components' instant navigation). Page data itself is cached.
 */
export default function LandingPage({ params }: PageProps<"/lp/[slug]">) {
  return (
    <Suspense fallback={<section aria-busy="true" className="rm-hero-sky rm-hero-dark min-h-[70svh] overflow-clip" />}>
      <Landing params={params} />
    </Suspense>
  );
}

async function Landing({ params }: { params: PageProps<"/lp/[slug]">["params"] }) {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  if (!page) {
    const moved = await getRedirect(`/lp/${slug}`);
    if (moved) permanentRedirect(moved); // R3: old slugs 301 to the new address
    notFound();
  }

  const [proof, badges, settings] = await Promise.all([
    getLandingProof(page.dimValues.map((v) => v.id)),
    getBadges(),
    getSettings(),
  ]);
  const hero = page.content.sections.find((s) => s.type === "hero");
  const vars = {
    page: hero?.type === "hero" ? hero.props.h1 : page.content.meta.title,
    service: page.dims.service.label,
    niche: page.dims.niche.label.toLowerCase(),
    country: page.dims.country.label,
  };
  const whatsappHref = settings.whatsapp.enabled
    ? whatsappLink(settings.whatsapp.number, fillTemplate(settings.whatsapp.template, vars))
    : null;

  return (
    // data-wa-*: the floating WhatsApp button's message names this page (R9).
    <div
      data-wa-page={vars.page}
      data-wa-service={vars.service}
      data-wa-niche={vars.niche}
      data-wa-country={vars.country}
      className="contents"
    >
      {page.isDraft && (
        <p
          data-placeholder
          data-draft-preview
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-fg shadow-lg"
        >
          Draft preview · not published
        </p>
      )}
      <LandingSections sections={page.content.sections} ctx={{ proof, badges, settings, whatsappHref }} />
      <AboutMotion />
    </div>
  );
}
