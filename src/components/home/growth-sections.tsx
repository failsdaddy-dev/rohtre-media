import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { METRIC_TINT, type HomeContent, type Tint } from "@/content/home-schema";
import { isFilled } from "@/content/media-slot";
import { metricText } from "@/lib/count-up";
import { SHOW_PLACEHOLDERS } from "@/lib/home-data";
import { CheckIcon, ArrowRightIcon, ServiceIcon } from "../icons";
import { MediaSlot, PhoneFrame } from "../media/media-slot";
import { Container } from "../page-parts";
import { NotLiveTag, reveal, SectionCta, SectionHead } from "./parts";
import { ScrollRow } from "./scroll-row";
import { ShowcaseSlider } from "./showcase-slider";

// The e-commerce growth sections of the home page, after the structure of
// the live rohtremedia.com/e-commerce-marketing page, drawn in this site's
// own design (bands, glow cards, white cards, red accents). Every image and
// video is a MediaSlot (image or video, fixed aspect ratio), filled from
// Admin → Home page. Every section ends with a Book a Call.
// Media-heavy sections use a wider container than the 1200 px default so
// their frames can grow (sizes at 1920 px in website.md, section 3).

const PAD = "py-20 md:py-28";

/** A wider container (the default is 1200 px). */
function Wide({ max, children, className = "" }: { max: 1440 | 1600 | 1680; children: ReactNode; className?: string }) {
  const width = { 1440: "max-w-[1440px]", 1600: "max-w-[1600px]", 1680: "max-w-[1680px]" }[max];
  return <div className={`mx-auto w-full px-4 sm:px-6 ${width} ${className}`}>{children}</div>;
}

/** Icon colour for a tinted disc (--tint-* tokens in globals.css). */
const tint = (t: Tint) => ({ "--tint": `var(--tint-${t})` }) as CSSProperties;
const DISC =
  "grid shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--tint)_16%,transparent)] text-[var(--tint)] ring-1 ring-[color-mix(in_srgb,var(--tint)_28%,transparent)]";

