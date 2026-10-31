import { isFilled } from "../content/media-slot";
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
    // The banner is optional, but it needs both sizes and alt text once started.
    const b = hero.props.offerBanner;
    if (b.desktop || b.mobile) {
      if (!b.desktop) add("banner-desktop", "Upload the offer banner for desktop too.", hero.id);
      if (!b.mobile) add("banner-mobile", "Upload the offer banner for mobile too.", hero.id);
      if (!b.alt.trim()) add("banner-alt", "Describe the offer banner in its alt text.", hero.id);
    }
  }

  // Form (R10, R25)
  if (enabledOf(c, "form").length === 0) add("form", "The page needs the enquiry form section switched on.");

  // Proof is optional: a section with no approved items is left off the live page.
  for (const s of enabledOf(c, "creatives")) {
    if (s.props.showConcept && ctx.unlabelledConcept > 0)
      add("concept-label", "Every concept work item needs its “Concept work” label.", s.id);
  }
  for (const s of enabledOf(c, "badges")) {
    const missing = s.props.badgeIds.filter((id) => !ctx.liveBadgeIds.includes(id));
    if (missing.length) add("badges", `${missing.length} chosen badge(s) are switched off or deleted.`, s.id);
  }

  // Missing-fact markers anywhere in the copy (R30)
  const sectionsWithMarkers = c.sections.filter((s) => s.enabled && MISSING_MARKERS.test(JSON.stringify(s.props)));
  for (const s of sectionsWithMarkers)
    add("missing-facts", "This section still contains [NEEDS DATA] or TO CONFIRM.", s.id);
  if (MISSING_MARKERS.test(JSON.stringify(c.meta)))
    add("missing-facts", "The meta title or description still has a placeholder.");

  return issues;
}

const SECTION_NAMES: Record<Section["type"], string> = {
  hero: "Hero",
  badges: "Partner badges",
  painPoints: "Pain points",
  results: "Results",
  creatives: "Creatives & reels",
  platforms: "Platforms",
  testimonials: "Testimonials",
  process: "Process",
  faq: "FAQ",
  form: "Enquiry form",
  customHtml: "Custom HTML",
};

const unfilled = (text: string) => !text.trim() || HAS_PROMPT.test(text);

/**
 * What is still empty on a page, section by section, for Re-check. These never
 * block publishing; they only tell the team what is left to add. Sections that
 * are switched off are skipped.
 */
export function pageTodos(rawContent: unknown, ctx: PublishContext): PublishIssue[] {
  const parsed = pageContentSchema.safeParse(rawContent);
  if (!parsed.success) return [];
  const todos: PublishIssue[] = [];
  for (const s of parsed.data.sections.filter((x) => x.enabled)) {
    const todo = (text: string) =>
      todos.push({ code: "todo", message: `${SECTION_NAMES[s.type]}: ${text}`, sectionId: s.id });
    const incomplete = (noun: string, items: string[][]) => {
      const left = items.filter((fields) => fields.some(unfilled)).length;
      if (left) todo(`fill in ${left} of ${items.length} ${noun}.`);
    };
    if ("title" in s.props && unfilled(s.props.title)) todo("add the heading.");
    switch (s.type) {
      case "hero":
        if (unfilled(s.props.subline)) todo("add the hero text.");
        if (!s.props.offerBanner.desktop || !s.props.offerBanner.mobile) todo("add the offer banner images.");
        break;
      case "badges":
        if (ctx.liveBadgeIds.length === 0) todo("no badges are switched on.");
        break;
      case "painPoints":
        incomplete("pain points", s.props.items.map((i) => [i.title, i.text]));
        break;
      case "results":
        if (s.props.uploads.length === 0 && ctx.liveCounts.results === 0)
          todo("upload a result here, or tag one in Proof & badges.");
        s.props.uploads.forEach((u, i) => {
          if (!isFilled(u.file)) todo(`add the image or video for result ${i + 1}.`);
          if (unfilled(u.metric) || unfilled(u.metricLabel)) todo(`add the number and its label for result ${i + 1}.`);
        });
        break;
      case "creatives":
        if (!s.props.media.some(isFilled) && ctx.liveCounts.creatives === 0)
          todo("upload images or videos here, or tag creatives in Proof & badges.");
        break;
      case "platforms":
        incomplete("platforms", s.props.items.map((i) => [i.name, i.text]));
        break;
      case "testimonials":
        if (ctx.liveCounts.testimonials === 0) todo("no approved testimonials match this page yet.");
        break;
      case "process":
        incomplete("steps", s.props.steps.map((i) => [i.title, i.text]));
        break;
      case "faq": {
        const drafts = s.props.items.filter((i) => i.status !== "ready").length;
        if (s.props.items.length === 0) todo("add some questions.");
        else if (drafts) todo(`${drafts} of ${s.props.items.length} answers are still drafts (visitors won’t see them).`);
        break;
      }
      case "customHtml":
        if (!s.props.html.trim()) todo("add the HTML.");
        break;
    }
  }
  return todos;
}
