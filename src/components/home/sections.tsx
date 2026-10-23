import Image from "next/image";
import type { CSSProperties } from "react";
import type { HomeContent } from "@/content/home-schema";
import { BADGE_LAYOUT, badgeLayout } from "@/content/layout-presets";
import { isLiveProof, SHOW_PLACEHOLDERS, type Badge, type Result, type Testimonial } from "@/lib/home-data";
import { publicBadges } from "@/lib/proof";
import { ArrowRightIcon, AwardIcon, StepIcon } from "../icons";
import { ButtonLink, Container } from "../page-parts";
import { BOOK_CALL_HREF } from "../site-header";
import { NotLiveTag, PlaceholderBox, reveal, SectionCta, SectionHead } from "./parts";

// Home sections (R13): warm off-white and near-black bands alternate, the
// layout and motion modelled on the reference site in RohTre's colours.
// Each section is a server component fed by the content schema
// (src/content/home-schema.ts) and the proof tables. Anything not approved
// shows only while building, marked; the live site leaves it out. Every
// section ends with a Book a Call.

const PAD = "py-20 md:py-28";

// ------------------------------------------------------------------- badges
/** One badge's logo as the strip draws it: white silhouette, on a white plate, or as uploaded. */
export function BadgeLogo({ badge }: { badge: Pick<Badge, "label" | "image_public_id" | "logo_style"> }) {
  if (!badge.image_public_id) {
    return /^\d/.test(badge.label) ? (
      <span className="whitespace-nowrap text-[min(calc(var(--logo-h)*0.78),15cqw)] font-bold leading-none tracking-[-0.05em]">
        {badge.label.trim()}
      </span>
    ) : (
      <AwardIcon size={48} className="size-[var(--logo-h)]" strokeWidth={1.6} />
    );
  }
  const style = badge.logo_style ?? "white";
  const img = (
    <Image
      src={badge.image_public_id}
      alt=""
      width={320}
      height={128}
      sizes="240px"
      loading="lazy"
      className={`rm-badge-logo ${style === "white" ? "rm-logo-white" : ""}`}
    />
  );
  return style === "plate" ? <span className="rm-logo-plate">{img}</span> : img;
}

/**
 * Partner badges (R11) as a full-bleed red band (the --brand token, white
 * text, thin lighter-red dividers). Logos grow when there are fewer badges
 * and the cells re-flow by count with no code change (badgeLayout() in
 * layout-presets.ts). Only live (switched-on) badges render, in every
 * environment; the data query applies the same rule.
 */
