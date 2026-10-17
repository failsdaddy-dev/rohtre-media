import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import type { HomeContent } from "@/content/home-schema";
import { SHOW_PLACEHOLDERS } from "@/lib/home-data";
import { ArrowRightIcon, ChatIcon } from "../icons";
import { ButtonLink, Container } from "../page-parts";
import { BOOK_CALL_HREF } from "../site-header";
import { HeroSlider } from "./hero-slider";
import { PlaceholderBox } from "./parts";

// Hero (R14): a dark band with a pill label, the real visible H1 (two-tone),
// the two calls to action, then the two finished slides (text baked into the
// images) with separate desktop and mobile crops in a framed slider.
// Slide 1 loads eagerly with high priority; slide 2 loads lazily.
// verified: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md
//   (getImageProps art direction; loading="eager" + fetchPriority="high"
//   rather than `preload` when the image differs by viewport)
// The H1 is visible rather than screen-reader-only: Google has no official
// guidance on hidden H1s (unverified), so the safe choice is visible text.

const DESKTOP_MIN = "(min-width: 768px)";

function Slide({ slide, index }: { slide: HomeContent["hero"]["slides"][number]; index: number }) {
  const first = index === 0;
  if (!slide.desktop || !slide.mobile) {
    return (
      <PlaceholderBox
        title={`Hero slide ${index + 1}`}
        className="aspect-[4/5] w-full rounded-none border-0 md:aspect-[12/5]"
      >
        Upload a finished desktop image (about 1920×800) and a mobile image (about 1080×1350), with alt text.
      </PlaceholderBox>
    );
  }
  const common = { alt: slide.alt, sizes: "(min-width: 1240px) 1200px, 100vw" };
  const {
    props: { srcSet: desktopSet },
  } = getImageProps({
    ...common,
    src: slide.desktop.publicId,
    width: slide.desktop.width,
    height: slide.desktop.height,
  });
  const {
    props: { srcSet: mobileSet, ...img },
  } = getImageProps({
    ...common,
    src: slide.mobile.publicId,
    width: slide.mobile.width,
    height: slide.mobile.height,
    loading: first ? "eager" : "lazy",
    fetchPriority: first ? "high" : "auto",
  });
  const picture = (
    <picture>
      <source media={DESKTOP_MIN} srcSet={desktopSet} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...img} srcSet={mobileSet} className="aspect-[4/5] w-full object-cover md:aspect-[12/5]" />
    </picture>
  );
  return slide.href ? (
    <a href={slide.href} className="block">
      {picture}
    </a>
  ) : (
    picture
  );
}

export function Hero({ hero, whatsappHref }: { hero: HomeContent["hero"]; whatsappHref: string | null }) {
  const slides = hero.slides.filter((s) => SHOW_PLACEHOLDERS || (s.desktop && s.mobile));
  return (
    <section aria-label="Introduction" className="rm-dark rm-hero-dark rm-hero-bg rm-glow overflow-hidden">
      <Container className="flex flex-col items-center gap-6 pb-14 pt-16 text-center sm:pt-24">
        {hero.eyebrow && <p className="rm-pill rm-rise-in">{hero.eyebrow}</p>}
        <h1
          className="rm-rise-in max-w-4xl text-[clamp(2.6rem,7vw,5.25rem)] font-bold leading-[0.95] tracking-[-0.045em]"
          style={{ "--i": 1 } as CSSProperties}
        >
          {hero.h1}
          {hero.h1Accent && (
            <>
              {" "}
              <span className="rm-text-grad block pb-1">{hero.h1Accent}</span>
            </>
          )}
        </h1>
        {hero.subline && (
          <p className="rm-rise-in max-w-2xl text-lg text-fg-2" style={{ "--i": 2 } as CSSProperties}>
            {hero.subline}
          </p>
        )}
        <div className="rm-rise-in flex flex-wrap justify-center gap-3 pt-2" style={{ "--i": 3 } as CSSProperties}>
          <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
            {hero.ctaLabel} <ArrowRightIcon size={18} />
          </ButtonLink>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener"
              className="rm-press inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 font-semibold hover:bg-hover"
            >
              <ChatIcon size={18} /> WhatsApp us
            </a>
          )}
        </div>
      </Container>

      {slides.length > 0 && (
        <Container className="pb-16 sm:pb-24">
          <div
            className="rm-rise-in overflow-hidden rounded-[24px] border border-line bg-bg-elev shadow-[0_40px_120px_-40px_color-mix(in_srgb,var(--brand)_45%,transparent)]"
            style={{ "--i": 4 } as CSSProperties}
          >
            <HeroSlider labels={slides.map((s, i) => s.alt || `Slide ${i + 1}`)}>
              {slides.map((s, i) => (
                <Slide key={i} slide={s} index={i} />
              ))}
            </HeroSlider>
          </div>
        </Container>
      )}
    </section>
  );
}
