import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon } from "../icons";
import { ButtonLink } from "../page-parts";
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

/** Eyebrow + two-tone heading (title, then an accent line in the red gradient). */
export function SectionHead({
  eyebrow,
  title,
  accent,
  intro,
  center,
  as: Tag = "h2",
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  intro?: string;
  center?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <div className={`mb-12 flex max-w-3xl flex-col gap-4 ${center ? "mx-auto items-center text-center" : ""}`}>
      <p className="rm-reveal text-xs font-bold uppercase tracking-[0.28em] text-brand">{eyebrow}</p>
      <Tag
        className="rm-reveal text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.04em]"
        style={{ "--i": 1 } as CSSProperties}
      >
        {title}
        {accent && (
          <>
            {" "}
            <span className="rm-text-grad block">{accent}</span>
          </>
        )}
      </Tag>
      {intro && (
        <p className="rm-reveal max-w-2xl text-lg text-fg-2" style={{ "--i": 2 } as CSSProperties}>
          {intro}
        </p>
      )}
    </div>
  );
}

/** The call to action that closes every home section (R13). */
export function SectionCta({ text, label, center = true }: { text: string; label: string; center?: boolean }) {
  return (
    <div className={`rm-reveal mt-14 flex flex-col gap-3 ${center ? "items-center text-center" : "items-start"}`}>
      <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
        {label} <ArrowRightIcon size={18} />
      </ButtonLink>
      {text && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-2">{text}</p>}
    </div>
  );
}
