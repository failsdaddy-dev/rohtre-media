import type { Metadata } from "next";
import { ApplyDialog } from "@/components/careers/apply-dialog";
import {
  Benefits,
  Blocks,
  CareersFaq,
  CareersHero,
  faqJsonLd,
  Perks,
  Spotlights,
  Strip,
  Values,
} from "@/components/careers/careers-sections";
import { CtaDecor } from "@/components/home/cta-decor";
import { ArrowRightIcon } from "@/components/icons";
import { MediaPlayback } from "@/components/media/media-playback";
import { CtaPanel } from "@/components/page-parts";
import { getCareersContent } from "@/lib/careers-data";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

// Careers (R12, R33). Same sections and order as the live Careers page
// (https://rohtremedia.com/careers/) minus the Diversity section (About
// only), drawn with the Home/About design system. Every word, photo, card
// and the form's choices are edited in Admin → Careers page; applications
// arrive in Admin → Applications and by email to HR.

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getCareersContent();
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/careers" },
    openGraph: { title: `${seo.title} | RohTre Media`, description: seo.description, url: "/careers", type: "website" },
  };
}

export default async function CareersPage() {
  const [c, settings] = await Promise.all([getCareersContent(), getSettings()]);
  const hr = settings.hrWhatsapp
    ? whatsappLink(settings.hrWhatsapp, "Hi RohTre Media HR, I'd like to apply for a role.")
    : null;
  return (
    <>
      <CareersHero s={c.hero} hrHref={hr} />
      {c.strip.enabled && <Strip s={c.strip} />}
      {c.blocks.enabled && c.blocks.items.length > 0 && <Blocks s={c.blocks} />}
      {c.benefits.enabled && <Benefits s={c.benefits} />}
      {c.spotlights.enabled && c.spotlights.items.length > 0 && <Spotlights s={c.spotlights} />}
      {c.values.enabled && <Values s={c.values} />}
      {c.perks.enabled && <Perks s={c.perks} />}
      {c.faq.enabled && c.faq.items.length > 0 && (
        <>
          <CareersFaq s={c.faq} />
          <script
            type="application/ld+json"
            // JSON.stringify output with "<" escaped, so text can't close the script tag.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(c.faq)).replace(/</g, "\u003c") }}
          />
        </>
      )}
      <CtaPanel
        band="bg-[#f4f8fd]"
        id="apply-now"
        eyebrow={c.cta.eyebrow}
        title={c.cta.title}
        accent={c.cta.accent}
        text={c.cta.text}
        decor={c.cta.animated ? <CtaDecor /> : undefined}
        action={
          <a
            href="#apply"
            className="rm-press inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-fg shadow-[0_6px_28px_rgba(229,9,20,0.35)]"
          >
            {c.cta.label} <ArrowRightIcon size={18} />
          </a>
        }
      />
      <ApplyDialog roles={c.form.roles} experience={c.form.experience} success={c.form.success} />
      <MediaPlayback />
    </>
  );
}
