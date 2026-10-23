import Image from "next/image";
import type { CSSProperties } from "react";
import type { AboutContent } from "@/content/about-schema";
import type { Tint } from "@/content/home-schema";
import { reveal, SectionHead } from "../home/parts";
import { ArrowRightIcon, ServiceIcon } from "../icons";
import { MediaSlot, stillFor, stillSrcSet } from "../media/media-slot";
import { ButtonLink, Container } from "../page-parts";

// The About page sections, drawn with the home page's design system: the
// sky-blue hero, white bands with square-cornered cards (.rm-svc), a dark
// band with the grid background, the red stripe band, section labels and
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
/** Headline, intro and two buttons on the sky gradient, then the wide founder photo. */
export function AboutHero({ s }: { s: AboutContent["hero"] }) {
  const img = s.image;
  return (
    <section aria-label="Introduction" className="rm-hero-dark rm-hero-sky overflow-hidden">
      <Container className="flex flex-col items-center pb-16 pt-14 text-center md:pb-24 md:pt-20">
        {s.eyebrow && (
          <p className="rm-label rm-hero-in mb-5" style={{ "--i": 0 } as CSSProperties}>
            {s.eyebrow}
          </p>
        )}
        <h1
          className="rm-hero-in max-w-4xl text-[clamp(2.4rem,6.4vw,4.75rem)] font-bold leading-[1.02] tracking-[-0.05em] max-md:text-[clamp(2rem,9vw,2.6rem)]"
          style={{ "--i": 1 } as CSSProperties}
        >
          {s.title} {s.accent && <span className="rm-text-grad">{s.accent}</span>}
        </h1>
        {s.intro && (
          <p
            className="rm-hero-in mt-6 max-w-2xl text-lg leading-relaxed text-[#2b3a4d] md:text-xl"
            style={{ "--i": 2 } as CSSProperties}
          >
            {s.intro}
          </p>
        )}
        <div className="rm-hero-in mt-9 flex flex-wrap justify-center gap-3" style={{ "--i": 3 } as CSSProperties}>
          <Cta href={s.primaryHref} label={s.primaryLabel} />
          {s.secondaryLabel && <Cta href={s.secondaryHref} label={s.secondaryLabel} variant="plain" />}
        </div>

        {img.publicId && (
          <figure
            className="rm-hero-in rm-about-photo relative mt-14 w-full max-w-6xl overflow-hidden rounded-[28px] border border-black/10 shadow-[0_40px_120px_-40px_rgba(10,40,80,0.45)] md:mt-16"
            style={{ "--i": 4 } as CSSProperties}
          >
            {/* One file, two crops: 4:3 on phones, 12:5 from 768 px, centred on the person (focusX). */}
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary does the resizing (same URLs as the next/image loader) */}
            <img
              src={stillFor(img, 1280) ?? undefined}
              srcSet={stillSrcSet(img)}
              sizes="(max-width: 1200px) 100vw, 1152px"
              alt={img.alt}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 size-full object-cover"
              style={{ objectPosition: `${s.focusX}% 50%` }}
            />
          </figure>
        )}
      </Container>
    </section>
  );
}

// --------------------------------------------------------------- highlights
/** The four headline numbers, as white cards that overlap the hero's lower edge. */
export function Highlights({ s }: { s: AboutContent["highlights"] }) {
  if (s.items.length === 0) return null;
  return (
    <section id="highlights" aria-label="Highlights" className="bg-white pb-6 pt-14 md:pt-20">
      <Container>
        <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {s.items.map((h, i) => (
            <li key={i} className="rm-svc flex flex-col gap-3" {...reveal(i)}>
              <span
                data-about-count={h.value}
                className="text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-none tracking-[-0.04em] text-brand tabular-nums"
              >
                {h.value}
              </span>
              <p className="text-sm leading-relaxed text-fg-2 md:text-base">{h.text}</p>
            </li>
          ))}
        </ul>
      </Container>
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
/** Dark band: icon, counting number, label and a line, four across. */
export function Counters({ s }: { s: AboutContent["numbers"] }) {
  if (s.items.length === 0) return null;
  return (
    <section id="counters" aria-label="RohTre Media in numbers" className={`rm-dark rm-grid-bg ${PAD}`}>
      <Container>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-0">
          {s.items.map((n, i) => (
            <li
              key={i}
              className="flex flex-col items-start gap-3 lg:border-l lg:border-white/10 lg:px-8 lg:first:border-l-0 lg:first:pl-0"
              {...reveal(i)}
            >
              <span className="grid size-12 place-items-center rounded-full bg-[#e50914]/15 text-[#ff4d4d] ring-1 ring-[#e50914]/30">
                <ServiceIcon name={n.icon} size={22} />
              </span>
              <span
                data-about-count={n.value}
                className="text-[clamp(2.4rem,5vw,3.75rem)] font-bold leading-none tracking-[-0.05em] tabular-nums"
              >
                {n.value}
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff4d4d]">{n.label}</p>
              <p className="text-sm leading-relaxed text-white/65 md:text-base">{n.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// ----------------------------------------------------------------- diversity
/** Text and the hiring button on the left, the progress bars in a card on the right. */
export function Diversity({ s }: { s: AboutContent["diversity"] }) {
  return (
    <section id="diversity" className={`bg-[#f4f8fd] ${PAD}`}>
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
    <section id="year-in-review" className={`rm-hero-sky ${PAD}`}>
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
      className="aspect-square w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
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
        <div className="rm-svc group mb-16 grid items-center gap-6 p-5! sm:grid-cols-[220px_1fr] sm:gap-10 sm:p-8! md:mb-20" {...reveal(0)}>
          <div className="overflow-hidden max-sm:mx-auto max-sm:w-[60%]">
            <Photo photo={s.leader.photo} name={s.leader.name} sizes="(max-width: 640px) 60vw, 220px" />
          </div>
          <div className="flex flex-col gap-2 max-sm:items-center max-sm:text-center">
            <p className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold leading-none tracking-[-0.04em]">{s.leader.name}</p>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">{s.leader.role}</p>
          </div>
        </div>

        {s.members.length > 0 && (
          <>
            {s.membersTitle && (
              <h3 className="mb-6 text-xl font-bold tracking-[-0.02em] md:text-2xl" {...reveal(0)}>
                {s.membersTitle}
              </h3>
            )}
            <ul className="grid grid-cols-3 gap-3 sm:gap-6">
              {s.members.map((m, i) => (
                <li key={i} className="rm-svc group flex flex-col gap-3 p-2.5! sm:gap-4 sm:p-4!" {...reveal(i)}>
                  <div className="overflow-hidden">
                    <Photo photo={m.photo} name={m.name} sizes="(max-width: 640px) 31vw, (max-width: 1280px) 30vw, 380px" />
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