// ------------------------------------------------------------ who we serve
/** Five service cards with large colourful icons on tinted discs, then the values row. */
export function WhoWeServe({ s }: { s: HomeContent["whoWeServe"] }) {
  const five = s.items.length === 5;
  return (
    <section id="services" className={`rm-dark ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} />
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          {s.items.map((item, i) => {
            const logos = item.logos.filter((l) => l.logo_public_id);
            return (
              <li
                key={item.title}
                className={`${five && i >= 3 ? "lg:col-span-3" : "lg:col-span-2"} ${five && i === 4 ? "md:col-span-2 lg:col-span-3" : ""}`}
                {...reveal(i % 3)}
              >
                <div className="rm-glow-card p-7 md:p-9">
                  <span className="rm-glow-face" aria-hidden="true" />
                  <span className="mb-6 flex min-h-24 flex-wrap items-center gap-4 lg:min-h-[104px]">
                    {logos.length > 0 ? (
                      logos.map((l) => (
                        <Image
                          key={l.logo_public_id}
                          src={l.logo_public_id!}
                          alt={l.alt}
                          width={200}
                          height={80}
                          sizes="140px"
                          loading="lazy"
                          className="h-9 w-auto max-w-[140px] object-contain"
                        />
                      ))
                    ) : (
                      <span className={`${DISC} size-24 lg:size-[104px]`} style={tint(item.tint)}>
                        {item.icon === "shopify" ? (
                          // eslint-disable-next-line @next/next/no-img-element -- the official Shopify file, served as is
                          <img
                            src="/brand/platforms/shopify-bag.svg"
                            alt=""
                            width={44}
                            height={50}
                            loading="lazy"
                            className="h-12 w-auto lg:h-[52px]"
                          />
                        ) : (
                          <ServiceIcon name={item.icon} size={44} strokeWidth={1.8} />
                        )}
                      </span>
                    )}
                  </span>
                  <h3 className="mb-3 text-[22px] font-bold tracking-[-0.02em] text-white md:text-2xl">{item.title}</h3>
                  <p className="text-lg leading-relaxed text-white/70">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
        {s.values.length > 0 && (
          <ul className="mt-12 flex flex-wrap justify-center gap-3" {...reveal(1)}>
            {s.values.map((v) => (
              <li
                key={v}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[15px] font-semibold text-white"
              >
                <CheckIcon size={16} className="text-brand" strokeWidth={2.4} />
                {v}
              </li>
            ))}
          </ul>
        )}
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}

// -------------------------------------------------------- product showcase
/**
 * Product cards (9:16 mockups, about 340 px wide at 1920 px) in a
 * scroll-snap slider with arrows: about 4 visible at 1440 px with the next
 * one peeking, 1.15 on phones. No ratings.
 */
export function ProductShowcase({ s }: { s: HomeContent["products"] }) {
  return (
    <section className={`overflow-hidden ${PAD}`}>
      <Wide max={1600}>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} center />
        <ScrollRow label="Products" className="-mx-4 scroll-px-4 gap-5 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {s.items.map((p, i) => (
            <li
              key={i}
              className="w-[calc((100vw-2rem)/1.15)] shrink-0 snap-start sm:w-[calc((100vw-3rem)/2.2)] lg:w-[clamp(260px,21.5vw,340px)]"
              {...reveal(i % 5)}
            >
              <div className="rm-card flex h-full flex-col gap-4 p-3">
                <MediaSlot
                  slot={p.media}
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 44vw, 86vw"
                  maxWidth={1080}
                  className="rounded-[12px]"
                />
                <div className="flex flex-col gap-1 px-1.5 pb-1.5">
                  {p.label && (
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-fg-2">{p.label}</span>
                  )}
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-lg font-bold tracking-[-0.01em]">
                    {p.action} <ArrowRightIcon size={16} className="shrink-0 text-brand" />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ScrollRow>
        <SectionCta {...s.cta} variant="dark" />
      </Wide>
    </section>
  );
}

// ------------------------------------------------- scroll. engage. convert
/** Copy and four points on the left; phone-framed clips (about 370×640 at 1920 px) on the right. */
export function ScrollEngage({ s }: { s: HomeContent["engage"] }) {
  return (
    <section className={`rm-dark rm-grid-bg overflow-hidden ${PAD}`}>
      <Wide
        max={1440}
        className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)] xl:gap-16"
      >
        <div className="min-w-0">
          <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} className="md:mb-8" />
          {s.subline && (
            <p className="mb-4 text-2xl font-bold tracking-[-0.02em] text-white" {...reveal(2)}>
              {s.subline}
            </p>
          )}
          {s.body && (
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-white/70" {...reveal(2)}>
              {s.body}
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.points.map((pt, i) => (
              <li
                key={pt}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[17px] font-semibold text-white"
                {...reveal(i)}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <CheckIcon size={16} strokeWidth={2.6} />
                </span>
                {pt}
              </li>
            ))}
          </ul>
          <SectionCta {...s.cta} center={false} />
        </div>
        <div className="flex min-w-0 items-start justify-center gap-4 sm:gap-6" {...reveal(1, "up-lg")}>
          {s.phones.map((slot, i) => (
            <PhoneFrame
              key={i}
              slot={slot}
              sizes="(min-width: 1280px) 360px, (min-width: 1024px) 23vw, 46vw"
              className={`w-[min(48%,370px)] ${i % 2 === 1 ? "mt-[12%]" : ""}`}
            />
          ))}
        </div>
      </Wide>
    </section>
  );
}

// ------------------------------------------------------ video ads & reels
/** Four 9:16 frames (about 375 px wide at 1920 px): 4 across from 1280 px, 2 from 768 px, a swipe row on phones. */
export function VideoAds({ s }: { s: HomeContent["videoAds"] }) {
  return (
    <section className={`overflow-hidden border-y border-line ${PAD}`}>
      <Wide max={1680}>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} center />
        {(s.strapline || s.body) && (
          <div className="mx-auto -mt-4 mb-12 flex max-w-2xl flex-col items-center gap-3 text-center" {...reveal(2)}>
            {s.strapline && <p className="text-2xl font-bold tracking-[-0.02em]">{s.strapline}</p>}
            {s.body && <p className="text-lg leading-relaxed text-fg-2">{s.body}</p>}
          </div>
        )}
        <ul
          aria-label="Video ads"
          tabIndex={0}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 xl:grid-cols-4"
        >
          {s.items.map((item, i) => (
            <li key={item.title} className="w-[72vw] shrink-0 snap-start md:w-auto" {...reveal(i % 4)}>
              <figure className="rm-card flex h-full flex-col gap-3 p-1.5">
                <MediaSlot
                  slot={item.media}
                  sizes="(min-width: 1280px) 380px, (min-width: 768px) 46vw, 72vw"
                  maxWidth={1080}
                  className="rounded-[14px]"
                />
                <figcaption className="px-2 pb-3 text-center text-[17px] font-bold leading-snug md:text-lg">
                  {item.title}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <SectionCta {...s.cta} variant="dark" />
      </Wide>
    </section>
  );
}

// -------------------------------------------------------- client showcase
type Slide = HomeContent["showcase"]["slides"][number];
type Metric = Slide["metrics"][number];
const shownMetrics = (sl: Slide) =>
  sl.metrics.filter((m): m is Metric & { value: number } => m.enabled && m.value != null);
/** A slide with nothing in it is never shown on the live site (it would look like a made-up result). */
export const isEmptySlide = (sl: Slide) => !sl.brand.trim() && !isFilled(sl.poster) && shownMetrics(sl).length === 0;

/** One number: tinted icon, the value (counts up; its final width is reserved), the label. */
function MetricCell({ m, currency }: { m: Metric & { value: number }; currency: string }) {
  const final = metricText(m);
  return (
    <div className="flex flex-col items-center gap-3 border-b border-r border-line px-2 py-6 text-center md:px-4 md:py-8">
      <dt className="order-last text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-2 md:text-xs">
        {m.label}
      </dt>
      <dd aria-label={final} className="flex flex-col items-center gap-3">
        <span aria-hidden="true" className={`${DISC} size-14 md:size-16`} style={tint(METRIC_TINT[m.icon])}>
          {m.icon === "currency" ? (
            <span className="text-2xl font-bold leading-none md:text-[26px]">{currency}</span>
          ) : (
            <ServiceIcon name={m.icon} size={26} />
          )}
        </span>
        <span
          aria-hidden="true"
          className="relative whitespace-nowrap text-[clamp(1.9rem,3vw,2.75rem)] font-bold leading-none tracking-[-0.03em] tabular-nums"
        >
          <span className="invisible">{final}</span>
          <span
            data-count={m.value}
            data-decimals={m.decimals}
            data-prefix={m.prefix}
            data-suffix={m.suffix}
            className="absolute inset-0 text-center"
          >
            {final}
          </span>
        </span>
      </dd>
    </div>
  );
}

function ShowcaseSlide({ sl }: { sl: Slide }) {
  const metrics = shownMetrics(sl);
  const note = [sl.period, sl.source].filter((v) => v.trim()).join(" · ");
  return (
    <article className="grid items-center gap-6 lg:grid-cols-[46%_minmax(0,1fr)] lg:gap-10">
      <MediaSlot
        slot={sl.poster}
        sizes="(min-width: 1280px) 530px, (min-width: 1024px) 44vw, 92vw"
        maxWidth={1600}
        className="rounded-[1.5rem]"
      />
      <div className="rm-card p-6 md:p-10">
        {sl.brand ? (
          <h3 className="text-xl font-bold tracking-[-0.01em] md:text-2xl">{sl.brand}</h3>
        ) : (
          <NotLiveTag>Client name to add</NotLiveTag>
        )}
        <span aria-hidden="true" className="mt-3 block h-[3px] w-12 rounded-full bg-brand" />
        {note && <p className="mt-3 text-sm text-fg-2">{note}</p>}
        {metrics.length > 0 ? (
          <div className="mt-6 overflow-hidden">
            <dl className="-mb-px -mr-px grid grid-cols-2 lg:grid-cols-3">
              {metrics.map((m, i) => (
                <MetricCell key={i} m={m} currency={sl.currency} />
              ))}
            </dl>
          </div>
        ) : (
          SHOW_PLACEHOLDERS && (
            <p className="mt-6">
              <NotLiveTag>Numbers to add (ROAS, sales, orders…)</NotLiveTag>
            </p>
          )
        )}
      </div>
    </article>
  );
}

/** "We build growth that shows": a carousel of client slides, a big poster and six counting numbers each. */
export function ClientShowcase({ s }: { s: HomeContent["showcase"] }) {
  const slides = s.slides.filter((sl) => SHOW_PLACEHOLDERS || !isEmptySlide(sl));
  if (slides.length === 0) return null;
  return (
    <section className={`overflow-hidden ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} center />
        <div {...reveal(0, "up-lg")}>
          <ShowcaseSlider label="Client results">
            {slides.map((sl, i) => (
              <ShowcaseSlide key={i} sl={sl} />
            ))}
          </ShowcaseSlider>
        </div>
        <SectionCta {...s.cta} variant="dark" />
      </Container>
    </section>
  );
}

