import type { HomeContent } from "../content/home-schema";
import { looksLikeSlot } from "../content/media-slot";

// What the home page still needs before launch (R19, R25 style): every
// media slot that is empty or has no alt text, brand logos that are missing
// or unidentified, client-showcase slides without a brand or without the
// period and source of their numbers, and every FAQ answer not yet approved.
// Only sections that are switched on count, and only the hero slots of the
// chosen hero layout. Pure, so the admin shows it live while editing and the
// tests can check it.

export type HomeBlocker = { section: string; where: string; message: string };

export const SECTION_NAMES: Record<string, string> = {
  hero: "Hero & slides",
  badges: "Partner strip",
  whoWeServe: "Who we serve",
  products: "Product showcase",
  engage: "Scroll. Engage. Convert",
  videoAds: "Video ads & reels",
  results: "Results",
  showcase: "Client showcase",
  brands: "Brands we've worked with",
  process: "Process",
  testimonials: "Testimonials",
  founder: "Founder",
  faq: "FAQ",
  finalCta: "Final call to action",
};

/** "items.2.media" → "item 3 › media" */
const place = (path: (string | number)[]) =>
  path
    .map((p) => (typeof p === "number" ? `${p + 1}` : p.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()))
    .join(" › ")
    .replace(/s › (\d+)/g, " $1");

function walkSlots(
  value: unknown,
  path: (string | number)[],
  visit: (slot: unknown, path: (string | number)[]) => void,
) {
  if (looksLikeSlot(value)) return visit(value, path);
  if (Array.isArray(value)) value.forEach((v, i) => walkSlots(v, [...path, i], visit));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) walkSlots(v, [...path, k], visit);
}

/** The hero without the slots its layout doesn't show. */
function heroInUse(hero: HomeContent["hero"]) {
  const { slides, video, visualMedia, ...rest } = hero;
  if (hero.mode === "slider") return { ...rest, slides };
  return hero.visual === "media" ? { ...rest, video, visualMedia } : { ...rest, video };
}

export function homeBlockers(home: HomeContent): HomeBlocker[] {
  const out: HomeBlocker[] = [];
  for (const [key, raw] of Object.entries(home)) {
    const section = key === "hero" ? heroInUse(home.hero) : raw;
    if ("enabled" in section && section.enabled === false) continue;
    const name = SECTION_NAMES[key] ?? key;
    walkSlots(section, [], (raw, path) => {
      if (!looksLikeSlot(raw)) return;
      const where = place(path);
      if (!raw.publicId)
        out.push({ section: name, where, message: `Empty ${raw.aspect} slot: upload an image or video.` });
      else if (raw.type === "image" && !raw.alt.trim())
        out.push({ section: name, where, message: "Image has no alt text." });
    });
  }
  if (home.brands.enabled) {
    home.brands.items.forEach((b, i) => {
      const where = `logo ${i + 1} (${b.name})`;
      if (!b.logo_public_id) out.push({ section: SECTION_NAMES.brands, where, message: "No logo file." });
      if (/^unidentified/i.test(b.name))
        out.push({ section: SECTION_NAMES.brands, where, message: "Brand not identified yet (kept switched off)." });
    });
  }
  if (home.showcase.enabled) {
    home.showcase.slides.forEach((sl, i) => {
      const where = `slide ${i + 1}${sl.brand ? ` (${sl.brand})` : ""}`;
      if (!sl.brand.trim()) out.push({ section: SECTION_NAMES.showcase, where, message: "No brand name yet." });
      const numbers = sl.metrics.some((m) => m.enabled && m.value != null);
      if (numbers && !sl.period.trim())
        out.push({ section: SECTION_NAMES.showcase, where, message: "Numbers have no period (e.g. “Last 90 days”)." });
      if (numbers && !sl.source.trim())
        out.push({ section: SECTION_NAMES.showcase, where, message: "Numbers have no source (e.g. “Meta Ads”)." });
    });
  }
  if (home.faq.enabled) {
    home.faq.items.forEach((f, i) => {
      if (!f.approved)
        out.push({ section: SECTION_NAMES.faq, where: `question ${i + 1}`, message: `Not approved: “${f.q}”` });
    });
  }
  return out;
}
