import type { CSSProperties } from "react";

// Intro splash (Vault style): red stripes drop in, "ROHTRE MEDIA" rises,
// then the stripes fall away to reveal the page. Rendered on every page but
// shown only while <html data-intro> is set by motion-boot (first page of a
// visit, never on landing pages, admin or for reduced motion). Decorative,
// so hidden from screen readers; it never blocks clicks.

const COLUMNS = 10;
const NAME = "ROHTRE MEDIA";

export function Intro() {
  return (
    <div aria-hidden="true" className="rm-intro">
      <div className="rm-intro-backdrop" />
      {Array.from({ length: COLUMNS }, (_, i) => (
        <div key={i} className="rm-intro-col" style={{ "--i": i } as CSSProperties} />
      ))}
      <div className="rm-intro-text">
        <p className="text-center text-[clamp(2.4rem,9vw,7rem)] font-bold leading-none tracking-[-0.045em]">
          {NAME.split("").map((ch, i) => (
            <span key={i} className="rm-intro-letter" style={{ "--i": i } as CSSProperties}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
