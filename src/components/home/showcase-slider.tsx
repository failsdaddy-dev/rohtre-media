"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { COUNT_UP_MS, countText, keyStep, SWIPE_MIN_PX, wrapIndex, type CountMetric } from "@/lib/count-up";
import { ArrowRightIcon } from "../icons";

// The client-showcase carousel: one slide at a time (all slides share one
// grid cell, so the height never jumps), large arrows at the section edges,
// ←/→ keys, swipe, wrap-around, a "Slide 2 of 2" live region, no autoplay.
// The numbers ([data-count], rendered by the server with their final text)
// count up from 0 the first time the carousel scrolls into view and again
// each time a slide is shown. Reduced motion: the final numbers, at once.

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function readMetric(el: HTMLElement): CountMetric {
  const d = el.dataset;
  return { value: Number(d.count), decimals: Number(d.decimals), prefix: d.prefix ?? "", suffix: d.suffix ?? "" };
}

/** Count every number in a slide up from 0; returns a cancel function. */
function countUp(slide: Element): () => void {
  const els = [...slide.querySelectorAll<HTMLElement>("[data-count]")];
  const metrics = els.map(readMetric);
  els.forEach((el, i) => (el.textContent = countText(metrics[i], 0)));
  const start = performance.now();
  let frame = requestAnimationFrame(function tick(now) {
    const progress = (now - start) / COUNT_UP_MS;
    els.forEach((el, i) => (el.textContent = countText(metrics[i], progress)));
    if (progress < 1) frame = requestAnimationFrame(tick);
  });
  return () => {
    cancelAnimationFrame(frame);
    els.forEach((el, i) => (el.textContent = countText(metrics[i], 1)));
  };
}

export function ShowcaseSlider({ children, label }: { children: ReactNode; label: string }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  const cancel = useRef<(() => void) | null>(null);
  const swipeFrom = useRef<number | null>(null);

  const animate = useCallback((index: number) => {
    const slide = root.current?.querySelectorAll("[data-slide]")[index];
    cancel.current?.();
    cancel.current = slide && !reducedMotion() ? countUp(slide) : null;
  }, []);

  // First time in view: count up the slide that is showing.
  useEffect(() => {
    const el = root.current;
    if (!el || reducedMotion()) return;
    const first = el.querySelector("[data-slide]");
    first?.querySelectorAll<HTMLElement>("[data-count]").forEach((n) => (n.textContent = countText(readMetric(n), 0)));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen.current = true;
        observer.disconnect();
        animate(0);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancel.current?.();
    };
  }, [animate]);

  const go = (step: number) => {
    const next = wrapIndex(active + step, count);
    if (next === active) return;
    setActive(next);
    animate(next);
  };

  // Below the slides on phones and tablets; at the section edges from 1024 px.
  const arrow =
    "grid size-12 max-md:size-9 place-items-center rounded-full border border-line bg-bg-elev text-fg shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] transition-colors hover:bg-chip-hover lg:absolute lg:top-[calc(50%-40px)] lg:z-10 lg:size-14 lg:-translate-y-1/2";
  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={(e) => {
        const step = keyStep(e.key);
        if (step && count > 1) {
          e.preventDefault();
          go(step);
        }
      }}
      className="relative rounded-[1.75rem] outline-offset-4"
    >
      <div
        className="grid touch-pan-y"
        onPointerDown={(e) => (swipeFrom.current = e.clientX)}
        onPointerUp={(e) => {
          const from = swipeFrom.current;
          swipeFrom.current = null;
          if (from === null || count < 2) return;
          const dx = e.clientX - from;
          if (Math.abs(dx) >= SWIPE_MIN_PX) go(dx < 0 ? 1 : -1);
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            data-slide=""
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== active}
            inert={i !== active}
            className={`[grid-area:1/1] transition-[opacity,visibility] duration-500 motion-reduce:transition-none ${
              i === active ? "visible opacity-100" : "invisible opacity-0"
            }`}
          >
            {slide}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className={`${arrow} lg:-left-3 xl:-left-10 2xl:-left-20`}
          >
            <ArrowRightIcon size={22} className="rotate-180" />
          </button>
          <p aria-live="polite" className="min-w-24 text-center text-sm font-semibold tabular-nums text-fg-2">
            Slide {active + 1} of {count}
          </p>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className={`${arrow} lg:-right-3 xl:-right-10 2xl:-right-20`}
          >
            <ArrowRightIcon size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
