import type { Metadata } from "next";
import { FoundationFrame } from "@/components/foundation-frame";

// PLACEHOLDER (Phase 0): shows the theme and button styles only. The real
// home page (R13) arrives in Phase 2. Not indexed.
export const metadata: Metadata = {
  title: "Foundation preview",
  robots: { index: false, follow: false },
};

export default function FoundationPreview() {
  return (
    <FoundationFrame>
      <section className="rm-hero-bg flex flex-1 flex-col items-center justify-center gap-8 px-4 py-20 text-center">
        <p className="rm-rise-in text-xs font-semibold uppercase tracking-[0.25em] text-brand">
          Phase 0 &middot; foundation preview
        </p>
        <h1
          className="rm-rise-in max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.04em]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          We make brands <span className="rm-text-grad">unstoppable</span>
        </h1>
        <p className="rm-rise-in max-w-xl text-fg-2" style={{ "--i": 2 } as React.CSSProperties}>
          Placeholder page. It shows the colours, font, buttons and card style the site will use, in light and dark
          mode.
        </p>
        <div className="rm-rise-in flex flex-wrap justify-center gap-3" style={{ "--i": 3 } as React.CSSProperties}>
          <button
            type="button"
            className="rm-press inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-brand-fg"
          >
            Book a Call
          </button>
          <button
            type="button"
            className="rm-press inline-flex h-12 items-center rounded-full bg-chip-on-bg px-6 font-semibold text-chip-on-fg"
          >
            Primary
          </button>
          <button
            type="button"
            className="rm-press inline-flex h-12 items-center rounded-full bg-chip px-6 font-semibold"
          >
            Secondary
          </button>
        </div>
        <div className="rm-offset rm-pop-in mt-6 w-full max-w-md p-8 text-left [--offset-surface:var(--bg-elev)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Card</p>
          <p className="mt-2 text-xl font-bold">Red offset block</p>
          <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium">
            Field
            <span className="rm-field flex h-12 items-center px-4">
              <input className="h-full w-full bg-transparent text-base outline-none" placeholder="Type here" />
            </span>
          </label>
        </div>
      </section>
    </FoundationFrame>
  );
}
