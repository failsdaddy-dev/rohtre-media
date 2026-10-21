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
// Bands alternate dark and light. Proof sections show only matched, approved
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
      <PlaceholderBox title="Offer banner" className="aspect-[4/5] w-full bg-[#0d0d0d] md:aspect-[4/3]">
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
      <img {...img} srcSet={mobileSet} className="aspect-[4/5] w-full rounded-[24px] object-cover md:aspect-[4/3]" />
    </picture>
  );
}

function Hero({ s, ctx }: { s: SectionOf<"hero">; ctx: RenderContext }) {
  const p = s.props;
  const below = s.variant === "banner-below";
  const enter = (i: number) => ({ className: "rm-hero-in", style: { "--i": i } as CSSProperties });
  return (
    <section aria-label="Introduction" className="rm-dark rm-hero-dark rm-beams overflow-hidden">
      <Container
        className={`grid items-center gap-12 pb-20 pt-16 md:pt-24 ${below ? "" : "lg:grid-cols-[1.05fr_0.95fr]"}`}
      >
        <div className={`flex flex-col ${below ? "items-center text-center" : "items-start"}`}>
          {p.eyebrow && (
            <p {...enter(0)}>
              <span className="rm-pill mb-7">{p.eyebrow}</span>
            </p>
          )}
          <h1
            className="rm-hero-in mb-6 text-[clamp(2.3rem,5.2vw,4.25rem)] font-semibold leading-[1.06] tracking-[-0.04em]"
            style={{ "--i": 1 } as CSSProperties}
          >
            {p.h1}
          </h1>
          {p.subline && (
            <p
              className="rm-hero-in mb-9 max-w-2xl text-lg leading-relaxed text-[#ececec]"
              style={{ "--i": 2 } as CSSProperties}
            >
              {p.subline}
            </p>
          )}
          <div className="rm-hero-in flex flex-wrap gap-4" style={{ "--i": 3 } as CSSProperties}>
            <span className="rounded-full shadow-[0_6px_28px_rgba(229,9,20,0.35)]">
              <ButtonLink href={FORM_ANCHOR} track="book_call_click">
                {p.ctaLabel} <ArrowRightIcon size={18} />
              </ButtonLink>
            </span>
            {ctx.whatsappHref && (
              <a
                href={ctx.whatsappHref}
                target="_blank"
                rel="noopener"
                className="rm-press inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ChatIcon size={18} /> WhatsApp us
              </a>
            )}
          </div>
        </div>
        <div className={`rm-hero-in w-full ${below ? "mx-auto max-w-4xl" : ""}`} style={{ "--i": 4 } as CSSProperties}>
          <div className="overflow-hidden rounded-[24px] shadow-[0_40px_120px_-40px_rgba(229,9,20,0.45)]">
            <OfferBanner banner={p.offerBanner} priority />
          </div>
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ pain points
function PainPoints({ s }: { s: SectionOf<"painPoints"> }) {
  const p = s.props;
  const list = s.variant === "list";
  return (
    <section className={PAD}>
      <Container>
        <SectionHead eyebrow={p.eyebrow} title={p.title} accent={p.accent} />
        <ul className={list ? "flex max-w-3xl flex-col gap-4" : "grid gap-6 md:grid-cols-3"}>
          {p.items.map((item, i) => (
            <li key={item.title} {...reveal(i)}>
              <div className="rm-card flex h-full flex-col gap-3 p-7">
                <span className="text-sm font-bold text-brand">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-xl font-bold tracking-[-0.02em]">{item.title}</h3>
                <p className="leading-relaxed text-fg-2">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex justify-center" {...reveal(0)}>
          <ButtonLink href={FORM_ANCHOR} variant="dark" track="book_call_click">
            Fix this with us <ArrowRightIcon size={18} />
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
      <div className="relative overflow-hidden rounded-[20px] border border-line bg-bg-elev">
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
    <section className={`border-y border-line ${PAD}`}>
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
          <PlaceholderBox title="Creatives" className="min-h-60">
            No creatives are tagged for this page yet. Add real ads and reels (and, if you want, labelled concept work).
          </PlaceholderBox>
        )}
      </Container>
    </section>
  );
}

// -------------------------------------------------------------- platforms
function Platforms({ s }: { s: SectionOf<"platforms"> }) {
  const p = s.props;
  return (
    <section className={`rm-dark ${PAD}`}>
      <Container>
        <SectionHead eyebrow={p.eyebrow} title={p.title} accent={p.accent} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {p.items.map((item, i) => (
            <li key={item.name} {...reveal(i % 3)}>
              <div className="rm-glow-card p-7">
                <span className="rm-glow-face" aria-hidden="true" />
                <span className="mb-5 grid size-[52px] place-items-center bg-white/[0.06] text-brand">
                  <ServiceIcon
                    name={/google|search|shopping|youtube/i.test(item.name) ? "search" : "megaphone"}
                    size={22}
                  />
                </span>
                <h3 className="mb-2 text-xl font-bold text-white">{item.name}</h3>
                <p className="text-[15px] leading-relaxed text-white/50">{item.text}</p>
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
    <section id="enquiry" className={`rm-dark rm-grid-bg scroll-mt-24 ${PAD}`}>
      <Container className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHead eyebrow={p.eyebrow} title={p.title} accent={p.accent} intro={p.intro} className="md:mb-8" />
          <ul className="flex flex-col gap-3 text-fg-2" {...reveal(2)}>
            {["A 15-minute discovery call", "A plan for your brand", "No obligation"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckIcon size={18} className="text-brand" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div
          className="relative rounded-[28px] bg-white p-6 text-[#0a0a0a] [color-scheme:light] sm:p-10 [--bg-elev:#ffffff] [--fg-2:#5c5c5c] [--fg:#0a0a0a] [--field-bg:#ffffff] [--field-border:#d6d4cf] [--line:rgba(10,10,10,0.1)]"
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
          <section className={`rm-dark ${PAD}`}>
            <Container>
              <SectionHead
                eyebrow={s.props.eyebrow}
                title={s.props.title}
                accent={s.props.accent}
                intro={s.props.intro}
              />
              <PlaceholderBox title="Results" className="min-h-60">
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
      return visible ? <Faq s={{ enabled: true, ...s.props }} /> : null;
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