export function BadgeBar({ s, badges: all }: { s: HomeContent["badges"]; badges: Badge[] }) {
  const badges = publicBadges(all);
  if (badges.length === 0) return null;
  const layout = badgeLayout(badges.length);
  return (
    <section id="partners" aria-label="Partners and recognition" className={`rm-dark border-y border-line ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} center />
      </Container>
      <div className="overflow-hidden bg-brand text-brand-fg" {...reveal(2, "fade")}>
        <ul
          className="rm-badges mx-auto max-w-[1600px]"
          data-group={layout.group}
          data-count={badges.length}
          style={
            {
              "--logo-h-lg": `${layout.logoPx}px`,
              "--logo-h-sm": `${layout.mobileLogoPx}px`,
              "--cell-max": `${BADGE_LAYOUT.few.cellMaxPx}px`,
            } as CSSProperties
          }
        >
          {badges.map((b) => (
            <li
              key={b.id}
              className="flex min-h-44 flex-col [container-type:inline-size] items-center justify-center gap-4 px-4 py-9 text-center md:min-h-56 md:px-6 md:py-11"
            >
              <span className="grid h-[var(--logo-h)] max-w-full place-items-center">
                <BadgeLogo badge={b} />
              </span>
              <span>
                {!/^\d/.test(b.label) && (
                  <span className="block text-balance text-sm font-bold uppercase leading-snug tracking-[0.14em]">
                    {b.label}
                  </span>
                )}
                {b.sublabel && (
                  <span className="mt-1.5 block text-balance text-sm font-semibold tracking-[0.02em]">
                    {b.sublabel}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Container>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ results
/** Proof blocks (R19) as big cards that stack while scrolling: white, red, black. Media area 1:1 (was 4:3, +33% tall). */
const TONES = [
  "bg-white text-[#0a0a0a] [--fg-2:#5c5c5c]",
  "bg-brand text-white [--fg-2:rgba(255,255,255,0.85)]",
  "bg-[#0d0d0d] text-white border border-white/10 [--fg-2:#9a9a9a]",
];

export function Results({ s, results }: { s: HomeContent["results"]; results: Result[] }) {
  return (
    <section id="results" className={`rm-dark rm-grid-bg ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} />
        <ol className="rm-stack flex flex-col gap-8 md:gap-24">
          {results.map((r, i) => (
            <li key={r.id} style={{ "--i": i } as CSSProperties}>
              <article
                className={`overflow-hidden rounded-[1.5rem] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)] md:rounded-[2.5rem] ${TONES[i % 3]}`}
                {...reveal(0, "up-lg")}
              >
                {r.is_placeholder ? (
                  <div className="p-5 md:p-10">
                    <PlaceholderBox title={`Result ${i + 1}`} className="min-h-96 border-current">
                      Brand name and logo, one real metric, a short summary and a dashboard screenshot on the right.
                    </PlaceholderBox>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8 p-6 md:p-10 lg:flex-row lg:gap-12">
                    <div className="flex w-full flex-1 flex-col gap-4">
                      {!isLiveProof(r) && <NotLiveTag>Not approved yet</NotLiveTag>}
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-80">{r.brand_name}</p>
                      <p className="text-[clamp(3rem,7vw,5.5rem)] font-bold leading-none tracking-[-0.05em]">
                        {r.metric_value}
                      </p>
                      <p className="text-xl font-semibold md:text-2xl">{r.metric_label}</p>
                      {r.summary && <p className="max-w-md text-[var(--fg-2)]">{r.summary}</p>}
                    </div>
                    {r.image_public_id && (
                      <Image
                        src={r.image_public_id}
                        alt={r.image_alt ?? ""}
                        width={720}
                        height={720}
                        sizes="(max-width: 1024px) 100vw, 460px"
                        loading="lazy"
                        className="aspect-square w-full max-w-[460px] rounded-[1.25rem] object-cover md:rounded-[1.75rem]"
                      />
                    )}
                  </div>
                )}
              </article>
            </li>
          ))}
        </ol>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}

// -------------------------------------------------------------- stripe band
/** The brand name filled with moving red/off-white stripes. Decorative. */
export function StripeBand({ text = "ROHTRE MEDIA" }: { text?: string }) {
  return (
    <section aria-hidden="true" className="rm-stripe-band">
      <span className="rm-stripe-text">{text}</span>
    </section>
  );
}

// ------------------------------------------------------------------ process
/** Heading on the left (sticky), the steps as a vertical timeline on the right. */
export function Process({ s }: { s: HomeContent["process"] }) {
  return (
    <section id="process" className={PAD}>
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+56px)] lg:self-start">
          <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} className="md:mb-0" />
          <SectionCta {...s.cta} center={false} />
        </div>
        <ol className="flex flex-col">
          {s.steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-6 pb-14 last:pb-0" {...reveal(i)}>
              {i < s.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-7 top-16 border-l-2 border-dashed border-line"
                />
              )}
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-line bg-white text-brand shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
                <StepIcon index={i} size={22} />
              </span>
              <div className="flex flex-col gap-2.5 pt-1">
                <span className="w-fit rounded-md bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                  Step {i + 1}
                </span>
                <h3 className="text-2xl font-bold tracking-[-0.02em]">{step.title}</h3>
                <p className="max-w-md leading-relaxed text-fg-2">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------- testimonials
