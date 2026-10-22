import Image from "next/image";
import type { CSSProperties } from "react";
import type { HomeContent } from "@/content/home-schema";
import { isFilled } from "@/content/media-slot";
import { SHOW_PLACEHOLDERS } from "@/lib/home-data";
import { CheckIcon, ArrowRightIcon, ServiceIcon } from "../icons";
import { MediaSlot, PhoneFrame } from "../media/media-slot";
import { Container } from "../page-parts";
import { NotLiveTag, reveal, SectionCta, SectionHead } from "./parts";

// The e-commerce growth sections of the home page, after the structure of
// the live rohtremedia.com/e-commerce-marketing page, drawn in this site's
// own design (bands, glow cards, white cards, red accents). Every image and
// video is a MediaSlot (image or video, fixed aspect ratio) that ships empty
// and is filled from Admin → Home page. Every section ends with a Book a Call.

const PAD = "py-20 md:py-28";

// ------------------------------------------------------------ who we serve
/** Five service cards (replaces the old nine-card services grid), then the values row. */
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
                  <span className="mb-6 flex min-h-[52px] flex-wrap items-center gap-4">
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
                      <span className="grid size-[52px] place-items-center bg-white/[0.06] text-brand">
                        <ServiceIcon name={item.icon} size={24} />
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
/** Five product slots (4:5). A swipeable row on phones, a grid from tablets up. No ratings. */
export function ProductShowcase({ s }: { s: HomeContent["products"] }) {
  return (
    <section className={PAD}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} center />
        <ul
          aria-label="Products"
          tabIndex={0}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-5"
        >
          {s.items.map((p, i) => (
            <li key={i} className="w-[68%] shrink-0 snap-start sm:w-[44%] md:w-auto" {...reveal(i % 5)}>
              <div className="rm-card flex h-full flex-col gap-4 p-3">
                <MediaSlot
                  slot={p.media}
                  sizes="(min-width: 1024px) 230px, (min-width: 768px) 32vw, 68vw"
                  maxWidth={1080}
                  className="rounded-[12px]"
                />
                <div className="flex flex-col gap-1 px-1.5 pb-1.5">
                  {p.label && (
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-fg-2">{p.label}</span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-lg font-bold tracking-[-0.01em]">
                    {p.action} <ArrowRightIcon size={16} className="text-brand" />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <SectionCta {...s.cta} variant="dark" />
      </Container>
    </section>
  );
}

// ------------------------------------------------- scroll. engage. convert
/** Copy and four points on the left; phone-framed clips on the right. */
export function ScrollEngage({ s }: { s: HomeContent["engage"] }) {
  return (
    <section className={`rm-dark rm-grid-bg overflow-hidden ${PAD}`}>
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
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
        <div className="flex items-start justify-center gap-4 sm:gap-6" {...reveal(1, "up-lg")}>
          {s.phones.map((slot, i) => (
            <PhoneFrame
              key={i}
              slot={slot}
              sizes="(min-width: 1024px) 240px, 44vw"
              className={`w-[min(46%,250px)] ${i % 2 === 1 ? "mt-12" : ""}`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------ video ads & reels
export function VideoAds({ s }: { s: HomeContent["videoAds"] }) {
  return (
    <section className={`border-y border-line ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} center />
        {(s.strapline || s.body) && (
          <div className="mx-auto -mt-4 mb-12 flex max-w-2xl flex-col items-center gap-3 text-center" {...reveal(2)}>
            {s.strapline && <p className="text-2xl font-bold tracking-[-0.02em]">{s.strapline}</p>}
            {s.body && <p className="text-lg leading-relaxed text-fg-2">{s.body}</p>}
          </div>
        )}
        <ul className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {s.items.map((item, i) => (
            <li key={item.title} {...reveal(i % 4)}>
              <figure className="rm-card flex h-full flex-col gap-3 p-2.5">
                <MediaSlot
                  slot={item.media}
                  sizes="(min-width: 1024px) 280px, 46vw"
                  maxWidth={828}
                  className="rounded-[12px]"
                />
                <figcaption className="px-2 pb-2 text-[17px] font-bold leading-snug md:text-lg">
                  {item.title}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <SectionCta {...s.cta} variant="dark" />
      </Container>
    </section>
  );
}

// -------------------------------------------------------- client showcase
const METRICS = [
  ["roas", "ROAS", "x"],
  ["sales", "Sales", "x"],
  ["orders", "Orders", "x"],
  ["impressions", "Impressions", "M+"],
  ["lowerCpa", "Lower CPA", "%"],
  ["conversionRate", "Conversion rate", "%"],
] as const;

type ShowcaseItem = HomeContent["showcase"]["items"][number];
const hasMetrics = (c: ShowcaseItem) => Object.values(c.metrics).some((v) => v != null);
/** A card with nothing in it is never shown on the live site (it would look like a made-up result). */
export const isEmptyShowcase = (c: ShowcaseItem) =>
  !c.client.trim() && !c.logo_public_id && !isFilled(c.media) && !hasMetrics(c);

/** Client cards: media, client name and logo, up to six numbers (only those with a value). */
export function ClientShowcase({ s }: { s: HomeContent["showcase"] }) {
  const items = s.items.filter((c) => SHOW_PLACEHOLDERS || !isEmptyShowcase(c));
  if (items.length === 0) return null;
  return (
    <section className={PAD}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} center />
        <ul className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {items.map((c, i) => (
            <li key={i} {...reveal(i % 2, "up-lg")}>
              <article className="rm-card grid h-full gap-6 p-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:p-5">
                <MediaSlot
                  slot={c.media}
                  sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 92vw"
                  maxWidth={1080}
                  className="rounded-[14px]"
                />
                <div className="flex flex-col gap-5 py-2 sm:pr-2">
                  <div className="flex items-center gap-3">
                    {c.logo_public_id && (
                      <span className="grid h-12 min-w-12 place-items-center rounded-xl bg-[#0d0d0d] px-2.5">
                        <Image
                          src={c.logo_public_id}
                          alt=""
                          width={160}
                          height={64}
                          sizes="96px"
                          loading="lazy"
                          className="h-8 w-auto max-w-[96px] object-contain"
                        />
                      </span>
                    )}
                    {c.client ? (
                      <h3 className="text-2xl font-bold tracking-[-0.02em]">{c.client}</h3>
                    ) : (
                      <NotLiveTag>Client name to add</NotLiveTag>
                    )}
                  </div>
                  {hasMetrics(c) ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                      {METRICS.filter(([k]) => c.metrics[k] != null).map(([k, label, unit]) => (
                        <div key={k} className="flex flex-col-reverse gap-1 border-t border-line pt-3">
                          <dt className="text-[12px] font-bold uppercase tracking-[0.14em] text-fg-2">{label}</dt>
                          <dd className="text-[clamp(1.8rem,3.4vw,2.4rem)] font-bold leading-none tracking-[-0.04em] text-brand">
                            {c.metrics[k]}
                            {unit}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    SHOW_PLACEHOLDERS && <NotLiveTag>Numbers to add (ROAS, sales, orders…)</NotLiveTag>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
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
