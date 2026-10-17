import Image from "next/image";
import type { CSSProperties } from "react";
import type { HomeContent } from "@/content/home-schema";
import {
  isLiveBadge,
  isLiveProof,
  SHOW_PLACEHOLDERS,
  type Badge,
  type Result,
  type Testimonial,
} from "@/lib/home-data";
import { ArrowRightIcon, ServiceIcon } from "../icons";
import { ButtonLink, Container } from "../page-parts";
import { BOOK_CALL_HREF } from "../site-header";
import { NotLiveTag, PlaceholderBox, SectionCta, SectionHead } from "./parts";

// Home sections (R13), alternating light and dark bands. Each is a plain
// server component fed by the content schema (src/content/home-schema.ts)
// and the proof tables. Anything not approved shows only while building,
// marked; the live site leaves it out. Every section ends with a CTA.

const PAD = "py-20 sm:py-28";
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// ------------------------------------------------------------------- badges
/** Trust-badge bar (R11): one bordered bar on the red offset block. */
export function BadgeBar({ s, badges }: { s: HomeContent["badges"]; badges: Badge[] }) {
  return (
    <section aria-label="Partners and recognition" className={PAD}>
      <Container>
        <p className="rm-reveal mb-10 text-center text-xs font-bold uppercase tracking-[0.28em] text-brand">
          {s.eyebrow}
        </p>
        <div className="rm-offset rm-reveal [--offset-surface:var(--bg-elev)]" style={stagger(1)}>
          <ul className="relative grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-line sm:grid-cols-3 lg:grid-cols-6">
            {badges.map((b) => (
              <li
                key={b.id}
                className={`flex min-h-44 flex-col items-center justify-center gap-3 bg-bg-elev px-4 py-7 text-center ${
                  isLiveBadge(b) ? "" : "outline-2 -outline-offset-8 outline-dashed outline-brand"
                }`}
                title={isLiveBadge(b) ? undefined : (b.notes ?? undefined)}
              >
                {b.image_public_id ? (
                  <Image
                    src={b.image_public_id}
                    alt=""
                    width={200}
                    height={80}
                    sizes="160px"
                    loading="lazy"
                    className="rm-white-art h-11 w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[2.4rem] font-bold leading-none tracking-[-0.04em] text-brand">{b.label}</span>
                )}
                <span>
                  {b.image_public_id && (
                    <span className="block text-[13px] font-bold uppercase tracking-[0.12em]">{b.label}</span>
                  )}
                  {b.sublabel && <span className="mt-0.5 block text-xs text-fg-2">{b.sublabel}</span>}
                </span>
                {!isLiveBadge(b) && <NotLiveTag>Switched off</NotLiveTag>}
              </li>
            ))}
          </ul>
        </div>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}

// ----------------------------------------------------------------- services
export function Services({ s }: { s: HomeContent["services"] }) {
  return (
    <section id="services" className={`rm-dark rm-grid-bg ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((item, i) => (
            <li key={item.title} className="rm-reveal" style={stagger(i % 3)}>
              <div className="group flex h-full flex-col gap-4 rounded-[20px] border border-line bg-bg-elev p-7 transition-[border-color,transform] duration-[var(--dur-3)] hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--brand)_60%,var(--line))]">
                <span className="grid size-12 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-brand transition-transform duration-[var(--dur-3)] group-hover:scale-110">
                  <ServiceIcon name={item.icon} size={22} />
                </span>
                <h3 className="text-xl font-bold tracking-[-0.02em]">{item.title}</h3>
                <p className="flex-1 text-fg-2">{item.text}</p>
                {item.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label="Includes">
                    {item.tags.map((t) => (
                      <li key={t} className="rm-tag">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                {item.href && (
                  <a href={item.href} className="inline-flex items-center gap-1.5 font-semibold text-brand">
                    Learn more <ArrowRightIcon size={16} />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ results
/** Proof blocks (R19) as cards that stack while scrolling. */
const TONES = [
  "border border-line bg-bg-elev",
  "bg-brand text-brand-fg [--fg-2:rgba(255,255,255,0.82)]",
  "rm-dark border border-line",
];

export function Results({ s, results }: { s: HomeContent["results"]; results: Result[] }) {
  return (
    <section className={PAD}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} />
        <ol className="rm-stack flex flex-col gap-10">
          {results.map((r, i) => (
            <li key={r.id} style={stagger(i)}>
              {r.is_placeholder ? (
                <PlaceholderBox title={`Result ${i + 1}`} className="min-h-80 bg-bg">
                  Brand name and logo, one real metric, a short summary and a dashboard screenshot on the right.
                </PlaceholderBox>
              ) : (
                <article
                  className={`grid gap-8 rounded-[28px] p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] sm:p-10 md:grid-cols-[1.1fr_0.9fr] ${TONES[i % 3]}`}
                >
                  <div className="flex flex-col gap-4">
                    {!isLiveProof(r) && <NotLiveTag>Not approved yet</NotLiveTag>}
                    <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-80">{r.brand_name}</p>
                    <p className="text-[clamp(3rem,7vw,5rem)] font-bold leading-none tracking-[-0.05em]">
                      {r.metric_value}
                    </p>
                    <p className="text-xl font-semibold">{r.metric_label}</p>
                    {r.summary && <p className="max-w-md text-fg-2">{r.summary}</p>}
                  </div>
                  {r.image_public_id && (
                    <Image
                      src={r.image_public_id}
                      alt={r.image_alt ?? ""}
                      width={720}
                      height={540}
                      sizes="(max-width: 768px) 100vw, 480px"
                      loading="lazy"
                      className="h-full max-h-80 w-full rounded-[18px] object-cover"
                    />
                  )}
                </article>
              )}
            </li>
          ))}
        </ol>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ process
/** A sticky heading on the left, a vertical timeline on the right. */
export function Process({ s }: { s: HomeContent["process"] }) {
  return (
    <section className={`rm-dark rm-grid-bg ${PAD}`}>
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+48px)] lg:self-start">
          <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} intro={s.intro} />
          <SectionCta {...s.cta} center={false} />
        </div>
        <ol className="flex flex-col">
          {s.steps.map((step, i) => (
            <li key={step.title} className="rm-reveal relative flex gap-6 pb-12 last:pb-0" style={stagger(i)}>
              {i < s.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-7 top-16 border-l-2 border-dashed border-line"
                />
              )}
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-line bg-bg-elev text-xl font-bold text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-2 pt-1">
                <span className="w-fit rounded-md bg-[color-mix(in_srgb,var(--brand)_16%,transparent)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                  Step {i + 1}
                </span>
                <h3 className="text-2xl font-bold tracking-[-0.02em]">{step.title}</h3>
                <p className="max-w-md text-fg-2">{step.text}</p>
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
      className={`flex h-full w-[min(360px,82vw)] shrink-0 flex-col gap-5 rounded-[22px] border bg-bg-elev p-7 ${
        isLiveProof(t) ? "border-line" : "border-dashed border-brand"
      }`}
    >
      {!isLiveProof(t) && <NotLiveTag>{t.is_placeholder ? "Placeholder" : "Needs client’s permission"}</NotLiveTag>}
      <span aria-hidden="true" className="text-5xl font-bold leading-[0.5] text-brand">
        “
      </span>
      <blockquote className="flex-1 text-[16px] leading-relaxed">{t.quote}</blockquote>
      <figcaption className="flex items-center gap-3 border-t border-line pt-4">
        {t.photo_public_id && (
          <Image
            src={t.photo_public_id}
            alt=""
            width={96}
            height={96}
            sizes="44px"
            loading="lazy"
            className="size-11 rounded-full object-cover"
          />
        )}
        <span>
          <span className="block font-bold">{t.person_name}</span>
          {(t.person_role || t.company) && (
            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-fg-2">
              {[t.person_role, t.company].filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

function MarqueeRow({ items, reverse }: { items: Testimonial[]; reverse?: boolean }) {
  return (
    <div className="rm-marquee py-2" data-reverse={reverse ? "" : undefined}>
      <div className="rm-marquee-track" style={{ "--marquee-duration": `${items.length * 14}s` } as CSSProperties}>
        <ul className="flex gap-5">
          {items.map((t) => (
            <li key={t.id}>
              <Quote t={t} />
            </li>
          ))}
        </ul>
        {/* Second copy so the loop is seamless; hidden from screen readers and keyboards. */}
        <ul className="flex gap-5" aria-hidden="true" inert>
          {items.map((t) => (
            <li key={t.id}>
              <Quote t={t} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Testimonials({ s, items }: { s: HomeContent["testimonials"]; items: Testimonial[] }) {
  const rows = items.length >= 6 ? [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)] : [items];
  return (
    <section className={`bg-bg-soft ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} center />
      </Container>
      {s.variant === "slider" ? (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <MarqueeRow key={i} items={row} reverse={i === 1} />
          ))}
        </div>
      ) : (
        <Container>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 [&_figure]:w-full">
            {items.map((t, i) => (
              <li key={t.id} className="rm-reveal" style={stagger(i % 3)}>
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
/** The founder's quote lights up word by word, then the founder card. */
function WordReveal({ text }: { text: string }) {
  const words = text.split(/\s+/);
  const start = 18;
  const span = 42; // % of the quote's trip through the viewport
  return (
    <p className="rm-words text-[clamp(1.9rem,4.4vw,3.6rem)] font-bold leading-[1.12] tracking-[-0.035em]">
      {words.map((w, i) => {
        const a = start + (i / words.length) * span;
        const b = start + ((i + 1) / words.length) * span;
        return (
          <span
            key={i}
            className="rm-word"
            style={{ animationRange: `cover ${a.toFixed(1)}% cover ${b.toFixed(1)}%` } as CSSProperties}
          >
            {w}{" "}
          </span>
        );
      })}
    </p>
  );
}

export function Founder({ s }: { s: HomeContent["founder"] }) {
  return (
    <section className={`rm-dark rm-grid-bg ${PAD}`}>
      <Container>
        <p className="rm-reveal mb-8 text-xs font-bold uppercase tracking-[0.28em] text-brand">{s.eyebrow}</p>
        {s.quote && (
          <blockquote className="mb-16 max-w-5xl">
            <WordReveal text={`“${s.quote}”`} />
          </blockquote>
        )}
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,320px)_1fr]">
          {s.photo ? (
            <div className="rm-offset rm-reveal overflow-hidden [--offset-surface:var(--bg-elev)]">
              <Image
                src={s.photo.publicId}
                alt={`${s.name}, ${s.role}`}
                width={s.photo.width}
                height={s.photo.height}
                sizes="(max-width: 768px) 100vw, 320px"
                loading="lazy"
                className="relative aspect-square w-full rounded-[16px] object-cover"
              />
            </div>
          ) : (
            SHOW_PLACEHOLDERS && <PlaceholderBox title="Founder photo" className="aspect-square" />
          )}
          <div className="rm-reveal flex flex-col items-start gap-4" style={stagger(1)}>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-[-0.03em]">{s.name}</h2>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">{s.role}</p>
            <p className="max-w-xl text-lg text-fg-2">{s.bio}</p>
            {s.yearsExperience ? (
              <p className="text-lg">
                <span className="text-4xl font-bold text-brand">{s.yearsExperience}+</span> years as a digital
                consultant
              </p>
            ) : (
              SHOW_PLACEHOLDERS && <NotLiveTag>Years of experience: to confirm (brief says about 20)</NotLiveTag>
            )}
            <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
              {s.ctaLabel} <ArrowRightIcon size={18} />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------- FAQ
export function Faq({ s }: { s: HomeContent["faq"] }) {
  const items = s.items.filter((f) => SHOW_PLACEHOLDERS || f.status === "ready");
  const columns = [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)];
  return (
    <section className={`bg-bg-soft ${PAD}`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} accent={s.accent} center />
        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          {columns.map((col, c) => (
            <div key={c} className="flex flex-col gap-4">
              {col.map((f, i) => (
                <details
                  key={f.q}
                  className="rm-reveal group rounded-[20px] border border-line bg-bg-elev px-6 py-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)]"
                  style={stagger(i)}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    <span className="flex flex-wrap items-center gap-2">
                      {f.q}
                      {f.status === "draft" && <NotLiveTag>Draft · needs approval</NotLiveTag>}
                    </span>
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-chip text-lg text-brand transition-transform duration-[var(--dur-3)] group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-fg-2">{f.a}</p>
                </details>
              ))}
            </div>
          ))}
        </div>
        <SectionCta {...s.cta} />
      </Container>
    </section>
  );
}
