import type { CSSProperties } from "react";
import type { HomeContent } from "@/content/home-schema";
import { isFilled, playsAsVideo } from "@/content/media-slot";
import { SHOW_PLACEHOLDERS } from "@/lib/home-data";
import { ArrowRightIcon, ChatIcon } from "../icons";
import { MediaSlot, stillFor, stillSrcSet } from "../media/media-slot";
import { ButtonLink, Container } from "../page-parts";
import { BOOK_CALL_HREF } from "../site-header";
import { HeroMagnet } from "./hero-magnet";
import { HeroSlider } from "./hero-slider";
import { PlaceholderBox, reveal } from "./parts";

// Hero (R14), two layouts chosen in the admin (hero.mode):
//   composition (default): on the left the pill, the real visible H1
//     (two-tone), a dot-separated line, a 16:9 video with its caption, Book a
//     Call and a small line; on the right the visual (the coded magnet
//     illustration, or an uploaded transparent image/video shown whole).
//     Phones stack it: headline, line, video, button, visual.
//   slider: the earlier layout, centred headline + two calls to action, then
//     the two finished slides (each crop an image or a video, separate
//     desktop and mobile crops) in a framed slider. Slide 1 loads eagerly
//     with high priority; slide 2 lazily.
// verified: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md
//   (art direction with <picture>; loading="eager" + fetchPriority="high"
//   rather than `preload` when the image differs by viewport)
// The H1 is visible rather than screen-reader-only: Google has no official
// guidance on hidden H1s (unverified), so the safe choice is visible text.

const DESKTOP_MIN = "(min-width: 768px)";
const SIZES = "(min-width: 1240px) 1200px, 100vw";
const enter = (i: number) => ({ className: "rm-hero-in", style: { "--i": i } as CSSProperties });

type SlideData = HomeContent["hero"]["slides"][number];
const slideFilled = (s: SlideData) => isFilled(s.desktop) && isFilled(s.mobile);

/**
 * One slide. The still layer is always a <picture> (desktop crop from 768 px
 * up, mobile crop below), so only one file loads, and for the first slide it
 * is the LCP image (eager, high priority). A slot that is a video (or GIF)
 * adds its clip on top, shown only at its own breakpoint; MediaPlayback
 * starts it after the page has loaded, and never for reduced motion.
 */
function Slide({ slide, index }: { slide: SlideData; index: number }) {
  const first = index === 0;
  if (!slideFilled(slide)) {
    return (
      <PlaceholderBox
        title={`Hero slide ${index + 1}`}
        className="aspect-[4/5] w-full rounded-none border-0 bg-[#0d0d0d] md:aspect-[12/5]"
      >
        Upload a desktop (12:5, about 1920×800) and a mobile (4:5, about 1080×1350) image or video, with alt text.
      </PlaceholderBox>
    );
  }
  const { desktop, mobile } = slide;
  const alt = desktop.alt || mobile.alt;
  const clip = (slot: typeof desktop, at: string) =>
    playsAsVideo(slot) && (
      <div className={`absolute inset-0 ${at}`}>
        <MediaSlot slot={{ ...slot, alt: "" }} sizes={SIZES} className="h-full" />
      </div>
    );
  const picture = (
    <div className="relative">
      <picture>
        <source media={DESKTOP_MIN} srcSet={stillSrcSet(desktop)} sizes={SIZES} />
        <img
          src={stillFor(mobile, 1080) ?? undefined}
          srcSet={stillSrcSet(mobile)}
          sizes={SIZES}
          alt={alt}
          loading={first ? "eager" : "lazy"}
          fetchPriority={first ? "high" : "auto"}
          decoding="async"
          className="aspect-[4/5] w-full object-cover md:aspect-[12/5]"
        />
      </picture>
      {clip(mobile, "md:hidden")}
      {clip(desktop, "hidden md:block")}
    </div>
  );
  return slide.href ? (
    <a href={slide.href} className="block">
      {picture}
    </a>
  ) : (
    picture
  );
}

type HeroProps = { hero: HomeContent["hero"]; whatsappHref: string | null };

export function Hero(props: HeroProps) {
  return props.hero.mode === "slider" ? <SliderHero {...props} /> : <CompositionHero hero={props.hero} />;
}

