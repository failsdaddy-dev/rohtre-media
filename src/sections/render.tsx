import Image, { getImageProps } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { reveal, NotLiveTag, PlaceholderBox, SectionHead } from "@/components/home/parts";
import { BadgeBar, Faq, Process, Results, Testimonials } from "@/components/home/sections";
import { ArrowRightIcon, ChatIcon, CheckIcon, ServiceIcon } from "@/components/icons";
import { LeadForm } from "@/components/lead-form";
import { RawHtml } from "@/components/raw-html";
import { ButtonLink, Container } from "@/components/page-parts";
import { cloudinaryUrl } from "@/lib/cloudinary/url";
import type { Badge } from "@/lib/home-data";
import { SHOW_PLACEHOLDERS } from "@/lib/home-data";
import type { Creative, LandingProof } from "@/lib/landing-data";
import { isLiveProof, publicBadges } from "@/lib/proof";
import { sanitizeHtml } from "@/lib/sanitize";
import type { SiteSettings } from "@/lib/settings-schema";
import type { Section, SectionOf } from "./schemas";

// Section registry, part 2: how each section type renders on a landing page.
// Drawn in the site's light theme (Work / Recognition / Contact): the sky hero,
// white square cards with the red glow (.rm-svc), sky bands and the white form
// card; proof sections reuse the Home blocks. Proof sections show only matched, approved
// items on the live site and disappear when there are none; while building,
// placeholders show (marked) so the layout can be judged.

const PAD = "py-20 md:py-28";
const FORM_ANCHOR = "#enquiry";

export type RenderContext = {
  proof: LandingProof;
  badges: Badge[];
  settings: SiteSettings;
  whatsappHref: string | null;
};

// ------------------------------------------------------------------- hero
function OfferBanner({ banner, priority }: { banner: SectionOf<"hero">["props"]["offerBanner"]; priority: boolean }) {
  if (!banner.desktop || !banner.mobile) {
    return SHOW_PLACEHOLDERS ? (
      <PlaceholderBox title="Offer banner" className="aspect-[4/5] w-full rounded-none border-0 bg-white md:aspect-[4/3]">
        This page’s own offer banner (the offer lives only inside this image): desktop about 1200×900, mobile about
        1080×1350, with alt text.
      </PlaceholderBox>
    ) : null;
  }
  const common = { alt: banner.alt, sizes: "(min-width: 1024px) 560px, 100vw" };
  const {
    props: { srcSet: desktopSet },
  } = getImageProps({
    ...common,
    src: banner.desktop.publicId,
    width: banner.desktop.width,
    height: banner.desktop.height,
  });
  const {
    props: { srcSet: mobileSet, ...img },
  } = getImageProps({
    ...common,
    src: banner.mobile.publicId,
    width: banner.mobile.width,
    height: banner.mobile.height,
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : "auto",
  });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSet} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...img} srcSet={mobileSet} className="aspect-[4/5] w-full object-cover md:aspect-[4/3]" />
    </picture>
  );
}