function Quote({ t }: { t: Testimonial }) {
  return (
    <figure
      className={`flex h-full w-[min(380px,84vw)] shrink-0 flex-col gap-5 rounded-[2rem] border bg-white p-7 shadow-[0_14px_40px_-26px_rgba(0,0,0,0.35)] ${
        isLiveProof(t) ? "border-line" : "border-dashed border-brand"
      }`}
    >
      {!isLiveProof(t) && <NotLiveTag>{t.is_placeholder ? "Placeholder" : "Needs client’s permission"}</NotLiveTag>}
      <blockquote className="flex-1 text-[15px] italic leading-relaxed text-[#2b2b2b]">“{t.quote}”</blockquote>
      <figcaption className="flex items-center gap-3 border-t border-line pt-4">
        {t.photo_public_id ? (
          <Image
            src={t.photo_public_id}
            alt=""
            width={96}
            height={96}
            sizes="44px"
            loading="lazy"
            className="size-11 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-full bg-brand font-bold text-white"
          >
            {t.person_name.charAt(0)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{t.person_name}</span>
          {(t.person_role || t.company) && (
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">
              {[t.person_role, t.company].filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
        {t.logo_public_id && (
          <span className="grid h-11 shrink-0 place-items-center rounded-xl bg-[#0d0d0d] px-2.5">
            <Image
              src={t.logo_public_id}
              alt={t.company ?? ""}
              width={160}
              height={64}
              sizes="80px"
              loading="lazy"
              className="h-7 w-auto max-w-[80px] object-contain"
            />
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/** Repeat a short row so one copy is always wider than the screen. */
function fillRow(items: Testimonial[], min = 6): Testimonial[] {
  if (items.length === 0) return items;
  const out: Testimonial[] = [];
  while (out.length < min) out.push(...items);
  return out;
}

function MarqueeRow({ items: given, reverse }: { items: Testimonial[]; reverse?: boolean }) {
  const items = fillRow(given);
  return (
    <div className="rm-marquee py-3" data-reverse={reverse ? "" : undefined}>
      <div
        className="rm-marquee-track"
        style={{ "--marquee-duration": `${Math.max(items.length, 3) * 13}s` } as CSSProperties}
      >
        <ul className="flex gap-6">
          {items.map((t, i) => (
            <li key={`${t.id}-${i}`} aria-hidden={i >= given.length ? true : undefined}>
              <Quote t={t} />
            </li>
          ))}
        </ul>
        {/* Second copy so the loop is seamless; hidden from screen readers and keyboards. */}
        <ul className="flex gap-6" aria-hidden="true" inert>
          {items.map((t, i) => (
            <li key={`${t.id}-copy-${i}`}>
              <Quote t={t} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Testimonials({ s, items }: { s: HomeContent["testimonials"]; items: Testimonial[] }) {
  const rows = items.length >= 4 ? [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)] : [items];
  return (
    <section id="testimonials" className={`overflow-hidden border-y border-line ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} center />
      </Container>
      {s.variant === "slider" ? (
        <div className="flex flex-col gap-2" {...reveal(0, "fade")}>
          {rows.map((row, i) => (
            <MarqueeRow key={i} items={row} reverse={i === 1} />
          ))}
        </div>
      ) : (
        <Container>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 [&_figure]:w-full">
            {items.map((t, i) => (
              <li key={t.id} {...reveal(i % 3)}>
                <Quote t={t} />
              </li>
            ))}
          </ul>
        </Container>
      )}
      <Container>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ founder
/** Split a quote into lines of a few words for the scroll-fill effect. */
function toLines(text: string, perLine = 5): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += perLine) lines.push(words.slice(i, i + perLine).join(" "));
  return lines;
}

/** Big quote lines that fill with white as you scroll, then the founder card. */
export function Founder({ s }: { s: HomeContent["founder"] }) {
  return (
    <section id="founder" className={`rm-dark rm-grid-bg ${PAD}`}>
      <Container className="flex flex-col items-center text-center">
        <p className="rm-label mb-6" {...reveal(0)}>
          {s.eyebrow}
        </p>
        <h2
          className="mb-10 text-[clamp(1.9rem,4.6vw,3rem)] font-bold leading-[1.12] tracking-[-0.04em] md:mb-14"
          {...reveal(1)}
        >
          {s.title} <span className="rm-text-grad">{s.accent}</span>
        </h2>
        {s.quote && (
          <blockquote className="flex max-w-6xl flex-col gap-3 md:gap-5">
            {toLines(`“${s.quote}”`).map((line, i) => (
              <span
                key={i}
                className="rm-fill-line text-[clamp(1.4rem,4.4vw,3.4rem)] font-bold leading-[1.12] tracking-[-0.04em] md:whitespace-nowrap"
              >
                {line}
              </span>
            ))}
          </blockquote>
        )}
        <span aria-hidden="true" className="mt-10 h-[3px] w-12 rounded-full bg-brand md:mt-14" />

        <div className="mt-14 grid w-full max-w-4xl items-center gap-10 text-left md:grid-cols-[260px_1fr]">
          {s.photo ? (
            <div className="rm-offset overflow-hidden [--offset-surface:#000] max-md:mx-auto max-md:w-[65%] max-md:max-w-[320px]" {...reveal(0)}>
              <Image
                src={s.photo.publicId}
                alt={`${s.name}, ${s.role}`}
                width={s.photo.width}
                height={s.photo.height}
                sizes="(max-width: 768px) 100vw, 260px"
                loading="lazy"
                className="relative aspect-square w-full rounded-[16px] object-cover"
              />
            </div>
          ) : (
            SHOW_PLACEHOLDERS && (
              <PlaceholderBox title="Founder photo" className="aspect-square max-md:mx-auto max-md:w-[65%] max-md:max-w-[320px]" />
            )
          )}
          <div className="flex flex-col items-start gap-4" {...reveal(1)}>
            <h3 className="text-[clamp(1.9rem,3.6vw,2.75rem)] font-bold leading-none tracking-[-0.03em]">{s.name}</h3>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">{s.role}</p>
            <p className="max-w-xl text-lg leading-relaxed text-fg-2">{s.bio}</p>
            {s.yearsExperience ? (
              // One baseline for the number and its label; the symbol is part of the number (same size,
              // not raised). The label wraps under the number when the line is too narrow.
              <p className="my-2 flex max-w-full flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="whitespace-nowrap text-[29px] font-bold leading-none tracking-[-0.02em] text-brand tabular-nums md:text-[32px]">
                  {s.yearsExperience}
                  {s.yearsSuffix}
                </span>
                <span className="min-w-0 text-[18px] leading-snug md:text-[20px]">{s.yearsLabel}</span>
              </p>
            ) : (
              SHOW_PLACEHOLDERS && <NotLiveTag>Years of experience: to confirm (brief says about 20)</NotLiveTag>
            )}
            <ButtonLink href={BOOK_CALL_HREF} track="book_call_click" size="lg">
              {s.ctaLabel} <ArrowRightIcon size={20} />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------- FAQ
/**
 * One two-column grid: every closed card has the same width and height
 * (fixed summary height, question clamped to two lines) and rows line up.
 * Cards align to the top of their row, so opening one grows only that card.
 * Approval is an admin-only state: unapproved answers show while building
 * (unmarked) and never on the live site.
 */
export function Faq({ s }: { s: HomeContent["faq"] }) {
  const items = s.items.filter((f) => SHOW_PLACEHOLDERS || f.approved);
  return (
    <section id="faq" className={PAD}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} center />
        {/* Full-width strips in the Careers FAQ style: square white cards with the red hover glow (.rm-svc). */}
        <ul className="mx-auto flex max-w-[900px] flex-col gap-3">
          {items.map((f, i) => (
            <li key={f.q} {...reveal(i % 4)}>
              <details className="rm-faq rm-svc p-0!">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-[17px] font-semibold sm:px-7">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="rm-faq-plus grid size-8 shrink-0 place-items-center bg-[color-mix(in_srgb,var(--brand)_10%,#fff)] text-xl leading-none text-brand"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-6 leading-relaxed text-fg-2 sm:px-7">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}
