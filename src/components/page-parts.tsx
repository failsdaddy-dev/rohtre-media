import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon, ChatIcon } from "./icons";
import { BOOK_CALL_HREF } from "./site-header";

// Building blocks shared by the content pages (About, Careers, Contact, legal).

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="rm-dark rm-hero-dark rm-hero-bg rm-glow overflow-hidden">
      <Container className="flex flex-col items-start gap-5 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <p className="rm-pill rm-rise-in">{eyebrow}</p>
        <h1
          className="rm-rise-in max-w-4xl text-[clamp(2.4rem,6vw,4.75rem)] font-bold leading-[0.96] tracking-[-0.045em]"
          style={{ "--i": 1 } as CSSProperties}
        >
          {title}
        </h1>
        {intro && (
          <p className="rm-rise-in max-w-2xl text-lg text-fg-2" style={{ "--i": 2 } as CSSProperties}>
            {intro}
          </p>
        )}
        {children && (
          <div className="rm-rise-in flex flex-wrap gap-3 pt-2" style={{ "--i": 3 } as CSSProperties}>
            {children}
          </div>
        )}
      </Container>
    </section>
  );
}

export function Section({
  eyebrow,
  title,
  intro,
  children,
  soft,
  dark,
  id,
}: {
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  soft?: boolean;
  /** A dark band (alternating light and dark sections). */
  dark?: boolean;
  id?: string;
}) {
  const tone = dark ? "rm-dark rm-grid-bg" : soft ? "bg-bg-soft" : "";
  return (
    <section id={id} className={`py-20 sm:py-24 ${tone}`}>
      <Container>
        {(eyebrow || title || intro) && (
          <div className="rm-reveal mb-12 flex max-w-3xl flex-col gap-3">
            {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">{eyebrow}</p>}
            {title && (
              <h2 className="text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.03] tracking-[-0.04em]">{title}</h2>
            )}
            {intro && <p className="text-lg text-fg-2">{intro}</p>}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rm-offset on-hover h-full border border-line bg-bg-elev p-6 [--offset-surface:var(--bg-elev)] ${className}`}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "brand",
  external,
  track,
}: {
  href: string;
  children: ReactNode;
  variant?: "brand" | "dark" | "plain";
  external?: boolean;
  track?: "book_call_click" | "call_click";
}) {
  const look = {
    brand: "bg-brand text-brand-fg",
    dark: "bg-chip-on-bg text-chip-on-fg",
    plain: "bg-chip hover:bg-chip-hover",
  }[variant];
  const cls = `rm-press inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold ${look}`;
  return external ? (
    <a href={href} target="_blank" rel="noopener" className={cls} data-track={track}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} data-track={track}>
      {children}
    </Link>
  );
}

/** Decorative accents for the dark CTA panel: a red squiggle and a striped corner. */
function PanelAccents() {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 140 24" className="absolute right-8 top-8 hidden w-32 sm:block">
        <path
          className="rm-squiggle"
          d="M4 12c6-8 12-8 18 0s12 8 18 0 12-8 18 0 12 8 18 0 12-8 18 0 12 8 18 0 12-8 18 0"
        />
      </svg>
      <div
        aria-hidden="true"
        className="rm-stripes absolute -bottom-10 -left-10 hidden size-40 rotate-12 rounded-[28px] opacity-70 sm:block"
      />
      <div
        aria-hidden="true"
        className="absolute -right-6 bottom-10 hidden size-20 rounded-full border-[10px] border-[color-mix(in_srgb,var(--brand)_55%,transparent)] sm:block"
      />
    </>
  );
}

/** The dark closing call-to-action panel (home and content pages). */
export function CtaPanel({
  eyebrow = "Ready to unlock growth?",
  title = "Let’s talk",
  accent = "about your brand.",
  text = "Tell us about your brand and goals. We’ll get back to you with a plan.",
  label = "Book a Call",
  whatsappHref,
}: {
  eyebrow?: string;
  title?: string;
  accent?: string;
  text?: string;
  label?: string;
  whatsappHref?: string | null;
}) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="rm-dark rm-grid-bg rm-reveal relative overflow-hidden rounded-[32px] px-6 py-16 text-center sm:px-12 sm:py-20">
          <PanelAccents />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
            <p className="rm-pill">{eyebrow}</p>
            <h2 className="text-[clamp(2.2rem,5vw,3.75rem)] font-bold leading-[1] tracking-[-0.045em]">
              {title} <span className="rm-text-grad block pb-1">{accent}</span>
            </h2>
            {text && <p className="text-lg text-fg-2">{text}</p>}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
                {label} <ArrowRightIcon size={18} />
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
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Closing CTA for content pages, with the default wording. */
export function CtaBand({ whatsappHref }: { whatsappHref?: string | null }) {
  return <CtaPanel whatsappHref={whatsappHref} />;
}

/**
 * A fact we don't have yet. Shown loudly so it can't be missed; these pages
 * must not go live while any placeholder remains (rule 4, R19).
 */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark
      data-placeholder
      className="rounded-md border border-dashed border-brand bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] px-1.5 text-fg"
    >
      [TO CONFIRM: {children}]
    </mark>
  );
}
