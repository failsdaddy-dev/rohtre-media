import Image from "next/image";
import type { CSSProperties } from "react";
import { CARD_COLORS, type CareersContent } from "@/content/careers-schema";
import { reveal, SectionHead } from "../home/parts";
import { ArrowRightIcon, ChatIcon, ServiceIcon } from "../icons";
import { MediaSlot, stillFor, stillSrcSet } from "../media/media-slot";
import { ButtonLink, Container } from "../page-parts";

// The Careers page sections, in the Home/About design system: the About
// photo hero (fixed while the page scrolls, fading as it goes), the red
// strip (home partner strip styles), white square cards with the red glow
// (.rm-svc) and coloured icon tiles, the About team card look, the sky
// gradient and the reveal-on-scroll motion. Links to "#apply" open the
// application form (ApplyDialog). All text comes from the admin.

const PAD = "py-20 md:py-28";

type Card = CareersContent["values"]["items"][number];

/** A white card: coloured icon on a light tile, title, text. */
function IconCard({ card, i, small }: { card: Card; i: number; small?: boolean }) {
  return (
    <li
      className={`rm-svc flex flex-col items-start gap-4 ${small ? "lg:p-8!" : ""}`}
      {...reveal(i % 3)}
      style={{ ...reveal(i % 3).style, "--c": CARD_COLORS[card.color] } as CSSProperties}
    >
      <span className="rm-about-icon">
        <ServiceIcon name={card.icon} size={26} />
      </span>
      <h3 className={`${small ? "text-xl" : "text-2xl"} font-bold tracking-[-0.03em] max-sm:text-lg`}>{card.title}</h3>
      <p className="leading-relaxed text-[#5B6472] max-sm:text-[15px]">{card.text}</p>
    </li>
  );
}

function TextLink({ href, label }: { href: string; label: string }) {
  if (!label) return null;
  return (
    <a
      href={href}
      {...(href.startsWith("https://") ? { target: "_blank", rel: "noopener" } : {})}
      className="group inline-flex items-center gap-2 font-semibold text-brand underline-offset-4 hover:underline"
    >
      {label} <ArrowRightIcon size={18} className="transition-transform group-hover:translate-x-1" />
    </a>
  );
}

