import type { ReactNode } from "react";
import { ArrowRightIcon } from "../icons";
import { ButtonLink, Container } from "../page-parts";
import { BOOK_CALL_HREF } from "../site-header";

/**
 * A slot waiting for real content. Only ever rendered while building
 * (SHOW_PLACEHOLDERS); the live site leaves it out (R19). Striped and labelled
 * so nobody mistakes it for finished work.
 */
export function PlaceholderBox({
  title,
  children,
  className = "",
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-placeholder
      className={`flex flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-dashed border-brand p-5 text-center [background:repeating-linear-gradient(135deg,color-mix(in_srgb,var(--brand)_7%,transparent)_0_14px,transparent_14px_28px)] ${className}`}
    >
      <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-fg">
        Placeholder · not shown on the live site
      </span>
      <span className="font-semibold">{title}</span>
      {children && <span className="max-w-md text-sm text-fg-2">{children}</span>}
    </div>
  );
}

/** Small "not live" tag for an item that exists but isn't approved yet. */
export function NotLiveTag({ children }: { children: ReactNode }) {
  return (
    <span
      data-placeholder
      className="inline-flex w-fit items-center rounded-full border border-dashed border-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand"
    >
      {children}
    </span>
  );
}

/** The Book a Call strip after every home section (R13). */
export function CtaStrip({ text, label }: { text: string; label: string }) {
  return (
    <div className="pb-16 sm:pb-20">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 border-y border-line py-5 sm:flex-row sm:items-center">
          <p className="text-lg font-semibold tracking-[-0.01em]">{text}</p>
          <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
            {label} <ArrowRightIcon size={18} />
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}

export function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="mb-10 flex max-w-3xl flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
      <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.03em]">{title}</h2>
      {intro && <p className="text-lg text-fg-2">{intro}</p>}
    </div>
  );
}
