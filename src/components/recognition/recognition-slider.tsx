"use client";

import { Children, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { keyStep, wrapIndex } from "@/lib/count-up";

// The Recognition hero slider: one full-width slide at a time on a CSS
// scroll-snap track (swipe on touch, trackpad and mouse wheel come for
// free). Left / right arrows, dots and a "01 / 09" counter; ←/→ when the
// slider has focus. Autoplay: every AUTOPLAY_MS the next slide glides in from
// the right over GLIDE_MS (eased), looping, always (it only waits a moment
// after a swipe and while the tab is hidden). The new slide's text fades in
// moving left to right (CSS, [data-active]). Slides are server-rendered
// children; this only moves the track. Reduced motion: slides change
// without the glide.

/** Time on each slide before the next one glides in. */
const AUTOPLAY_MS = 3000;
/** How long the automatic glide to the next slide takes. */
const GLIDE_MS = 1000;
/** Glide for the arrows and dots (a click should answer quickly). */
const CLICK_GLIDE_MS = 600;
/** After a swipe, autoplay waits this long. */
const IDLE_AFTER_TOUCH_MS = 4000;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function RecognitionSlider({ children, label }: { children: ReactNode; label: string }) {
  const slides = Children.toArray(children);
  const n = slides.length;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const anim = useRef(0);
  const touchedAt = useRef(0);
  /** When the current glide ends (the 3 s wait starts there). */
  const glideEnd = useRef(0);

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

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

  /** Move to slide i: an eased glide of `ms` (snap off meanwhile), or a jump for reduced motion. */
  const go = useCallback(
    (i: number, ms = CLICK_GLIDE_MS) => {
      const el = track.current;
      if (!el || n === 0) return;
      const next = wrapIndex(i, n);
      cancelAnimationFrame(anim.current);
      const to = next * el.clientWidth;
      if (!document.documentElement.hasAttribute("data-motion")) {
        el.scrollTo({ left: to, behavior: "auto" });
        setIndex(next);
        return;
      }
      const from = el.scrollLeft;
      const t0 = performance.now();
      el.style.scrollSnapType = "none";
      el.style.scrollBehavior = "auto";
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / ms);
        el.scrollLeft = from + (to - from) * easeInOut(p);
        if (p < 1) anim.current = requestAnimationFrame(step);
        else {
          el.style.scrollSnapType = "";
          el.style.scrollBehavior = "";
        }
      };
      setIndex(next);
      glideEnd.current = t0 + ms;
      anim.current = requestAnimationFrame(step);
    },
    [n],
  );

  // Autoplay: the next slide AUTOPLAY_MS after the last glide ended.
  useEffect(() => {
    if (n < 2) return;
    const t = setTimeout(
      () => {
        const idle = performance.now() - touchedAt.current > IDLE_AFTER_TOUCH_MS;
        if (document.hidden || !idle)
          setTick((v) => v + 1); // try again next round
        else go(index + 1, GLIDE_MS);
      },
      Math.max(0, glideEnd.current - performance.now()) + AUTOPLAY_MS,
    );
    return () => clearTimeout(t);
  }, [n, index, tick, go]);

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
        onPointerDown={() => {
          cancelAnimationFrame(anim.current);
          touchedAt.current = performance.now();
        }}
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
            data-active={i === index ? "" : undefined}
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
