// How the site header looks at the top of a page (before scrolling).
// In every tone, once the page is scrolled the header is the same white bar
// with dark logo and links.
//
//   "solid"                  (DEFAULT) opaque white bar, dark logo and links.
//                            Readable on any page, at any scroll position.
//   "transparent-dark-text"  transparent at the top, dark logo and links:
//                            for pages whose first screen is light.
//   "transparent-light-text" transparent at the top, white logo and links:
//                            for pages whose first screen is dark.
//
// A page gets its tone from the route-group layout it lives in (see
// GROUP_TONES). Anything that doesn't declare a tone gets "solid", so a new
// page can never ship with an invisible header. Phase 3: each hero/section
// type in the section registry will declare the tone it needs, and a page
// takes its tone from its first enabled section (default "solid").

export const HEADER_TONES = ["solid", "transparent-dark-text", "transparent-light-text"] as const;
export type HeaderTone = (typeof HEADER_TONES)[number];

export const DEFAULT_HEADER_TONE: HeaderTone = "solid";

/** Any unknown or missing value becomes the safe default. */
export function resolveHeaderTone(tone: unknown): HeaderTone {
  return HEADER_TONES.includes(tone as HeaderTone) ? (tone as HeaderTone) : DEFAULT_HEADER_TONE;
}

/**
 * Tone per public route group (src/app/(group)/layout.tsx). Measured on the
 * pages, not guessed:
 *   (dark-hero): Contact starts with a dark hero (#050505).
 *   (light-hero): home, About and Careers start with the light sky-blue hero.
 *   (site):      Privacy, Terms (and any new page) start on the light page
 *                background (#f5f4f0); they use the safe default.
 * The root not-found page also uses the default.
 */
export const GROUP_TONES: Record<string, HeaderTone | undefined> = {
  "(dark-hero)": "transparent-light-text",
  "(light-hero)": "transparent-dark-text",
  "(site)": undefined,
};
