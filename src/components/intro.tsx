import type { CSSProperties } from "react";

// Intro splash (Vault style): red stripes drop in, the white logo builds up
// (the R bounces in, then ROHTRE, then MEDIA), then the stripes fall away to
// reveal the page. Rendered on every page but shown only while <html data-intro>
// is set by motion-boot (first page of a visit, never on landing pages, admin
// or for reduced motion). It never blocks clicks. The three logo parts are one
// file, cut with CSS (design.css), so nothing loads unless the intro plays.

const COLUMNS = 10;

export function Intro() {
  return (
    <div className="rm-intro">
      <div aria-hidden="true" className="rm-intro-backdrop" />
      {Array.from({ length: COLUMNS }, (_, i) => (
        <div aria-hidden="true" key={i} className="rm-intro-col" style={{ "--i": i } as CSSProperties} />
      ))}
      <div className="rm-intro-text">
        <div role="img" aria-label="RohTre Media" className="rm-intro-logo">
          <span className="rm-intro-mark" />
          <span className="rm-intro-word rm-intro-word-top" />
          <span className="rm-intro-word rm-intro-word-bottom" />
        </div>
      </div>
    </div>
  );
}