function Hero({ s, ctx }: { s: SectionOf<"hero">; ctx: RenderContext }) {
  const p = s.props;
  const below = s.variant === "banner-below";
  // No banner on a live page: the text takes the whole hero, with no empty frame.
  const hasBanner = Boolean(p.offerBanner.desktop && p.offerBanner.mobile) || SHOW_PLACEHOLDERS;
  const enter = (i: number) => ({ className: "rm-hero-in", style: { "--i": i } as CSSProperties });
  return (
    <section aria-label="Introduction" className="rm-hero-sky rm-hero-dark overflow-clip">
      <Container
        className={`grid items-center gap-10 pb-16 pt-10 md:gap-12 md:pb-24 md:pt-16 ${below || !hasBanner ? "" : "lg:grid-cols-[1.05fr_0.95fr]"}`}
      >
        <div className={`flex min-w-0 flex-col ${below ? "items-center text-center" : "items-start"}`}>
          {p.eyebrow && (
            <p {...enter(0)} className="rm-hero-in rm-label mb-4">
              {p.eyebrow}
            </p>
          )}
          <h1
            className="rm-hero-in text-[clamp(2.3rem,5.2vw,4.2rem)] font-bold leading-[1.05] tracking-[-0.05em] text-[#0a0a0a] [overflow-wrap:anywhere] max-md:text-[clamp(2rem,9vw,2.6rem)]"
            style={{ "--i": 1 } as CSSProperties}
          >
            {p.h1}
          </h1>
          <span
            aria-hidden="true"
            className="rm-hero-in mt-6 block h-1 w-24 bg-brand"
            style={{ "--i": 2 } as CSSProperties}
          />
          {p.subline && (
            <p
              className="rm-hero-in mt-6 max-w-2xl text-[17px] leading-relaxed text-[#1f2a3a] md:text-xl"
              style={{ "--i": 2 } as CSSProperties}
            >
              {p.subline}
            </p>
          )}
          <div className="rm-hero-in rm-lp-btns mt-9 flex flex-wrap gap-3" style={{ "--i": 3 } as CSSProperties}>
            <ButtonLink href={FORM_ANCHOR} track="book_call_click" size="lg">
              {p.ctaLabel} <ArrowRightIcon size={20} />
            </ButtonLink>
            {ctx.whatsappHref && (
              <a
                href={ctx.whatsappHref}
                target="_blank"
                rel="noopener"
                className="rm-press inline-flex h-14 items-center justify-center gap-2 rounded-full border border-[#0a0a0a]/15 bg-white px-7 text-lg font-semibold text-[#0a0a0a] transition-colors hover:border-brand hover:text-brand"
              >
                <ChatIcon size={20} /> WhatsApp us
              </a>
            )}
          </div>
        </div>
        {hasBanner && (
          <div
            className={`rm-hero-in w-full min-w-0 ${below ? "mx-auto max-w-4xl" : ""}`}
            style={{ "--i": 4 } as CSSProperties}
          >
            <div className="rm-lp-frame">
              <OfferBanner banner={p.offerBanner} priority />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ pain points
function PainPoints({ s }: { s: SectionOf<"painPoints"> }) {
  const p = s.props;
  const list = s.variant === "list";
  return (
    <section className={`bg-white ${PAD}`}>
      <Container>
        <SectionHead eyebrow={p.eyebrow} title={p.title} accent={p.accent} />
        <ul className={list ? "flex max-w-3xl flex-col gap-4" : "grid gap-5 md:grid-cols-3 md:gap-6"}>
          {p.items.map((item, i) => (
            <li key={item.title} {...reveal(i)}>
              <div className="rm-svc rm-lp-card flex h-full flex-col gap-3">
                <span aria-hidden="true" className="rm-lp-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-bold tracking-[-0.02em] text-[#0a0a0a]">{item.title}</h3>
                <p className="leading-relaxed text-[#3a3a3a]">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex justify-center max-sm:[&>a]:w-full" {...reveal(0)}>
          <ButtonLink href={FORM_ANCHOR} track="book_call_click" size="lg">
            Fix this with us <ArrowRightIcon size={20} />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------- creatives
function CreativeTile({ c }: { c: Creative }) {
  const live = c.concept ? c.approved : isLiveProof(c);
  const media = c.media_public_id;
  return (
    <figure className="flex flex-col gap-3">
      <div className="rm-lp-frame relative">
        {!media ? (
          <PlaceholderBox
            title={c.concept ? "Concept work" : `${c.kind === "reel" ? "Reel" : "Creative"}`}
            className="aspect-[4/5] rounded-none border-0"
          >
            {c.concept
              ? "A labelled concept piece (not client work)."
              : "A real ad or creative from a client campaign."}
          </PlaceholderBox>
        ) : c.kind === "reel" ? (
          <video
            controls
            playsInline
            preload="none"
            poster={c.poster_public_id ? cloudinaryUrl(c.poster_public_id, { width: 720 }) : undefined}
            aria-label={c.alt ?? undefined}
            className="aspect-[9/16] w-full bg-black object-cover"
          >
            <source src={cloudinaryUrl(media, { width: 720, resourceType: "video" })} />
          </video>
        ) : (
          <Image
            src={media}
            alt={c.alt ?? ""}
            width={720}
            height={900}
            sizes="(max-width: 768px) 50vw, 360px"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        )}
        {c.concept && (
          <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
            {c.label_text || "Concept work - not a client project"}
          </span>
        )}
      </div>
      {!live && <NotLiveTag>Not approved yet</NotLiveTag>}
      {!c.concept && c.brand_name && (
        <figcaption className="text-sm font-semibold text-fg-2">{c.brand_name}</figcaption>
      )}
    </figure>
  );
}

function Creatives({ s, ctx }: { s: SectionOf<"creatives">; ctx: RenderContext }) {
  const p = s.props;
  const byKind = (k: Creative["kind"]) => ctx.proof.creatives.filter((c) => c.kind === k);
  // R20: images first, then reels; Meta pages (reels-first variant) flip it (R21).
  const ordered =
    s.variant === "reels-first" ? [...byKind("reel"), ...byKind("image")] : [...byKind("image"), ...byKind("reel")];
  const items = [...ordered.slice(0, p.limit), ...(p.showConcept ? ctx.proof.concept.slice(0, p.limit) : [])];
  const shown = items.length > 0 ? items : SHOW_PLACEHOLDERS ? null : [];
  if (shown && shown.length === 0) return null;
  return (
    <section className={`rm-hero-sky overflow-clip ${PAD}`}>
      <Container>
        <SectionHead eyebrow={p.eyebrow} title={p.title} accent={p.accent} intro={p.intro} />
        {shown ? (
          <ul className="grid grid-cols-2 gap-5 md:grid-cols-3">
            {shown.map((c, i) => (
              <li key={`${c.concept ? "c" : "r"}-${c.id}`} {...reveal(i % 3)}>
                <CreativeTile c={c} />
              </li>
            ))}
          </ul>
        ) : (
          <PlaceholderBox title="Creatives" className="min-h-96 max-sm:min-h-72">
            No creatives are tagged for this page yet. Add real ads and reels (and, if you want, labelled concept work).
          </PlaceholderBox>
        )}
      </Container>
    </section>
  );
}

// -------------------------------------------------------------- platforms
/** Icon tile colours, one per card (the Work story cards' palette). */
const PLATFORM_TINTS = ["#2563EB", "#DB2777", "#E50914", "#7C3AED", "#0D9488", "#EA580C"];

function Platforms({ s }: { s: SectionOf<"platforms"> }) {
  const p = s.props;
  return (
    <section className={`bg-white ${PAD}`}>
      <Container>
        <SectionHead eyebrow={p.eyebrow} title={p.title} accent={p.accent} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {p.items.map((item, i) => (
            <li key={item.name} className="flex" {...reveal(i % 3)}>
              <div
                className="rm-svc rm-lp-card flex w-full flex-col"
                style={{ "--tint": PLATFORM_TINTS[i % PLATFORM_TINTS.length] } as CSSProperties}
              >
                <span aria-hidden="true" className="rm-svc-icon mb-5">
                  <ServiceIcon
                    name={/google|search|shopping|youtube/i.test(item.name) ? "search" : "megaphone"}
                    size={24}
                  />
                </span>
                <h3 className="mb-2 text-xl font-bold text-[#0a0a0a]">{item.name}</h3>
                <p className="text-[15px] leading-relaxed text-[#3a3a3a]">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------- form
function Form({ s, ctx }: { s: SectionOf<"form">; ctx: RenderContext }) {
  const p = s.props;
  return (
    <section id="enquiry" className={`rm-hero-sky overflow-clip scroll-mt-24 ${PAD}`}>
      <Container className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="min-w-0">
          <SectionHead eyebrow={p.eyebrow} title={p.title} accent={p.accent} intro={p.intro} className="md:mb-8" />
          <ul className="flex flex-col gap-3 text-[17px] font-semibold text-[#0a0a0a]" {...reveal(2)}>
            {["A 15-minute discovery call", "A plan for your brand", "No obligation"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white"
                >
                  <CheckIcon size={16} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div
          className="rm-contact-card relative min-w-0 p-5 text-[#0a0a0a] [color-scheme:light] sm:p-8 [--bg-elev:#ffffff] [--fg-2:#5c5c5c] [--fg:#0a0a0a] [--field-bg:#ffffff] [--field-border:#d6d4cf] [--line:rgba(10,10,10,0.1)]"
          {...reveal(1, "up-lg")}
        >
          <LeadForm
            adSpendRanges={ctx.settings.adSpendRanges}
            interests={ctx.settings.interests}
            careersLine={ctx.settings.careersLineEnabled}
            defaultInterest={p.defaultInterest || undefined}
            title={p.formTitle || undefined}
          />
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------- dispatch
function renderSection(s: Section, ctx: RenderContext): ReactNode {
  switch (s.type) {
    case "hero":
      return <Hero s={s} ctx={ctx} />;
    case "badges": {
      const chosen = s.props.badgeIds.length ? ctx.badges.filter((b) => s.props.badgeIds.includes(b.id)) : ctx.badges;
      const badges = publicBadges(chosen);
      return badges.length ? (
        <BadgeBar
          s={{
            enabled: true,
            eyebrow: s.props.eyebrow,
            title: "Partners in",
            accent: "your growth.",
            cta: { text: "", label: "Book a Call" },
          }}
          badges={badges}
        />
      ) : null;
    }
    case "painPoints":
      return <PainPoints s={s} />;
    case "results": {
      const results = ctx.proof.results.slice(0, s.props.limit);
      if (results.length === 0) {
        return SHOW_PLACEHOLDERS ? (
          <section className={`bg-white ${PAD}`}>
            <Container>
              <SectionHead
                eyebrow={s.props.eyebrow}
                title={s.props.title}
                accent={s.props.accent}
                intro={s.props.intro}
              />
              <PlaceholderBox title="Results" className="min-h-96 max-sm:min-h-72">
                No results are tagged for this page yet. Add 2-3 real results (client, metric, dashboard screenshot).
              </PlaceholderBox>
            </Container>
          </section>
        ) : null;
      }
      return <Results s={{ enabled: true, ...s.props }} results={results} />;
    }
    case "creatives":
      return <Creatives s={s} ctx={ctx} />;
    case "platforms":
      return <Platforms s={s} />;
    case "testimonials":
      return ctx.proof.testimonials.length ? (
        <Testimonials
          s={{ enabled: true, variant: s.variant === "grid" ? "grid" : "slider", ...s.props }}
          items={ctx.proof.testimonials}
        />
      ) : null;
    case "process":
      return <Process s={{ enabled: true, ...s.props }} />;
    case "faq": {
      const visible = s.props.items.some((f) => SHOW_PLACEHOLDERS || f.status === "ready");
      const items = s.props.items.map(({ q, a, status }) => ({ q, a, approved: status === "ready" }));
      return visible ? <Faq s={{ enabled: true, ...s.props, items }} /> : null;
    }
    case "form":
      return <Form s={s} ctx={ctx} />;
    case "customHtml": {
      if (!s.props.html.trim()) return null;
      const wrap = s.variant === "full-width" ? "" : "mx-auto w-full max-w-[1200px] px-4 sm:px-6";
      return (
        <section className="rm-custom-html py-16">
          {s.props.mode === "raw" ? (
            <RawHtml html={s.props.html} className={wrap} />
          ) : (
            <div className={wrap} dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.props.html) }} />
          )}
        </section>
      );
    }
  }
}

/** Render a landing page's enabled sections, in order. */
export function LandingSections({ sections, ctx }: { sections: Section[]; ctx: RenderContext }) {
  return (
    <>
      {sections
        .filter((s) => s.enabled)
        .map((s) => (
          <div key={s.id} data-section={s.type} className="contents">
            {renderSection(s, ctx)}
          </div>
        ))}
    </>
  );
}