/** Headline + video on the left, the visual on the right (stacked on phones). */
function CompositionHero({ hero }: { hero: HomeContent["hero"] }) {
  return (
    <section aria-label="Introduction" className="rm-dark rm-hero-dark rm-beams overflow-hidden">
      <div className="flex min-h-[100svh] items-center">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,620px)_minmax(0,1fr)] xl:gap-16">
          <div className="flex min-w-0 flex-col items-start">
            {hero.eyebrow && (
              <p {...enter(0)}>
                <span className="rm-pill mb-7">{hero.eyebrow}</span>
              </p>
            )}
            <h1
              className="rm-hero-in mb-5 text-[clamp(2.5rem,4.8vw,4.5rem)] font-semibold leading-[1.06] tracking-[-0.04em]"
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
            {hero.tagline.length > 0 && (
              <ul
                className="rm-hero-in mb-8 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[15px] font-semibold text-[#f2f2f2] md:text-base"
                style={{ "--i": 2 } as CSSProperties}
              >
                {hero.tagline.map((t, i) => (
                  <li key={t} className="flex items-center gap-3">
                    {i > 0 && <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />}
                    {t}
                  </li>
                ))}
              </ul>
            )}
            <figure className="rm-hero-in mb-9 w-full max-w-[620px]" style={{ "--i": 3 } as CSSProperties}>
              <MediaSlot
                slot={hero.video}
                sizes="(min-width: 1280px) 620px, (min-width: 1024px) 46vw, 92vw"
                maxWidth={1280}
                priority
                className="rounded-[20px] border border-white/10 shadow-[0_30px_90px_-40px_rgba(229,9,20,0.5)]"
              />
              {hero.videoCaption && (
                <figcaption className="mt-3 text-[15px] font-semibold text-white/85">{hero.videoCaption}</figcaption>
              )}
            </figure>
            <div className="rm-hero-in flex flex-col items-start gap-3" style={{ "--i": 4 } as CSSProperties}>
              <span className="rounded-full shadow-[0_6px_28px_rgba(229,9,20,0.35)]">
                <ButtonLink href={BOOK_CALL_HREF} track="book_call_click" size="lg">
                  {hero.ctaLabel} <ArrowRightIcon size={20} />
                </ButtonLink>
              </span>
              {hero.ctaNote && <p className="text-sm text-white/75">{hero.ctaNote}</p>}
            </div>
          </div>
          <div className="rm-hero-in mx-auto w-full max-w-[720px] min-w-0" style={{ "--i": 3 } as CSSProperties}>
            {hero.visual === "media" ? (
              <MediaSlot
                slot={hero.visualMedia}
                sizes="(min-width: 1280px) 720px, (min-width: 1024px) 48vw, 92vw"
                maxWidth={1600}
                fit="contain"
              />
            ) : (
              <HeroMagnet />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The earlier layout: centred headline and calls to action, then the two-slide slider. */
function SliderHero({ hero, whatsappHref }: HeroProps) {
  const slides = hero.slides.filter((s) => SHOW_PLACEHOLDERS || slideFilled(s));
  return (
    <section aria-label="Introduction" className="rm-dark rm-hero-dark rm-beams overflow-hidden">
      <div className="flex min-h-[100svh] items-center">
        <Container className="flex flex-col items-center py-24 text-center">
          {hero.eyebrow && (
            <p {...enter(0)}>
              <span className="rm-pill mb-8">{hero.eyebrow}</span>
            </p>
          )}
          <h1
            className="rm-hero-in mb-6 max-w-5xl text-[clamp(2.5rem,6.4vw,5rem)] font-semibold leading-[1.06] tracking-[-0.04em]"
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
            <p
              className="rm-hero-in mb-10 max-w-3xl text-lg leading-relaxed text-[#f2f2f2] md:text-xl"
              style={{ "--i": 2 } as CSSProperties}
            >
              {hero.subline}
            </p>
          )}
          <div
            className="rm-hero-in flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ "--i": 3 } as CSSProperties}
          >
            <span className="rounded-full shadow-[0_6px_28px_rgba(229,9,20,0.35)]">
              <ButtonLink href={BOOK_CALL_HREF} track="book_call_click" size="lg">
                {hero.ctaLabel} <ArrowRightIcon size={20} />
              </ButtonLink>
            </span>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener"
                className="rm-press inline-flex h-14 items-center gap-2 rounded-full border border-white/20 px-7 text-lg font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ChatIcon size={18} /> WhatsApp us
              </a>
            )}
          </div>
        </Container>
      </div>

      {slides.length > 0 && (
        <Container className="pb-20 sm:pb-28">
          <div
            className="overflow-hidden rounded-[28px] border border-white/10 shadow-[0_40px_120px_-40px_rgba(229,9,20,0.45)]"
            {...reveal(0, "up-lg")}
          >
            <HeroSlider labels={slides.map((s, i) => s.desktop.alt || s.mobile.alt || `Slide ${i + 1}`)}>
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
