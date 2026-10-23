import Image from "next/image";
import type { CSSProperties } from "react";
import { COUNTER_COLORS, type AboutContent } from "@/content/about-schema";
import type { Tint } from "@/content/home-schema";
import { reveal, SectionHead } from "../home/parts";
import { ArrowRightIcon, ServiceIcon } from "../icons";
import { MediaSlot, stillFor, stillSrcSet } from "../media/media-slot";
import { ButtonLink, Container } from "../page-parts";

// The About page sections, drawn with the home page's design system: the
// photo hero, the red strip (home partner strip styles), white bands with
// square-cornered cards (.rm-svc), the sky gradient, section labels and
// two-tone headings, the reveal-on-scroll motion. Numbers count up and the
// progress bars fill once in view (AboutMotion). All text comes from the
// admin (escaped by React, never raw HTML).

const PAD = "py-20 md:py-28";
const tint = (t: Tint) => ({ "--tint": `var(--tint-${t})` }) as CSSProperties;

/** A button link for an admin-entered href (internal, anchor or https). */
function Cta({ href, label, variant }: { href: string; label: string; variant?: "plain" }) {
  const booking = href.startsWith("/contact#enquiry");
  return (
    <ButtonLink
      href={href}
      variant={variant}
      external={href.startsWith("https://")}
      track={booking ? "book_call_click" : undefined}
      size="lg"
    >
      {label} {!variant && <ArrowRightIcon size={20} />}
    </ButtonLink>
  );
}

// --------------------------------------------------------------------- hero
/**
 * The founder photo fills the hero, behind the text, and stays put while the
 * page scrolls over it: the photo layer is position: fixed inside a section
 * with clip-path: inset(0), so it only shows within the hero and lets go at
 * its end (works on iOS and Android; no scroll listeners). Reduced motion:
 * a normal static photo. The section starts below the header, so the
 * header's dark text never sits on the dark photo. A dark left-to-right
 * shade (top-to-bottom on phones) keeps the white text readable.
 */
