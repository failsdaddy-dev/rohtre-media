import Image from "next/image";
import type { HomeContent } from "@/content/home-schema";
import {
  isLiveBadge,
  isLiveProof,
  SHOW_PLACEHOLDERS,
  type Badge,
  type Result,
  type Testimonial,
} from "@/lib/home-data";
import { ArrowRightIcon } from "../icons";
import { ButtonLink, Card, Container } from "../page-parts";
import { BOOK_CALL_HREF } from "../site-header";
import { NotLiveTag, PlaceholderBox, SectionHead } from "./parts";

// Home sections (R13). Each is a plain server component fed by the content
// schema (src/content/home-schema.ts) and the proof tables. Anything not
// approved shows only while building, marked; the live site leaves it out.

const section = "pb-12 pt-16 sm:pt-20";

// ------------------------------------------------------------------- badges
/** Big, bold trust-badge strip (R11). A badge goes live only when switched on and it has a proof link. */
export function BadgeStrip({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;
  return (
    <section aria-label="Partners and recognition" className="border-b border-line bg-bg-soft">
      <Container className="py-10">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((b) => {
            const live = isLiveBadge(b);
            const inner = (
              <>
                {b.image_public_id ? (
                  <Image
                    src={b.image_public_id}
                    alt=""
                    width={200}
                    height={80}
                    sizes="160px"
                    loading="lazy"
                    className="rm-white-art h-12 w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="text-3xl font-bold leading-none tracking-[-0.03em] text-brand">{b.label}</span>
                )}
                <span className="text-center">
                  {b.image_public_id && <span className="block text-sm font-bold">{b.label}</span>}
                  {b.sublabel && <span className="block text-xs text-fg-2">{b.sublabel}</span>}
                </span>
                {!live && <NotLiveTag>Needs proof link</NotLiveTag>}
              </>
            );
            const tile = `flex h-full min-h-36 flex-col items-center justify-center gap-3 rounded-[18px] border p-4 ${
              live ? "border-line bg-bg-elev" : "border-dashed border-brand"
            }`;
            return (
              <li key={b.id}>
                {live ? (
                  <a
                    href={b.proof_url!}
                    target="_blank"
                    rel="noopener"
                    aria-label={`${b.label}${b.sublabel ? `, ${b.sublabel}` : ""} (opens proof)`}
                    className={`${tile} transition-colors hover:border-fg`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div className={tile} title={b.notes ?? undefined}>
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

// ----------------------------------------------------------------- services
export function Services({ s }: { s: HomeContent["services"] }) {
  return (
    <section id="services" className={section}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} intro={s.intro} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((item, i) => (
            <li key={item.title}>
              <Card>
                <span className="text-sm font-bold text-brand">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-xl font-bold tracking-[-0.02em]">{item.title}</h3>
                <p className="mt-2 text-fg-2">{item.text}</p>
                {item.href && (
                  <a href={item.href} className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand">
                    Learn more <ArrowRightIcon size={16} />
                  </a>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ results
/** Proof blocks (R19): metric and brand on the left, screenshot on the right. */
export function Results({ s, results }: { s: HomeContent["results"]; results: Result[] }) {
  if (results.length === 0) return null;
  return (
    <section className={`${section} bg-bg-soft`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} intro={s.intro} />
        <ul className="grid gap-6 lg:grid-cols-3">
          {results.map((r) =>
            !isLiveProof(r) && r.is_placeholder ? (
              <li key={r.id}>
                <PlaceholderBox title="Result block" className="h-full min-h-72">
                  Brand name, logo, one real metric and a dashboard screenshot. {r.notes}
                </PlaceholderBox>
              </li>
            ) : (
              <li key={r.id}>
                <div className="grid h-full grid-cols-[1fr_auto] gap-4 rounded-[18px] border border-line bg-bg-elev p-6">
                  <div className="flex flex-col gap-2">
                    {!isLiveProof(r) && <NotLiveTag>Not approved yet</NotLiveTag>}
                    <p className="text-4xl font-bold tracking-[-0.03em] text-brand">{r.metric_value}</p>
                    <p className="font-semibold">{r.metric_label}</p>
                    <p className="text-sm text-fg-2">{r.brand_name}</p>
                    {r.summary && <p className="mt-2 text-sm text-fg-2">{r.summary}</p>}
                  </div>
                  {r.image_public_id && (
                    <Image
                      src={r.image_public_id}
                      alt={r.image_alt ?? ""}
                      width={240}
                      height={480}
                      sizes="140px"
                      loading="lazy"
                      className="h-56 w-auto rounded-xl object-cover"
                    />
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ process
export function Process({ s }: { s: HomeContent["process"] }) {
  return (
    <section className={section}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {s.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-[18px] border border-line bg-bg-elev p-6">
              <span className="grid size-10 place-items-center rounded-full bg-brand font-bold text-brand-fg">
                {i + 1}
              </span>
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="text-fg-2">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------- testimonials
export function Testimonials({ s, items }: { s: HomeContent["testimonials"]; items: Testimonial[] }) {
  if (items.length === 0) return null;
  const list =
    s.variant === "slider"
      ? "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 [&>li]:w-[85%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[420px]"
      : "grid gap-5 md:grid-cols-2 lg:grid-cols-3";
  return (
    <section className={`${section} bg-bg-soft`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} />
        <ul className={list}>
          {items.map((t) => (
            <li key={t.id}>
              <figure
                className={`flex h-full flex-col gap-5 rounded-[18px] border bg-bg-elev p-6 ${
                  isLiveProof(t) ? "border-line" : "border-dashed border-brand"
                }`}
              >
                {!isLiveProof(t) && (
                  <NotLiveTag>{t.is_placeholder ? "Placeholder" : "Needs client’s permission"}</NotLiveTag>
                )}
                <span aria-hidden="true" className="text-5xl font-bold leading-[0.5] text-brand">
                  “
                </span>
                <blockquote className="flex-1 text-[17px] leading-relaxed">{t.quote}</blockquote>
                <figcaption className="flex items-center gap-3">
                  {t.photo_public_id && (
                    <Image
                      src={t.photo_public_id}
                      alt=""
                      width={96}
                      height={96}
                      sizes="48px"
                      loading="lazy"
                      className="size-12 rounded-full object-cover"
                    />
                  )}
                  <span>
                    <span className="block font-bold">{t.person_name}</span>
                    {(t.person_role || t.company) && (
                      <span className="block text-sm text-fg-2">
                        {[t.person_role, t.company].filter(Boolean).join(", ")}
                      </span>
                    )}
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

// ------------------------------------------------------------------ founder
export function Founder({ s }: { s: HomeContent["founder"] }) {
  return (
    <section className={section}>
      <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,360px)_1fr]">
        {s.photo ? (
          <div className="rm-offset overflow-hidden [--offset-surface:var(--bg-elev)]">
            <Image
              src={s.photo.publicId}
              alt={`${s.name}, ${s.role}`}
              width={s.photo.width}
              height={s.photo.height}
              sizes="(max-width: 768px) 100vw, 360px"
              loading="lazy"
              className="relative aspect-square w-full rounded-[16px] object-cover"
            />
          </div>
        ) : (
          SHOW_PLACEHOLDERS && <PlaceholderBox title="Founder photo" className="aspect-square" />
        )}
        <div className="flex flex-col items-start gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">{s.eyebrow}</p>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-[-0.03em]">{s.name}</h2>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fg-2">{s.role}</p>
          <p className="max-w-xl text-lg text-fg-2">{s.bio}</p>
          {s.yearsExperience ? (
            <p className="text-lg">
              <span className="text-3xl font-bold text-brand">{s.yearsExperience}+</span> years as a digital consultant
            </p>
          ) : (
            SHOW_PLACEHOLDERS && <NotLiveTag>Years of experience: to confirm (brief says about 20)</NotLiveTag>
          )}
          <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
            {s.ctaLabel} <ArrowRightIcon size={18} />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------- FAQ
export function Faq({ s }: { s: HomeContent["faq"] }) {
  const items = s.items.filter((f) => SHOW_PLACEHOLDERS || f.status === "ready");
  if (items.length === 0) return null;
  return (
    <section className={`${section} bg-bg-soft`}>
      <Container>
        <SectionHead eyebrow={s.eyebrow} title={s.title} />
        <div className="flex max-w-3xl flex-col gap-3">
          {items.map((f) => (
            <details key={f.q} className="group rounded-[16px] border border-line bg-bg-elev px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                <span className="flex flex-wrap items-center gap-2">
                  {f.q}
                  {f.status === "draft" && <NotLiveTag>Draft · needs approval</NotLiveTag>}
                </span>
                <span aria-hidden="true" className="text-xl text-brand transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-fg-2">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------- final CTA
export function FinalCta({ s }: { s: HomeContent["finalCta"] }) {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="rm-offset flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-14 [--offset-surface:var(--bg-elev)]">
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">{s.eyebrow}</p>
            <h2 className="mt-2 text-[clamp(2rem,5vw,3.75rem)] font-bold leading-none tracking-[-0.04em]">{s.title}</h2>
            {s.text && <p className="mt-4 text-lg text-fg-2">{s.text}</p>}
          </div>
          <div className="relative">
            <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
              {s.label} <ArrowRightIcon size={18} />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
