// Pure helpers for the CTA card's pointer drift (src/components/home/cta-decor.tsx).
// Kept separate so the tests can check the rules without a browser.

/** The drift runs only for a fine pointer (mouse, pen) and when motion is allowed. */
export const parallaxAllowed = (reducedMotion: boolean, coarsePointer: boolean) => !reducedMotion && !coarsePointer;

/** One easing step from `from` towards `to`. */
export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** The pointer's place over the card, -1 (left/top edge) to 1 (right/bottom edge), 0 = centre. */
export function pointerOffset(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  return {
    x: rect.width ? clamp(((clientX - rect.left) / rect.width) * 2 - 1) : 0,
    y: rect.height ? clamp(((clientY - rect.top) / rect.height) * 2 - 1) : 0,
  };
}

/** Close enough to the target to stop animating. */
export const settled = (a: number, b: number) => Math.abs(a - b) < 0.001;
