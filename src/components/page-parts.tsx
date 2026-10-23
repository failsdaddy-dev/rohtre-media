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
    <section className="rm-dark rm-hero-dark rm-beams overflow-hidden">
      <Container className="flex flex-col items-start gap-6 pb-24 pt-20 sm:pb-32 sm:pt-28">
        <p className="rm-hero-in">
          <span className="rm-pill">{eyebrow}</span>
        </p>
        <h1
          className="rm-hero-in max-w-4xl text-[clamp(2.4rem,6vw,4.75rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
          style={{ "--i": 1 } as CSSProperties}
        >
          {title}
        </h1>
        {intro && (
          <p
            className="rm-hero-in max-w-2xl text-lg leading-relaxed text-[#e6e6e6]"
            style={{ "--i": 2 } as CSSProperties}
          >
            {intro}
          </p>
        )}
        {children && (
          <div className="rm-hero-in flex flex-wrap gap-3 pt-2" style={{ "--i": 3 } as CSSProperties}>
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
  const tone = dark ? "rm-dark rm-grid-bg" : soft ? "border-y border-line" : "";
  return (
    <section id={id} className={`py-20 md:py-28 ${tone}`}>
      <Container>
        {(eyebrow || title || intro) && (
          <div data-reveal="" className="mb-12 flex max-w-3xl flex-col gap-4">
            {eyebrow && <p className="rm-label">{eyebrow}</p>}
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
    <div data-reveal="" className={`rm-card h-full p-7 ${className}`}>
      {children}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "brand",
  external,
  track,
  size = "md",
}: {
  href: string;
  children: ReactNode;
  variant?: "brand" | "dark" | "plain";
  external?: boolean;
  track?: "book_call_click" | "call_click";
  /** lg: the in-page Book a Call (56 px tall, 18 px text). */
  size?: "md" | "lg";
}) {
  const look = {
    brand: "bg-brand text-brand-fg",
    dark: "bg-chip-on-bg text-chip-on-fg",
    plain: "bg-chip hover:bg-chip-hover",
  }[variant];
  const scale = size === "lg" ? "h-14 gap-2.5 px-8 text-lg" : "h-12 gap-2 px-6";
  const cls = `rm-press inline-flex items-center rounded-full font-semibold ${scale} ${look}`;
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

/** Pointer-drift depth of a basic accent (only used when the home CTA card's drift is on; else 0). */
const drift = (travel: number) => ({ "--travel": travel }) as CSSProperties;

/** Decorative accents for the dark CTA panel: dots, squiggles and quarter circles. */
function PanelAccents() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden text-[#e50914] sm:block">
      <div
        className="rm-dots rm-px absolute left-[38%] top-0 h-20 w-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        style={drift(8)}
      />
      <svg viewBox="0 0 24 140" className="rm-float rm-px absolute bottom-10 left-10 h-28 w-5" style={drift(14)}>
        <circle cx="12" cy="6" r="4" className="rm-squiggle" />
        <path className="rm-squiggle text-white/50" d="M12 12l-6 8 12 8-12 8 12 8-12 8 12 8-12 8 12 8-12 8 12 8-6 6" />
        <circle cx="12" cy="134" r="4" className="rm-squiggle" />
      </svg>
      <svg
        viewBox="0 0 150 30"
        className="rm-float rm-px absolute right-14 top-10 w-36 [animation-delay:-3s]"
        style={drift(14)}
      >
        <circle cx="6" cy="18" r="4" className="rm-squiggle" />
        <path
          className="rm-squiggle text-white/50"
          d="M12 18l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6"
        />
        <circle cx="144" cy="10" r="4" className="rm-squiggle" />
      </svg>
      <span className="rm-px absolute bottom-24 right-24 size-24 rounded-bl-full bg-white/25" style={drift(8)} />
      <span className="absolute -bottom-px -right-px size-32 rounded-tl-full bg-[#e50914]/70" />
      <span className="rm-px absolute bottom-16 left-24 size-10 rounded-tl-full bg-white/20" style={drift(24)} />
    </div>
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
  size = "md",
  decor,
  id,
  action,
}: {
  eyebrow?: string;
  title?: string;
  accent?: string;
  text?: string;
  label?: string;
  whatsappHref?: string | null;
  size?: "md" | "lg";
  /** Extra decorative layer (the home card's animated objects); drawn under the text. */
  decor?: ReactNode;
  /** Anchor for links to this card (the home page's). */
  id?: string;
  /** Replaces the Book a Call / WhatsApp buttons (e.g. Careers' "Apply Now"). */
  action?: ReactNode;
}) {
  return (
    <section id={id} className="pb-20 pt-4 md:pb-28">
      <Container>
        <div
          data-reveal="up-lg"
          data-cta-card=""
          className="rm-dark relative overflow-hidden rounded-[2rem] bg-[#0d0d0d] px-6 py-16 text-center shadow-[0_40px_90px_-40px_rgba(0,0,0,0.6)] sm:px-12 md:py-20"
        >
          <PanelAccents />
          {decor}
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
            <p className="rm-label">{eyebrow}</p>
            <h2 className="text-[clamp(2.2rem,5vw,3.75rem)] font-bold leading-[1.04] tracking-[-0.045em]">
              {title} <span className="rm-text-grad">{accent}</span>
            </h2>
            {text && <p className="text-lg text-white/65">{text}</p>}
            <div className="flex flex-wrap justify-center gap-3 pt-3">
              {action ?? (
                <>
                  <span className="rounded-full shadow-[0_6px_28px_rgba(229,9,20,0.35)]">
                    <ButtonLink href={BOOK_CALL_HREF} track="book_call_click" size={size}>
                      {label} <ArrowRightIcon size={size === "lg" ? 20 : 18} />
                    </ButtonLink>
                  </span>
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener"
                      className={`rm-press inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 font-semibold text-white transition-colors hover:bg-white/10 ${size === "lg" ? "h-14 px-7 text-lg" : "h-12 px-6"}`}
                    >
                      <ChatIcon size={18} /> WhatsApp us
                    </a>
                  )}
                </>
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
