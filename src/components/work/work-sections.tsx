import Link from "next/link";
import type { CSSProperties } from "react";
import { statText, type Brand, type Stat, type WorkContent } from "@/content/work-schema";
import { reveal } from "../home/parts";
import { ArrowRightIcon, ServiceIcon } from "../icons";
import { MediaSlot, stillFor, stillSrcSet } from "../media/media-slot";
import { ButtonLink, Container } from "../page-parts";
import { Pic } from "./pic";

// The Work page and brand page sections, drawn with the site's design system
// (styles: design.css, .rm-work*): the About hero technique, the red strip
// (home partner strip styles, numbers count up once in view via
// AboutMotion's [data-about-count]), white square cards with the red glow
// (.rm-svc), the sky gradient, section labels and the reveal on scroll.
// All text comes from the admin (escaped by React, never raw HTML).

/** A button for an admin-entered link (internal, anchor or https). */
export function LinkButton({ href, label, variant }: { href: string; label: string; variant?: "plain" }) {
  return (
    <ButtonLink href={href} variant={variant} external={href.startsWith("https://")} size="lg">
      {label} {!variant && <ArrowRightIcon size={20} />}
    </ButtonLink>
  );
}

// --------------------------------------------------------------------- hero
/**
 * The live page's photo fills the hero behind the text and stays put while
 * the page scrolls over it (the About hero: a position: fixed layer inside a
 * section clipped with clip-path, so iOS and Android work; reduced motion =
 * a normal photo). Starts below the header; a dark shade keeps the text AA.
 */
