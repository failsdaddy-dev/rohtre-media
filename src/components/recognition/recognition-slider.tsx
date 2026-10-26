"use client";

import { Children, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { keyStep, wrapIndex } from "@/lib/count-up";

// The Recognition hero slider: one full-width slide at a time on a CSS
// scroll-snap track (swipe on touch, trackpad and mouse wheel come for
// free). Left / right arrows, dots and a "01 / 09" counter; ←/→ when the
// slider has focus. No autoplay. Slides are server-rendered children; this
// only moves the track. Reduced motion: jumps instead of gliding.

export function RecognitionSlider({ children, label }: { children: ReactNode; label: string }) {
  const slides = Children.toArray(children);
  const n = slides.length;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Follow the track (swipes and scrolls), once per frame.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const w = el.clientWidth || 1;
      setIndex(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / w))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, [n]);

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el || n === 0) return;
      const next = wrapIndex(i, n);
      const smooth = document.documentElement.hasAttribute("data-motion");
      el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
      setIndex(next);
    },
    [n],
  );

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = keyStep(e.key);
    if (!step) return;
    e.preventDefault();
    go(index + step);
  };

  const pad = (v: number) => String(v).padStart(2, "0");

  return (
    <section aria-roledescription="carousel" aria-label={label} className="rm-rec-slider relative">
      <div
        ref={track}
        tabIndex={0}
        onKeyDown={onKey}
        aria-label={`${label}: use the left and right arrow keys to change slide`}
        className="rm-rec-track"
        data-lenis-prevent=""
      >
        {slides.map((s, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
            aria-hidden={i === index ? undefined : true}
            inert={i === index ? undefined : true}
            className="rm-rec-slide"
          >
            {s}
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="rm-rec-controls">
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="rm-rec-arrow">
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <p className="rm-rec-count" aria-live="polite">
            <span className="text-white">{pad(index + 1)}</span> / {pad(n)}
          </p>
          <ul className="rm-rec-dots">
            {slides.map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className="rm-rec-dot"
                >
                  <span aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="rm-rec-arrow">
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