// ---------------------------------------------------- brands we've worked with
type BrandItem = HomeContent["brands"]["items"][number];

function BrandTile({ b }: { b: BrandItem }) {
  return (
    <span className="grid h-24 w-44 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 md:h-28 md:w-52">
      <Image
        src={b.logo_public_id!}
        alt={b.alt || b.name}
        width={240}
        height={120}
        sizes="180px"
        loading="lazy"
        className="max-h-14 w-auto max-w-full object-contain md:max-h-16"
      />
    </span>
  );
}

/** Client logos drifting sideways (the same marquee as the testimonials). */
export function Brands({ s }: { s: HomeContent["brands"] }) {
  const items = s.items.filter((b) => b.enabled && b.logo_public_id);
  if (items.length === 0) return null;
  // Repeat a short list so one copy is always wider than the screen.
  const row: BrandItem[] = [];
  while (row.length < 10) row.push(...items);
  return (
    <section className={`rm-dark overflow-hidden ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} center />
      </Container>
      <div className="rm-marquee" {...reveal(0, "fade")}>
        <div className="rm-marquee-track" style={{ "--marquee-duration": `${row.length * 4}s` } as CSSProperties}>
          <ul className="flex gap-6" aria-label="Brands we have worked with">
            {row.map((b, i) => (
              <li key={`${b.name}-${i}`} aria-hidden={i >= items.length ? true : undefined}>
                <BrandTile b={b} />
              </li>
            ))}
          </ul>
          <ul className="flex gap-6" aria-hidden="true" inert>
            {row.map((b, i) => (
              <li key={`${b.name}-copy-${i}`}>
                <BrandTile b={b} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Container>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}
