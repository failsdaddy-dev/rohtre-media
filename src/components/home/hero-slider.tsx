"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// Two-slide hero slider (R14) with no library: CSS scroll-snap does the
// sliding and swiping; this adds dots, arrows and a gentle autoplay. About
// 1 KB, so a slider package isn't worth its weight for two slides.
// Autoplay pauses on hover, on keyboard focus, when the tab is hidden, and
// never runs for people who prefer reduced motion.

const AUTOPLAY_MS = 6000;

export function HeroSlider({ children, labels }: { children: ReactNode; labels: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = Children.count(children);

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const n = el.children.length;
    const next = ((i % n) + n) % n;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }, []);

  // Which slide is showing (also after a swipe).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") go(active + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [active, paused, count, go]);

  const arrow =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] text-fg shadow backdrop-blur hover:bg-bg md:grid";

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
        {Children.map(children, (child, i) => (
          <div
            className="w-full shrink-0 snap-center"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== active}
            inert={i !== active}
          >
            {child}
          </div>
        ))}
      </div>
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(active - 1)}
            className={`${arrow} left-4`}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" aria-label="Next slide" onClick={() => go(active + 1)} className={`${arrow} right-4`}>
            <span aria-hidden="true">›</span>
          </button>
          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
            {labels.map((label, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show slide ${i + 1}: ${label}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => go(i)}
                className={`h-2.5 rounded-full transition-all duration-[var(--dur-2)] ${
                  i === active ? "w-8 bg-brand" : "w-2.5 bg-[color-mix(in_srgb,var(--fg)_45%,transparent)]"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