export function WorkHero({ s }: { s: WorkContent["hero"] }) {
  const img = s.image;
  const cloud = img.media.publicId ? img.media : null;
  return (
    <section
      aria-label="Introduction"
      className="rm-dark rm-about-hero relative flex min-h-[min(80svh,760px)] items-center bg-[#140405] text-white"
    >
      {(cloud || img.src) && (
        <div
          className="rm-about-hero-layer"
          style={{ "--fx": `${s.focusX}%`, "--fx-m": `${s.focusXMobile}%` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary or a local file already sized */}
          <img
            src={cloud ? (stillFor(cloud, 1280) ?? undefined) : img.src}
            srcSet={
              cloud
                ? stillSrcSet(cloud)
                : img.src === "/images/work/work-hero.webp"
                  ? "/images/work/work-hero-960.webp 960w, /images/work/work-hero.webp 1920w"
                  : undefined
            }
            sizes="100vw"
            width={cloud ? undefined : img.w || undefined}
            height={cloud ? undefined : img.h || undefined}
            alt={img.media.alt}
            fetchPriority="high"
            decoding="async"
            className="rm-about-hero-img"
          />
        </div>
      )}
      <div aria-hidden="true" className="rm-about-hero-shade" />
      <Container className="relative py-20 md:py-28">
        <div className="flex max-w-3xl flex-col items-start">
          <h1
            className="rm-hero-in text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.05em] [overflow-wrap:anywhere] max-md:text-[clamp(2rem,9vw,2.6rem)]"
            style={{ "--i": 0 } as CSSProperties}
          >
            {s.title}
          </h1>
          <span
            aria-hidden="true"
            className="rm-hero-in mt-7 block h-1 w-28 bg-brand"
            style={{ "--i": 1 } as CSSProperties}
          />
          {s.intro && (
            <p
              className="rm-hero-in mt-7 max-w-2xl text-lg leading-relaxed text-white md:text-xl"
              style={{ "--i": 2 } as CSSProperties}
            >
              {s.intro}
            </p>
          )}
          {s.buttons.length > 0 && (
            <div
              className="rm-hero-in rm-work-hero-btns mt-9 flex flex-wrap gap-3"
              style={{ "--i": 3 } as CSSProperties}
            >
              {s.buttons.map((b, i) => (
                <LinkButton key={i} href={b.href} label={b.label} variant={i === 0 ? undefined : "plain"} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------- red strip
/**
 * The numbers in the full-width red strip (the home partner strip's band
 * and cells, .rm-badges): 4 across from 1024 px, 2 x 2 below. The server
 * renders the final text; AboutMotion counts it up from 0 once in view
 * (not for reduced motion).
 */
export function StatStrip({ items, label = "Results" }: { items: Stat[]; label?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={label} className="relative overflow-hidden bg-brand text-brand-fg">
      <ul className="rm-badges rm-about-strip mx-auto max-w-[1600px]" data-group="four">
        {items.map((s, i) => (
          <li
            key={i}
            className="flex flex-col items-center justify-start gap-2 px-6 py-10 text-center max-sm:px-3 max-sm:py-7 md:py-12"
            {...reveal(i, "fade")}
          >
            <span
              data-about-count={statText(s)}
              className="whitespace-nowrap text-[clamp(2.2rem,3.4vw,3.25rem)] font-bold leading-none tracking-[-0.04em] text-white tabular-nums max-sm:text-[1.55rem]"
            >
              {statText(s)}
            </span>
            {s.label && (
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-white max-sm:text-[11px]">
                {s.label}
              </span>
            )}
            {s.text && (
              <p className="max-w-xs text-[15px] leading-relaxed text-white max-sm:text-[12.5px] max-sm:leading-snug">
                {s.text}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- brand card
/**
 * One brand: the whole card is a single link to its page. White square card
 * with the red glow border and lift on hover, tap and keyboard focus
 * (.rm-svc); the logo on a white tile (the name when there is no logo); the
 * live headline cut to 3 lines by CSS; "View our work" with an arrow that
 * slides on hover (always shown).
 */
export function BrandCard({ brand, label, i = 0 }: { brand: Brand; label: string; i?: number }) {
  return (
    <li className="flex" {...reveal(i % 4)}>
      <Link href={`/work/${brand.slug}`} className="rm-svc rm-work-card group flex w-full flex-col">
        <span className="rm-work-logo">
          {brand.logo.media.publicId || brand.logo.src ? (
            <Pic pic={brand.logo} sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw" fit="contain" />
          ) : (
            <span className="px-4 text-center text-xl font-bold tracking-[-0.02em] text-[#0a0a0a]">{brand.name}</span>
          )}
        </span>
        <span className="mt-5 text-lg font-bold leading-tight tracking-[-0.02em] text-[#0a0a0a]">{brand.name}</span>
        {brand.overview && (
          <span className="rm-work-clamp mt-2 text-[15px] leading-relaxed text-[#3a3a3a]">{brand.overview}</span>
        )}
        <span className="rm-work-more mt-auto pt-5">
          {label} <ArrowRightIcon size={18} className="rm-work-arrow" />
        </span>
      </Link>
    </li>
  );
}

export function BrandGrid({ brands, label }: { brands: Brand[]; label: string }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {brands.map((b, i) => (
        <BrandCard key={b.id} brand={b} label={label} i={i} />
      ))}
    </ul>
  );
}

// -------------------------------------------------------------- work blocks
/** Label + heading + paragraph (the live page's "WORK / Built to deliver faster." blocks). */
export function TextBlock({
  eyebrow,
  title,
  body,
  center,
}: {
  eyebrow: string;
  title: string;
  body: string;
  center?: boolean;
}) {
  if (!eyebrow && !title && !body) return null;
  return (
    <div className={`flex max-w-3xl flex-col gap-5 ${center ? "mx-auto items-center text-center" : ""}`}>
      {eyebrow && (
        <p className="rm-label" {...reveal(0)}>
          {eyebrow}
        </p>
      )}
      {title && (
        <h2
          className="text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.045em] max-md:text-[clamp(1.75rem,8vw,2.1rem)]"
          {...reveal(1)}
        >
          {title}
        </h2>
      )}
      {body && (
        <p className="text-lg leading-relaxed text-[#3a3a3a]" {...reveal(2)}>
          {body}
        </p>
      )}
    </div>
  );
}

/**
 * The two video frames, offset and overlapping on desktop like the live
 * page (stacked on phones): white square frames, the caption above the first
 * and below the second. Each is a 16:9 media slot (an upload in the admin;
 * empty = the placeholder frame). Videos play with controls, never on their own.
 */
export function VideoPair({ s }: { s: WorkContent["videos"] }) {
  const frame = (v: WorkContent["videos"]["first"], cls: string, captionFirst: boolean) => (
    <figure className={`rm-work-video ${cls}`} {...reveal(cls === "is-first" ? 0 : 1, "up-lg")}>
      {captionFirst && v.caption && <figcaption className="rm-work-caption mb-4">{v.caption}</figcaption>}
      <div className="rm-work-frame">
        <MediaSlot slot={v.media} sizes="(min-width: 1024px) 700px, 100vw" />
      </div>
      {!captionFirst && v.caption && <figcaption className="rm-work-caption mt-4">{v.caption}</figcaption>}
    </figure>
  );
  return (
    <div className="rm-work-videos">
      {frame(s.first, "is-first", true)}
      {frame(s.second, "is-second", false)}
    </div>
  );
}

// -------------------------------------------------------------- brand page
const STORY_ICONS = ["briefcase", "target", "sparkles", "growth", "users", "eye", "megaphone", "star", "globe", "pen"];
const STORY_COLORS = [
  "#F59E0B",
  "#2563EB",
  "#7C3AED",
  "#0D9488",
  "#16A34A",
  "#DB2777",
  "#EA580C",
  "#0284C7",
  "#4F46E5",
];

/** Brand hero: sky gradient with soft strips, back link, red eyebrow, headline, logo tile, the live paragraph and buttons. */
export function BrandHero({ b }: { b: Brand }) {
  return (
    <section aria-label="Introduction" className="rm-hero-sky rm-hero-dark">
      <Container className="pb-14 pt-8 md:pb-20 md:pt-12">
        <Link href="/work" className="rm-work-back rm-hero-in">
          <ArrowRightIcon size={18} className="rotate-180" /> Back to all work
        </Link>
        <div className="mt-8 grid items-start gap-8 md:mt-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <div className="min-w-0">
            {b.eyebrow && (
              <p className="rm-label rm-hero-in mb-4" style={{ "--i": 0 } as CSSProperties}>
                {b.eyebrow}
              </p>
            )}
            <h1
              className="rm-hero-in text-[clamp(2rem,5vw,3.6rem)] font-bold leading-[1.06] tracking-[-0.045em] text-[#0a0a0a] [overflow-wrap:anywhere]"
              style={{ "--i": 1 } as CSSProperties}
            >
              {b.headline}
            </h1>
            <span
              aria-hidden="true"
              className="rm-hero-in mt-6 block h-1 w-28 bg-brand"
              style={{ "--i": 2 } as CSSProperties}
            />
            {b.description.map((p, i) => (
              <p
                key={i}
                className="rm-hero-in mt-6 max-w-3xl text-[17px] leading-relaxed text-[#1f2a3a] md:text-lg"
                style={{ "--i": 2 } as CSSProperties}
              >
                {p}
              </p>
            ))}
            {b.buttons.length > 0 && (
              <div
                className="rm-hero-in rm-work-hero-btns mt-8 flex flex-wrap gap-3"
                style={{ "--i": 3 } as CSSProperties}
              >
                {b.buttons.map((btn, i) => (
                  <LinkButton key={i} href={btn.href} label={btn.label} variant={i === 0 ? undefined : "plain"} />
                ))}
              </div>
            )}
          </div>
          <div
            className="rm-hero-in rm-work-logo rm-work-logo-hero max-lg:order-first"
            style={{ "--i": 1 } as CSSProperties}
          >
            {b.logo.media.publicId || b.logo.src ? (
              <Pic pic={b.logo} sizes="280px" fit="contain" priority />
            ) : (
              <span className="px-4 text-center text-2xl font-bold text-[#0a0a0a]">{b.name}</span>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** THE COMPANY / THE CHALLENGE / ... as square white cards, each with its own icon colour. */
export function BrandStory({ b }: { b: Brand }) {
  if (b.sections.length === 0) return null;
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6">
      {b.sections.map((s, i) => (
        <article
          key={i}
          className="rm-svc rm-work-story"
          style={{ "--tint": STORY_COLORS[i % STORY_COLORS.length] } as CSSProperties}
          {...reveal(i % 2)}
        >
          <header className="flex items-center gap-4">
            <span aria-hidden="true" className="rm-svc-icon shrink-0">
              <ServiceIcon name={STORY_ICONS[i % STORY_ICONS.length]} size={26} strokeWidth={1.8} />
            </span>
            {s.label && <h2 className="rm-label">{s.label}</h2>}
          </header>
          {s.lead && <p className="mt-5 text-xl font-bold leading-snug tracking-[-0.02em] text-[#0a0a0a]">{s.lead}</p>}
          {s.paragraphs.map((p, j) => (
            <p key={j} className="mt-4 text-[16px] leading-relaxed text-[#3a3a3a]">
              {p}
            </p>
          ))}
          {s.bullets.length > 0 && (
            <ul className="rm-work-bullets mt-4">
              {s.bullets.map((x, j) => (
                <li key={j}>{x}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

/** The brand's images (sharp white frames, lazy) and its video / image slots. */
export function BrandMedia({ b }: { b: Brand }) {
  const gallery = b.gallery.filter((p) => p.media.publicId || p.src);
  const videos = b.videos.filter((v) => v.publicId || process.env.NODE_ENV !== "production");
  if (gallery.length === 0 && videos.length === 0) return null;
  return (
    <div className="flex flex-col gap-6">
      {gallery.map((p, i) => (
        <figure key={i} className="rm-work-frame" {...reveal(0, "up-lg")}>
          <Pic pic={p} sizes="(min-width: 1200px) 1150px, 100vw" />
        </figure>
      ))}
      {videos.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {videos.map((v, i) => (
            <div key={i} className="rm-work-frame" {...reveal(i % 2, "up-lg")}>
              <MediaSlot slot={v} sizes="(min-width: 768px) 560px, 100vw" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Three other brands after this one (wrapping round), for the "More work" row. */
export function moreBrands(all: Brand[], current: Brand, n = 3): Brand[] {
  const others = all.filter((x) => x.id !== current.id);
  const at = Math.max(
    0,
    all.findIndex((x) => x.id === current.id),
  );
  return [...others.slice(at), ...others.slice(0, at)].slice(0, n);
}
