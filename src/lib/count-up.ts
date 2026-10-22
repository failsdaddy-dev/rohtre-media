// Count-up numbers (client showcase) and the small helpers the hand-made
// sliders share. Pure functions, so the tests can check them without a
// browser; the DOM side lives in the slider components.

/** How long one count-up takes, and the easing it uses (ease-out cubic). */
export const COUNT_UP_MS = 1400;
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** A swipe shorter than this (px) is a tap, not a slide change. */
export const SWIPE_MIN_PX = 40;

export type CountMetric = { value: number; decimals: number; prefix: string; suffix: string };

/** The final text, exactly as stored: 1.5 + "X" → "1.5X", 49 + "M+" → "49M+". */
export const metricText = (m: CountMetric) => `${m.prefix}${m.value.toFixed(m.decimals)}${m.suffix}`;

/** The text at a point of the animation (progress 0..1); the end is always the exact final text. */
export function countText(m: CountMetric, progress: number): string {
  if (progress >= 1) return metricText(m);
  const p = Math.max(0, progress);
  return `${m.prefix}${(m.value * easeOut(p)).toFixed(m.decimals)}${m.suffix}`;
}

/** Slide index after a step, wrapping around at both ends. */
export const wrapIndex = (i: number, n: number) => (n <= 0 ? 0 : ((i % n) + n) % n);

/** Keyboard step for a carousel: ←/→ move one slide, anything else does nothing. */
export const keyStep = (key: string) => (key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0);

/** Which arrows a scroll row needs: none at the start (prev) or end (next); a 2 px tolerance. */
export function edgeState(scrollLeft: number, scrollWidth: number, clientWidth: number) {
  return { atStart: scrollLeft <= 2, atEnd: scrollLeft + clientWidth >= scrollWidth - 2 };
}
