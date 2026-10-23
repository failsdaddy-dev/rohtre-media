"use client";

import { useEffect } from "react";
import { COUNT_UP_MS, countText, type CountMetric } from "@/lib/count-up";

// About page motion, run once per element when it scrolls into view:
//   [data-about-count]  the number counts up from 0 to its final text
//                       (the server renders the final text, so it reads
//                       correctly without JavaScript)
//   [data-about-bar]    a progress bar grows from the left to its width
//                       (design.css hides it at scaleX(0) until then)
// Web Animations / text only, never attributes, so it can't clash with
// hydration. Reduced motion (no data-motion on <html>): nothing moves.

/** "+10M mins" → prefix "+", 10, suffix "M mins". Null when there is no number to count. */
export function splitCount(text: string): CountMetric | null {
  const m = /^(\D*?)(\d+(?:\.\d+)?)(.*)$/.exec(text);
  if (!m) return null;
  const decimals = m[2].includes(".") ? m[2].split(".")[1].length : 0;
  return { prefix: m[1], value: Number(m[2]), decimals, suffix: m[3] };
}

function countUp(el: HTMLElement) {
  const metric = splitCount(el.dataset.aboutCount ?? "");
  if (!metric) return;
  const t0 = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / COUNT_UP_MS);
    el.textContent = countText(metric, p);
    if (p < 1) requestAnimationFrame(tick);
  };
  el.textContent = countText(metric, 0);
  requestAnimationFrame(tick);
}

function grow(el: HTMLElement, i: number) {
  el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
    duration: 1200,
    delay: i * 120,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "both",
  });
}

export function AboutMotion() {
  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-motion")) return;
    const bars = [...document.querySelectorAll<HTMLElement>("[data-about-bar]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          if (el.dataset.aboutCount !== undefined) countUp(el);
          else grow(el, bars.indexOf(el));
        }
      },
      { threshold: 0.4 },
    );
    document.querySelectorAll<HTMLElement>("[data-about-count]").forEach((el) => {
      const metric = splitCount(el.dataset.aboutCount ?? "");
      if (metric) el.textContent = countText(metric, 0); // start at 0 until it is seen
      io.observe(el);
    });
    bars.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
