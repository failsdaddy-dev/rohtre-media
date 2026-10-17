import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon } from "./icons";
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
    <section className="rm-hero-bg overflow-hidden border-b border-line">
      <Container className="flex flex-col items-start gap-5 py-16 sm:py-24">
        <p className="rm-rise-in text-xs font-semibold uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
        <h1
          className="rm-rise-in max-w-4xl text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.04em]"
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
  id,
}: {
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  soft?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`py-16 sm:py-20 ${soft ? "bg-bg-soft" : ""}`}>
      <Container>
        {(eyebrow || title || intro) && (
          <div className="mb-10 flex max-w-3xl flex-col gap-3">
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">{eyebrow}</p>}
            {title && (
              <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.03em]">
                {title}
              </h2>
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

/** The closing call to action used at the end of content pages (wording from the live site). */
export function CtaBand() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="rm-offset flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12 [--offset-surface:var(--bg-elev)]">
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Ready to unlock growth?</p>
            <p className="mt-2 text-[clamp(1.75rem,4vw,3rem)] font-bold leading-none tracking-[-0.03em]">Let’s talk!</p>
          </div>
          <div className="relative">
            <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
              Book a Call <ArrowRightIcon size={18} />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
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