// --------------------------------------------------------------------- hero
/** Same technique as the About hero (see .rm-about-hero), plus a fade of the photo as the hero scrolls away. */
export function CareersHero({ s, hrHref }: { s: CareersContent["hero"]; hrHref: string | null }) {
  const img = s.image;
  return (
    <section
      aria-label="Introduction"
      className="rm-dark rm-about-hero rm-careers-hero relative flex min-h-[min(88svh,860px)] items-center bg-[#140405] text-white"
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
            {s.title}
          </h1>
          <span aria-hidden="true" className="rm-hero-in mt-7 block h-1 w-28 bg-brand" style={{ "--i": 2 } as CSSProperties} />
          {s.intro && (
            <p className="rm-hero-in mt-7 max-w-2xl text-lg leading-relaxed text-white md:text-xl" style={{ "--i": 2 } as CSSProperties}>
              {s.intro}
            </p>
          )}
          <div className="rm-hero-in mt-9 flex flex-wrap gap-3" style={{ "--i": 3 } as CSSProperties}>
            <ButtonLink href={s.primaryHref} size="lg">
              {s.primaryLabel} <ArrowRightIcon size={20} />
            </ButtonLink>
            {hrHref && s.hrLabel && (
              <a
                href={hrHref}
                target="_blank"
                rel="noopener"
                className="rm-press inline-flex h-14 items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-8 text-lg font-semibold text-white transition-colors hover:bg-white/15"
              >
                <ChatIcon size={20} /> {s.hrLabel}
              </a>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------------- strip
/** Awards and partners in the red strip: 5 across on desktop, 2 on tablet, stacked on phones. */
export function Strip({ s }: { s: CareersContent["strip"] }) {
  if (s.items.length === 0) return null;
  return (
    <section aria-label="Awards and partners" className="relative overflow-hidden bg-brand text-brand-fg">
      <ul className="rm-badges rm-careers-strip mx-auto max-w-[1600px]" data-group="many">
        {s.items.map((it, i) => (
          <li key={i} className="flex flex-col items-center justify-center gap-4 px-5 py-9 text-center md:py-11" {...reveal(i, "fade")}>
            <span className="grid h-16 place-items-center">
              {it.logo_public_id ? (
                <Image
                  src={it.logo_public_id}
                  alt=""
                  width={240}
                  height={96}
                  sizes="200px"
                  className="h-16 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <span className="whitespace-nowrap text-[clamp(2rem,3vw,2.6rem)] font-bold leading-none tracking-[-0.04em] text-white">
                  {it.value}
                </span>
              )}
            </span>
            {it.label && <span className="text-sm font-bold uppercase tracking-[0.14em] text-white">{it.label}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------- blocks
/** Image + text, alternating (side set per block in the admin); image first on phones. */
export function Blocks({ s }: { s: CareersContent["blocks"] }) {
  return (
    <section className={`bg-white ${PAD}`}>
      <Container className="flex flex-col gap-20 md:gap-28">
        {s.items.map((b, i) => (
          <div key={i} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
            <div className={b.side === "right" ? "md:order-2" : ""} {...reveal(0, "up-lg")}>
              <MediaSlot
                slot={b.image}
                sizes="(max-width: 768px) 100vw, 560px"
                maxWidth={1280}
                className="border border-[#e5e7eb] shadow-[0_30px_80px_-40px_rgba(10,40,80,0.35)]"
              />
            </div>
            <div className="flex flex-col items-start gap-5">
              {b.eyebrow && (
                <p className="rm-label" {...reveal(0)}>
                  {b.eyebrow}
                </p>
              )}
              <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.04em]" {...reveal(1)}>
                {b.title}
              </h2>
              <div className="flex flex-col gap-4 text-lg leading-relaxed text-fg-2" {...reveal(2)}>
                {b.body && <p>{b.body}</p>}
                {b.body2 && <p>{b.body2}</p>}
              </div>
              <div {...reveal(3)}>
                <TextLink href={b.linkHref} label={b.linkLabel} />
              </div>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

// ----------------------------------------------------------------- benefits
export function Benefits({ s }: { s: CareersContent["benefits"] }) {
  return (
    <section id="benefits" className={`bg-[#f4f8fd] ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} intro={s.intro} center />
        <ul className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {s.items.map((c, i) => (
            <IconCard key={i} card={c} i={i} />
          ))}
        </ul>
        {s.linkLabel && (
          <div className="mt-10 flex justify-center" {...reveal(0)}>
            <TextLink href={s.linkHref} label={s.linkLabel} />
          </div>
        )}
      </Container>
    </section>
  );
}

// --------------------------------------------------------------- spotlights
/** Team cards in the About style: photo, headline, name, role, story. 4 / 2 / 1 columns. */
export function Spotlights({ s }: { s: CareersContent["spotlights"] }) {
  return (
    <section id="spotlights" className={`bg-white ${PAD}`}>
      <Container>
        <SectionHead eyebrow="Our people" title={s.title} intro={s.intro} center />
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {s.items.map((m, i) => (
            <li key={i} className="rm-svc group flex flex-col gap-4 p-4!" {...reveal(i % 4)}>
              <div className="overflow-hidden">
                {m.photo ? (
                  <Image
                    src={m.photo.publicId}
                    alt={m.name}
                    width={m.photo.width}
                    height={m.photo.height}
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 280px"
                    loading="lazy"
                    className="aspect-square w-full object-cover object-[50%_25%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <div aria-hidden="true" className="grid aspect-square place-items-center bg-[#eef3f9] text-3xl font-bold text-[#7f93ab]">
                    {m.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 px-1 pb-2">
                {m.headline && <p className="text-[15px] font-bold leading-snug text-[#12305A]">{m.headline}</p>}
                <p className="text-lg font-bold leading-tight">{m.name}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{m.role}</p>
                {m.story && <p className="mt-1 text-[15px] leading-relaxed text-fg-2">{m.story}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------- values
export function Values({ s }: { s: CareersContent["values"] }) {
  return (
    <section className={`rm-hero-sky overflow-hidden ${PAD}`}>
      <Container>
        {/* The red line is a smaller subheading on one line (balanced wrapping on phones), not a second giant line. */}
        <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center gap-5 text-center md:mb-16">
          <p className="rm-label" {...reveal(0)}>
            {s.eyebrow}
          </p>
          <h2
            className="text-[clamp(2.1rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.045em] max-md:text-[clamp(1.75rem,8vw,2.1rem)]"
            {...reveal(1)}
          >
            {s.title}
          </h2>
          {s.subtitle && (
            <p
              className="rm-text-grad text-balance pb-1 text-[clamp(1.3rem,2.6vw,2rem)] font-bold leading-tight tracking-[-0.03em]"
              {...reveal(2)}
            >
              {s.subtitle}
            </p>
          )}
          {s.intro && (
            <p className="max-w-3xl text-lg leading-relaxed text-fg-2" {...reveal(3)}>
              {s.intro}
            </p>
          )}
        </div>
        <ul className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {s.items.map((c, i) => (
            <IconCard key={i} card={c} i={i} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------- perks grid
export function Perks({ s }: { s: CareersContent["perks"] }) {
  return (
    <section id="all-benefits" className={`bg-white ${PAD}`}>
      <Container>
        <SectionHead eyebrow="Benefits" title={s.title} intro={s.intro} center />
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {s.items.map((c, i) => (
            <IconCard key={i} card={c} i={i} small />
          ))}
        </ul>
      </Container>
    </section>
  );
}

// --------------------------------------------------------------------- FAQ
/** Native <details> accordion: a real button-like summary with open/closed state for keyboards and screen readers. */
export function CareersFaq({ s }: { s: CareersContent["faq"] }) {
  return (
    <section id="faq" className={`bg-[#f4f8fd] ${PAD}`}>
      <Container className="max-w-[900px]!">
        <SectionHead eyebrow={s.eyebrow} title={s.title} center />
        <ul className="flex flex-col gap-3">
          {s.items.map((f, i) => (
            <li key={i} {...reveal(i % 4)}>
              <details className="rm-svc group p-0!">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-[17px] font-semibold sm:px-7 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center bg-[color-mix(in_srgb,var(--brand)_10%,#fff)] text-xl leading-none text-brand transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="whitespace-pre-line px-5 pb-6 leading-relaxed text-fg-2 sm:px-7">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** FAQPage structured data: the same questions and answers as shown. */
export function faqJsonLd(s: CareersContent["faq"]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