export function AboutHero({ s }: { s: AboutContent["hero"] }) {
  const img = s.image;
  return (
    <section
      aria-label="Introduction"
      className="rm-dark rm-about-hero relative flex min-h-[min(88svh,860px)] items-center bg-[#140405] text-white"
    >
      {img.publicId && (
        <div
          className="rm-about-hero-layer"
          style={{ "--fx": `${s.focusX}%`, "--fx-m": `${s.focusXMobile}%` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary does the resizing (same URLs as the next/image loader) */}
          <img
            src={stillFor(img, 1280) ?? undefined}
            srcSet={stillSrcSet(img)}
            sizes="100vw"
            alt={img.alt}
            fetchPriority="high"
            decoding="async"
            className="rm-about-hero-img"
          />
        </div>
      )}
      <div aria-hidden="true" className="rm-about-hero-shade" />
      <Container className="relative py-20 md:py-28">
        <div className="flex max-w-3xl flex-col items-start">
          {s.eyebrow && (
            <p className="rm-label rm-hero-in mb-5" style={{ "--i": 0 } as CSSProperties}>
              {s.eyebrow}
            </p>
          )}
          <h1
            className="rm-hero-in text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.05em] max-md:text-[clamp(2rem,9vw,2.6rem)]"
            style={{ "--i": 1 } as CSSProperties}
          >
            {s.title} {s.accent && <span className="rm-text-grad">{s.accent}</span>}
          </h1>
          <span
            aria-hidden="true"
            className="rm-hero-in mt-7 block h-1 w-28 bg-brand"
            style={{ "--i": 2 } as CSSProperties}
          />
          {s.intro && (
            <p
              className="rm-hero-in mt-7 max-w-2xl text-lg leading-relaxed text-white md:text-xl"
              style={{ "--i": 2 } as CSSProperties}
            >
              {s.intro}
            </p>
          )}
          <div className="rm-hero-in mt-9 flex flex-wrap gap-3" style={{ "--i": 3 } as CSSProperties}>
            <Cta href={s.primaryHref} label={s.primaryLabel} />
            {s.secondaryLabel && <Cta href={s.secondaryHref} label={s.secondaryLabel} variant="plain" />}
          </div>
        </div>
      </Container>
    </section>
  );
}

// --------------------------------------------------------------- highlights
/**
 * The four headline numbers in a full-width red strip, using the home
 * partner strip's band and cell styles (.rm-badges: brand red, lighter-red
 * dividers, square edges). 4 across from 1024 px, 2x2 from 640 px, 1 column
 * on phones (.rm-about-strip in design.css).
 */
export function Highlights({ s }: { s: AboutContent["highlights"] }) {
  if (s.items.length === 0) return null;
  return (
    <section id="highlights" aria-label="Highlights" className="relative overflow-hidden bg-brand text-brand-fg">
      <ul className="rm-badges rm-about-strip mx-auto max-w-[1600px]" data-group="four">
        {s.items.map((h, i) => (
          <li
            key={i}
            className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center max-sm:gap-2 max-sm:px-3 max-sm:py-7 md:py-12"
            {...reveal(i, "fade")}
          >
            <span
              data-about-count={h.value}
              className="whitespace-nowrap text-[clamp(2.2rem,3.4vw,3.25rem)] font-bold leading-none tracking-[-0.04em] text-white tabular-nums max-sm:text-[1.55rem]"
            >
              {h.value}
            </span>
            <p className="max-w-xs text-[15px] leading-relaxed text-white max-sm:text-[12.5px] max-sm:leading-snug">{h.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --------------------------------------------------------- who we are + values
export function WhoWeAre({ intro, values }: { intro: AboutContent["intro"]; values: AboutContent["values"] }) {
  return (
    <section id="who-we-are" className={`bg-white ${PAD}`}>
      <Container>
        <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
          <SectionHead eyebrow={intro.eyebrow} title={intro.title} className="mb-0!" />
          <p className="self-end text-lg leading-relaxed text-fg-2" {...reveal(2)}>
            {intro.body}
          </p>
        </div>
        {values.enabled && values.items.length > 0 && (
          <ul className="mt-14 grid gap-3 sm:gap-6 md:mt-20 md:grid-cols-3">
            {values.items.map((v, i) => (
              <li key={i} className="rm-svc rm-about-value flex flex-col gap-5" {...reveal(i)}>
                <span className="rm-svc-icon" style={tint(v.tint)}>
                  <ServiceIcon name={v.icon} size={28} />
                </span>
                <h3 className="text-2xl font-bold tracking-[-0.03em]">{v.title}</h3>
                <p className="leading-relaxed text-fg-2">{v.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ counters
/**
 * Four white cards in the home "Who We Serve" card style (.rm-svc): a
 * coloured icon on a matching light tile (each card its own colour), the
 * counting number in navy, the label in red capitals, the line in grey.
 */
export function Counters({ s }: { s: AboutContent["numbers"] }) {
  if (s.items.length === 0) return null;
  return (
    <section id="counters" aria-label="RohTre Media in numbers" className={`bg-[#f4f8fd] ${PAD}`}>
      {/* Wider than the usual container on desktop so the four cards are wider and shorter; 2 per row on phones. */}
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 lg:gap-5">
          {s.items.map((n, i) => (
            <li
              key={i}
              className="rm-svc flex flex-col items-start gap-4 max-sm:gap-2.5 lg:p-8!"
              {...reveal(i)}
              style={{ ...reveal(i).style, "--c": COUNTER_COLORS[n.color] } as CSSProperties}
            >
              <span className="rm-about-icon">
                <ServiceIcon name={n.icon} size={26} />
              </span>
              <span
                data-about-count={n.value}
                className="text-[clamp(2.4rem,4vw,3.25rem)] font-bold leading-none tracking-[-0.05em] text-[#12305A] tabular-nums max-sm:text-[1.75rem]"
              >
                {n.value}
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand max-sm:text-[10px] max-sm:tracking-[0.12em]">
                {n.label}
              </p>
              <p className="leading-relaxed text-[#5B6472] max-sm:text-[13px] max-sm:leading-snug lg:text-[15px]">{n.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------- diversity
/** Text and the hiring button on the left, the progress bars in a card on the right. */
export function Diversity({ s }: { s: AboutContent["diversity"] }) {
  return (
    <section id="diversity" className={`bg-white ${PAD}`}>
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col items-start">
          <SectionHead eyebrow={s.eyebrow} title={s.title} className="mb-6!" />
          <div className="flex flex-col gap-4 text-lg leading-relaxed text-fg-2" {...reveal(2)}>
            {s.body && <p>{s.body}</p>}
            {(s.highlight || s.body2) && (
              <p>
                {s.highlight && <strong className="font-bold text-[#0a0a0a]">{s.highlight}</strong>} {s.body2}
              </p>
            )}
          </div>
          {s.ctaLabel && (
            <div className="mt-8" {...reveal(3)}>
              <Cta href={s.ctaHref} label={s.ctaLabel} />
            </div>
          )}
        </div>
        {s.bars.length > 0 && (
          <ul className="rm-svc flex flex-col gap-7 p-6! sm:p-10!" {...reveal(1, "up-lg")}>
            {s.bars.map((b, i) => (
              <li key={i}>
                <div className="mb-2.5 flex items-baseline justify-between gap-4">
                  <span className="font-semibold">{b.label}</span>
                  <span className="text-sm font-bold tabular-nums text-brand">{b.percent}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={b.label}
                  aria-valuenow={b.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2.5 overflow-hidden bg-[#e8edf3]"
                >
                  <div className="h-full" style={{ width: `${b.percent}%` }}>
                    <div data-about-bar="" className="rm-about-bar h-full" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ year in review
/** Heading, the 19:10 video frame (same card look as the home hero video), then the paragraph. */
export function YearInReview({ s }: { s: AboutContent["review"] }) {
  return (
    <section id="year-in-review" className={`rm-hero-sky overflow-hidden ${PAD}`}>
      <Container className="flex flex-col items-center">
        <SectionHead eyebrow={s.eyebrow} title={s.title} center className="mb-10! md:mb-14!" />
        <div className="w-full max-w-[1100px]" {...reveal(0, "up-lg")}>
          <MediaSlot
            slot={s.video}
            sizes="(max-width: 1148px) 100vw, 1100px"
            maxWidth={1920}
            className="rounded-[20px] border border-black/10 bg-white/40 shadow-[0_30px_90px_-40px_rgba(10,40,80,0.45)]"
          />
        </div>
        {s.body && (
          <p className="mt-10 max-w-3xl text-center text-lg leading-relaxed text-[#2b3a4d] md:mt-14" {...reveal(1)}>
            {s.body}
          </p>
        )}
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------- team
function Photo({ photo, name, sizes }: { photo: { publicId: string; width: number; height: number } | null; name: string; sizes: string }) {
  if (!photo) {
    // No photo yet: initials on a neutral square (never a stand-in face).
    const initials = name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return (
      <div aria-hidden="true" className="grid aspect-square w-full place-items-center bg-[#eef3f9] text-3xl font-bold text-[#7f93ab]">
        {initials}
      </div>
    );
  }
  return (
    <Image
      src={photo.publicId}
      alt={name}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      loading="lazy"
      className="aspect-square w-full object-cover object-[50%_25%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
    />
  );
}

export function Team({ s }: { s: AboutContent["team"] }) {
  return (
    <section id="team" className={`bg-white ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} intro={s.intro} />

        {s.leadershipTitle && (
          <h3 className="mb-6 text-xl font-bold tracking-[-0.02em] md:text-2xl" {...reveal(0)}>
            {s.leadershipTitle}
          </h3>
        )}
        <div
          className="rm-svc group mb-16 grid items-center gap-6 p-5! sm:grid-cols-[220px_1fr] sm:gap-10 sm:p-8! md:mb-20"
          {...reveal(0)}
        >
          <div className="overflow-hidden max-sm:mx-auto max-sm:w-[60%]">
            <Photo photo={s.leader.photo} name={s.leader.name} sizes="(max-width: 640px) 60vw, 220px" />
          </div>
          <div className="flex flex-col gap-2 max-sm:items-center max-sm:text-center">
            <p className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold leading-none tracking-[-0.04em]">{s.leader.name}</p>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">{s.leader.role}</p>
            {/* Kept to 4-5 lines on desktop (clamped at 5). */}
            {s.leader.bio && (
              <p className="mt-2 max-w-2xl leading-relaxed text-fg-2 md:line-clamp-5 md:text-[17px]">{s.leader.bio}</p>
            )}
          </div>
        </div>

        {s.members.length > 0 && (
          <>
            {s.membersTitle && (
              <h3 className="mb-6 text-xl font-bold tracking-[-0.02em] md:text-2xl" {...reveal(0)}>
                {s.membersTitle}
              </h3>
            )}
            {/* 5 across from 1024 px, 3 + 2 (centred) from 768 px, 2 per row on phones. */}
            <ul className="flex flex-wrap justify-center gap-3 sm:gap-6">
              {s.members.map((m, i) => (
                <li
                  key={i}
                  className="rm-svc group flex w-[calc(50%-6px)] flex-col gap-3 p-2.5! sm:w-[calc(50%-12px)] sm:gap-4 sm:p-4! md:w-[calc((100%-48px)/3)] lg:w-[calc((100%-96px)/5)]"
                  {...reveal(i % 5)}
                >
                  <div className="overflow-hidden">
                    <Photo
                      photo={m.photo}
                      name={m.name}
                      sizes="(max-width: 768px) 48vw, (max-width: 1024px) 31vw, 240px"
                    />
                  </div>
                  <div className="px-0.5 pb-1">
                    <p className="text-sm font-bold leading-tight sm:text-lg">{m.name}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-brand sm:text-xs sm:tracking-[0.18em]">
                      {m.role}
                    </p>
                    {m.bio && <p className="mt-2 text-sm leading-relaxed text-fg-2 max-sm:hidden">{m.bio}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </section>
  );
}
