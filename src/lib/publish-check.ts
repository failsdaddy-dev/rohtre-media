import { pageContentSchema, type PageContent, type Section, type SectionOf } from "../sections/schemas";
import { HAS_PROMPT } from "./dimensions";

// The automatic publish check (R25). Publishing is refused while any issue
// remains. Pure: the page script, the admin (Phase 4) and the tests use it.

export type PublishIssue = { code: string; message: string; sectionId?: string };

export type PublishContext = {
  slug: string;
  visibility: string;
  /** Slugs of the other pages (the slug must be unique). */
  otherSlugs: string[];
  /** How many approved, non-placeholder items each proof section would show on this page. */
  liveCounts: { results: number; testimonials: number; creatives: number; concept: number };
  /** Concept items that would show but have no label (R45). */
  unlabelledConcept: number;
  /** Ids of switched-on badges (R11 as changed by the founder: switched on = shown). */
  liveBadgeIds: string[];
};

const VISIBILITIES = ["public", "unlisted", "private"];
/** Markers that mean "fact still missing" (R30 writes [NEEDS DATA]; legal pages use TO CONFIRM). */
const MISSING_MARKERS = /\[NEEDS DATA\]|TO CONFIRM|\bTODO\b|lorem ipsum/i;

const enabledOf = <T extends Section["type"]>(c: PageContent, type: T) =>
  c.sections.filter((s): s is SectionOf<T> => s.type === type && s.enabled);

export function checkPublish(rawContent: unknown, ctx: PublishContext): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const add = (code: string, message: string, sectionId?: string) => issues.push({ code, message, sectionId });

  // Slug and visibility
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ctx.slug)) add("slug-format", "The URL slug may only use a-z, 0-9 and dashes.");
  if (ctx.otherSlugs.includes(ctx.slug)) add("slug-unique", `Another page already uses /lp/${ctx.slug}.`);
  if (!VISIBILITIES.includes(ctx.visibility)) add("visibility", "Choose public, unlisted or private.");

  const parsed = pageContentSchema.safeParse(rawContent);
  if (!parsed.success) {
    add(
      "content-invalid",
      `The page content doesn't match the section schemas: ${parsed.error.issues[0]?.message ?? "invalid"}.`,
    );
    return issues;
  }
  const c = parsed.data;

  // Meta
  if (c.meta.title.trim().length < 10) add("meta-title", "Add a meta title (about 50-60 characters).");
  if (c.meta.description.trim().length < 50)
    add("meta-description", "Add a meta description (about 120-160 characters).");

  // Hero: H1 and offer banner
  const heroes = enabledOf(c, "hero");
  if (heroes.length !== 1) add("hero", "The page needs exactly one hero section switched on.");
  const firstEnabled = c.sections.find((s) => s.enabled);
  if (heroes.length === 1 && firstEnabled?.type !== "hero")
    add("hero-first", "The hero must be the first section.", heroes[0].id);
  for (const hero of heroes) {
    if (!hero.props.h1.trim()) add("h1", "The hero needs a headline (the page's H1).", hero.id);
    const b = hero.props.offerBanner;
    if (!b.desktop) add("banner-desktop", "Upload the offer banner for desktop.", hero.id);
    if (!b.mobile) add("banner-mobile", "Upload the offer banner for mobile.", hero.id);
    if (!b.alt.trim()) add("banner-alt", "Describe the offer banner in its alt text.", hero.id);
  }

  // Form (R10, R25)
  if (enabledOf(c, "form").length === 0) add("form", "The page needs the enquiry form section switched on.");

  // No placeholder blocks (R19): proof sections must have real, approved items.
  for (const s of enabledOf(c, "results")) {
    if (ctx.liveCounts.results === 0)
      add("results-empty", "No approved results match this page. Add one or switch the section off.", s.id);
  }
  for (const s of enabledOf(c, "testimonials")) {
    if (ctx.liveCounts.testimonials === 0)
      add("testimonials-empty", "No approved testimonials match this page. Add one or switch the section off.", s.id);
  }
  for (const s of enabledOf(c, "creatives")) {
    const shown = ctx.liveCounts.creatives + (s.props.showConcept ? ctx.liveCounts.concept : 0);
    if (shown === 0)
      add("creatives-empty", "No approved creatives match this page. Add some or switch the section off.", s.id);
    if (s.props.showConcept && ctx.unlabelledConcept > 0)
      add("concept-label", "Every concept work item needs its “Concept work” label.", s.id);
  }
  for (const s of enabledOf(c, "faq")) {
    if (s.props.items.length === 0) add("faq-empty", "Add FAQ answers or switch the section off.", s.id);
    if (s.props.items.some((i) => i.status !== "ready"))
      add("faq-draft", "Some FAQ answers are still drafts. Rewrite them for this page and mark them ready.", s.id);
  }
  for (const s of enabledOf(c, "badges")) {
    const missing = s.props.badgeIds.filter((id) => !ctx.liveBadgeIds.includes(id));
    if (missing.length) add("badges", `${missing.length} chosen badge(s) are switched off or deleted.`, s.id);
    if (s.props.badgeIds.length === 0 && ctx.liveBadgeIds.length === 0)
      add("badges-empty", "No badges are switched on.", s.id);
  }

  // Missing-fact markers anywhere in the copy (R30)
  const sectionsWithMarkers = c.sections.filter((s) => s.enabled && MISSING_MARKERS.test(JSON.stringify(s.props)));
  for (const s of sectionsWithMarkers)
    add("missing-facts", "This section still contains [NEEDS DATA] or TO CONFIRM.", s.id);
  if (MISSING_MARKERS.test(JSON.stringify(c.meta)))
    add("missing-facts", "The meta title or description still has a placeholder.");

  // "[Add ... here]" prompts on pages made from custom options
  const PROMPT_SECTIONS: Partial<Record<Section["type"], string>> = {
    hero: "Hero",
    painPoints: "Pain points",
    platforms: "Platforms",
  };
  for (const s of c.sections.filter((x) => x.enabled && HAS_PROMPT.test(JSON.stringify(x.props))))
    add("prompts", `${PROMPT_SECTIONS[s.type] ?? "A section"}: replace the “[Add … here]” text.`, s.id);

  return issues;
}
