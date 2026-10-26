import Link from "next/link";
import type { CSSProperties } from "react";
import type { RecognitionContent } from "@/content/work-schema";
import { reveal } from "../home/parts";
import { ArrowRightIcon } from "../icons";
import { Container } from "../page-parts";
import { Pic } from "../work/pic";
import { LinkButton } from "../work/work-sections";
import { RecognitionSlider } from "./recognition-slider";

// The Recognition page sections, in the live page's order
// (https://rohtremedia.com/recognition-2/): the hero slider, the four award
// cards, the client quotes and "Our team makes us successful". Drawn with
// the site's design system (styles: design.css, .rm-rec*). All text comes
// from Admin → Recognition page (escaped by React, never raw HTML).

/** Each slide: its photo behind the text, a dark shade for AA contrast, heading, red bar, line and buttons. */
export function RecognitionHero({ slides }: { slides: RecognitionContent["hero"]["slides"] }) {
  if (slides.length === 0) return null;
  return (
    <RecognitionSlider label="Recognition highlights">
      {slides.map((s, i) => (
        <div key={i} className="rm-dark relative flex h-full items-center bg-[#140405] text-white">
          <Pic pic={s.image} sizes="100vw" fill priority={i === 0} />
          <div aria-hidden="true" className="rm-rec-shade" />
          <Container className="rm-rec-content relative pb-28 pt-16 md:pb-32 md:pt-20">
            <div className="flex max-w-3xl flex-col items-start">
              {i === 0 ? <h1 className="rm-rec-title">{s.title}</h1> : <h2 className="rm-rec-title">{s.title}</h2>}
              <span aria-hidden="true" className="mt-6 block h-1 w-24 bg-brand" />
              {s.text && <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white md:text-lg">{s.text}</p>}
              {s.buttons.length > 0 && (
                <div className="rm-work-hero-btns mt-8 flex flex-wrap gap-3">
                  {s.buttons.map((b, j) => (
                    <LinkButton key={j} href={b.href} label={b.label} variant={j === 0 ? undefined : "plain"} />
                  ))}
                </div>
              )}
            </div>
          </Container>
        </div>
      ))}
    </RecognitionSlider>
  );
}

/** The award blocks: logo on a white tile (never edited or recoloured), title, the live description. */
export function Awards({ s }: { s: RecognitionContent["awards"] }) {
  if (s.items.length === 0) return null;
  return (
    <section aria-label="Awards" className="rm-work-band py-20 md:py-28">
      <Container>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 lg:gap-6">
          {s.items.map((a, i) => (
            <li key={i} className="flex" {...reveal(i % 4)}>
              <article tabIndex={0} className="rm-svc rm-rec-award flex w-full flex-col">
                <div className="rm-work-logo">
                  <Pic pic={a.logo} sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 90vw" fit="contain" />
                </div>
                <h2 className="mt-6 text-lg font-bold leading-snug tracking-[-0.02em] text-[#0a0a0a]">{a.title}</h2>
                {a.body && <p className="mt-3 text-[15px] leading-relaxed text-[#3a3a3a]">{a.body}</p>}
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** "CLIENT RECOGNITION": the client quotes as square white cards. */
export function ClientQuotes({ s }: { s: RecognitionContent["clients"] }) {
  if (s.items.length === 0) return null;
  return (
    <section aria-labelledby="client-recognition" className="rm-hero-sky overflow-clip py-20 md:py-28">
      <Container>
        <div className="mb-12 flex max-w-3xl flex-col gap-5 md:mb-16">
          {s.eyebrow && (
            <p className="rm-label" {...reveal(0)}>
              {s.eyebrow}
            </p>
          )}
          <h2
            id="client-recognition"
            className="text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.045em] max-md:text-[clamp(1.75rem,8vw,2.1rem)]"
            {...reveal(1)}
          >
            {s.title}
          </h2>
        </div>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {s.items.map((q, i) => (
            <li key={i} className="flex" {...reveal(i % 3)}>
              <figure tabIndex={0} className="rm-svc rm-rec-quote flex w-full flex-col">
                <blockquote className="text-[16px] leading-relaxed text-[#1f2a3a]">{q.quote}</blockquote>
                <figcaption className="mt-auto flex items-center gap-3 pt-6">
                  {(q.photo.media.publicId || q.photo.src) && (
                    <span className="rm-rec-avatar">
                      <Pic pic={q.photo} sizes="48px" fill />
                    </span>
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="font-bold text-[#0a0a0a]">{q.name}</span>
                    {q.role && <span className="text-sm text-[#4a4a4a]">{q.role}</span>}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** "WHY ROHTREMEDIA? Our team makes us successful." with the YouTube play-button plaques image. */
export function TeamBlock({ s }: { s: RecognitionContent["team"] }) {
  return (
    <section aria-labelledby="team-title" className="rm-work-band py-20 md:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {(s.image.media.publicId || s.image.src) && (
          <figure className="rm-work-frame" {...reveal(0, "up-lg")}>
            <Pic pic={s.image} sizes="(min-width: 1024px) 560px, 100vw" />
          </figure>
        )}
        <div className="flex flex-col items-start">
          {s.eyebrow && (
            <p className="rm-label" {...reveal(0)}>
              {s.eyebrow}
            </p>
          )}
          <h2
            id="team-title"
            className="mt-5 text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.045em] max-md:text-[clamp(1.75rem,8vw,2.1rem)]"
            {...reveal(1)}
          >
            {s.title}
          </h2>
          <span aria-hidden="true" className="mt-6 block h-1 w-24 bg-brand" {...reveal(1)} />
          {s.body && (
            <p className="mt-6 text-lg leading-relaxed text-[#3a3a3a]" {...reveal(2)}>
              {s.body}
            </p>
          )}
          {s.linkLabel && s.linkHref && (
            <Link
              href={s.linkHref}
              className="rm-work-back mt-7"
              style={{ "--d": "0.24s" } as CSSProperties}
              data-reveal=""
            >
              {s.linkLabel} <ArrowRightIcon size={18} className="rm-work-arrow" />
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}
