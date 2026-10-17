import { getImageProps } from "next/image";
import type { HomeContent } from "@/content/home-schema";
import { SHOW_PLACEHOLDERS } from "@/lib/home-data";
import { ArrowRightIcon } from "../icons";
import { ButtonLink, Container } from "../page-parts";
import { BOOK_CALL_HREF } from "../site-header";
import { PlaceholderBox } from "./parts";
import { HeroSlider } from "./hero-slider";

// Hero (R14): exactly two finished slides (text baked into the images) with
// separate desktop and mobile crops, then a real, visible H1. Slide 1 loads
// eagerly with high priority (it is the LCP image); slide 2 loads lazily.
// verified: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md
//   (getImageProps art direction; use loading="eager" + fetchPriority="high"
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
        className="aspect-[4/5] w-full rounded-none border-x-0 md:aspect-[12/5]"
      >
        Upload a finished desktop image (about 1920×800) and a mobile image (about 1080×1350), with alt text.
      </PlaceholderBox>
    );
  }
  const common = { alt: slide.alt, sizes: "100vw" };
  const loading = first ? ("eager" as const) : ("lazy" as const);
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
    loading,
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

export function Hero({ hero }: { hero: HomeContent["hero"] }) {
  const slides = hero.slides.filter((s) => SHOW_PLACEHOLDERS || (s.desktop && s.mobile));
  return (
    <section aria-label="Introduction">
      {slides.length > 0 && (
        <HeroSlider labels={slides.map((s, i) => s.alt || `Slide ${i + 1}`)}>
          {slides.map((s, i) => (
            <Slide key={i} slide={s} index={i} />
          ))}
        </HeroSlider>
      )}
      <div className="rm-hero-bg border-b border-line">
        <Container className="flex flex-col items-start gap-5 py-12 sm:py-16 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="rm-rise-in text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.04em]">
              {hero.h1}
            </h1>
            {hero.subline && <p className="rm-rise-in text-lg text-fg-2 [--i:1]">{hero.subline}</p>}
          </div>
          <div className="rm-rise-in shrink-0 [--i:2]">
            <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
              {hero.ctaLabel} <ArrowRightIcon size={18} />
            </ButtonLink>
          </div>
        </Container>
      </div>
    </section>
  );
}
