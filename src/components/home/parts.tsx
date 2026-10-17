import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon } from "../icons";
import { ButtonLink } from "../page-parts";
import { BOOK_CALL_HREF } from "../site-header";

/** Props that make an element fade up into view; `i` staggers a group. */
export function reveal(i = 0, kind: "up" | "up-lg" | "fade" = "up") {
  return {
    "data-reveal": kind === "up" ? "" : kind,
    style: { "--d": `${(i * 0.08).toFixed(2)}s` } as CSSProperties,
  };
}

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
      className={`flex flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-dashed border-brand p-5 text-center [background:repeating-linear-gradient(135deg,color-mix(in_srgb,var(--brand)_8%,transparent)_0_14px,transparent_14px_28px)] ${className}`}
    >
      <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-fg">
        Placeholder · not shown on the live site
      </span>
      <span className="font-semibold">{title}</span>
      {children && <span className="max-w-md text-sm opacity-75">{children}</span>}
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

/** Section label + two-tone heading (title, then an accent line in the red gradient). */
export function SectionHead({
  eyebrow,
  title,
  accent,
  intro,
  center,
  className = "",
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  intro?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`mb-12 flex max-w-3xl flex-col gap-5 md:mb-16 ${center ? "mx-auto items-center text-center" : ""} ${className}`}
    >
      <p className="rm-label" {...reveal(0)}>
        {eyebrow}
      </p>
      <h2 className="text-[clamp(2.1rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.045em]" {...reveal(1)}>
        {title}
        {accent && (
          <>
            {" "}
            <span className="rm-text-grad block pb-1">{accent}</span>
          </>
        )}
      </h2>
      {intro && (
        <p className="max-w-2xl text-lg leading-relaxed text-fg-2" {...reveal(2)}>
          {intro}
        </p>
      )}
    </div>
  );
}

/** The call to action that closes every home section (R13). */
export function SectionCta({
  text,
  label,
  center = true,
  variant = "brand",
}: {
  text: string;
  label: string;
  center?: boolean;
  variant?: "brand" | "dark";
}) {
  return (
    <div className={`mt-14 flex flex-col gap-4 ${center ? "items-center text-center" : "items-start"}`} {...reveal(0)}>
      <ButtonLink href={BOOK_CALL_HREF} track="book_call_click" variant={variant}>
        {label} <ArrowRightIcon size={18} />
      </ButtonLink>
      {text && <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-fg-2">{text}</p>}
    </div>
  );
}
