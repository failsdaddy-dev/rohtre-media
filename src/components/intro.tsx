import type { CSSProperties } from "react";

// Intro splash (Vault style): red stripes drop in, a play button pops up and is
// "pressed", the logo's R grows out of it, the letters of ROHTRE and MEDIA come
// in one by one, then the stripes fall away to reveal the page. Rendered on
// every page but shown only while <html data-intro> is set by motion-boot
// (first page of a visit, never on landing pages, admin or for reduced motion).
// It never blocks clicks. Every logo part is the one header logo file, cut with
// CSS (design.css), so nothing extra loads unless the intro plays.

const COLUMNS = 10;

// Where each letter starts and ends, as % of the logo's width (the gaps between letters).
const ROHTRE = [29.84, 43.45, 57.35, 68.85, 79.77, 90.76, 100];
const MEDIA = [29.84, 46.07, 55.97, 67.69, 71.76, 100];

function Letters({ cuts }: { cuts: number[] }) {
  return cuts.slice(1).map((to, i) => (
    <span
      key={to}
      className="rm-intro-letter"
      style={{ "--from": `${cuts[i]}%`, "--to": `${to}%`, "--i": i } as CSSProperties}
    />
  ));
}

export function Intro() {
  return (
    <div className="rm-intro">
      <div aria-hidden="true" className="rm-intro-backdrop" />
      {Array.from({ length: COLUMNS }, (_, i) => (
        <div aria-hidden="true" key={i} className="rm-intro-col" style={{ "--i": i } as CSSProperties} />
      ))}
      <div className="rm-intro-text">
        <div role="img" aria-label="RohTre Media" className="rm-intro-logo">
          <span className="rm-intro-ring" />
          <span className="rm-intro-ring" />
          <span className="rm-intro-mark" />
          <span className="rm-intro-play" />
          <span className="rm-intro-row rm-intro-row-top">
            <Letters cuts={ROHTRE} />
          </span>
          <span className="rm-intro-row rm-intro-row-bottom">
            <Letters cuts={MEDIA} />
          </span>
          <span className="rm-intro-sheen" />
        </div>
      </div>
    </div>
  );
}
