"use client";

import { COMMON_HINTS, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import type { Brand, WorkContent } from "@/content/work-schema";
import { saveWork } from "./actions";
import { PIC_HINTS, STAT_HINTS } from "./hints";
import { BrandsManager } from "./brands-manager";
import { SectionsEditor } from "./sections-editor";

// Admin → Work page: the page's sections (hero, red strip, intro, brand grid
// heading, videos, closing card, SEO) and the Brands manager.

const HINTS: Hints = {
  ...COMMON_HINTS,
  ...PIC_HINTS,
  label: { label: "Label" },
  href: { label: "Link (starts with /, # or https://)" },
};

const TAB_HINTS: Record<string, Hints> = {
  hero: {
    title: { label: "Headline (H1)" },
    intro: { label: "Line under the headline" },
    image: { label: "Background photo (wide, about 1920×1080)" },
    focusX: { label: "Point that stays in view, desktop (0 = left, 100 = right)" },
    focusXMobile: { label: "Point that stays in view, phones (0 = left, 100 = right)" },
    buttons: {
      label: "Buttons",
      noun: ["button", "buttons"],
      help: "Up to two. The first is red, the second is plain.",
    },
  },
  stats: {
    items: {
      label: "Numbers",
      noun: ["number", "numbers"],
      help: "The red strip under the hero. Add, edit, delete and reorder with the arrows.",
      itemHints: STAT_HINTS,
    },
  },
  intro: { eyebrow: { label: "Small label (red capitals)" }, body: { label: "Paragraph" } },
  brands: {
    eyebrow: { label: "Small label above the cards" },
    title: { label: "Heading above the cards" },
    pointer: { label: "Line under the heading (empty = hidden)" },
    cardLabel: { label: "Link text on each card", help: "e.g. View our work" },
  },
  videos: {
    body: { label: "Paragraph" },
    first: { label: "First video (lower left)" },
    second: { label: "Second video (upper right)" },
    caption: { label: "Caption" },
    media: {
      label: "Video or image (16:9, up to 100 MB)",
      showShape: true,
      help: "Plays with controls when clicked; never autoplays with sound. Untick “loop” for a normal player. Empty = the placeholder frame.",
    },
  },
  cta: {
    eyebrow: { label: "Small label (red capitals)" },
    title: { label: "Heading" },
    accent: { label: "Heading, end (shown in red)" },
    text: { label: "Supporting line (optional)" },
    label: { label: "Button text", help: "The button opens the Contact page." },
  },
  seo: {
    title: { label: "Page title", help: "Shown as “title | RohTre Media”." },
    description: { label: "Meta description", help: "Search engines show about 160 characters." },
  },
};

export function WorkEditor({
  initial,
  schemas,
  brands,
  brandSchema,
}: {
  initial: WorkContent;
  schemas: Record<string, JsonSchema>;
  brands: Brand[] | null;
  brandSchema: JsonSchema;
}) {
  return (
    <SectionsEditor
      initial={initial}
      schemas={schemas}
      hints={HINTS}
      tabHints={TAB_HINTS}
      pagePath="/work"
      pageName="Work page"
      save={saveWork}
      sections={[
        {
          key: "hero",
          name: "Hero",
          icon: "sparkles",
          about: "Headline, line, buttons and the photo behind them (it stays still while the page scrolls).",
        },
        {
          key: "stats",
          name: "Red stats strip",
          icon: "growth",
          about: "The numbers under the hero. They count up when scrolled into view.",
        },
        {
          key: "intro",
          name: "Intro",
          icon: "pen",
          about: "The “WORK / Built to deliver faster.” block above the brand cards.",
        },
        {
          key: "brandList",
          name: "Brands",
          icon: "briefcase",
          about: "The brand cards on /work, each with its own page /work/<slug>. Each brand saves on its own.",
          panel: <BrandsManager initial={brands} schema={brandSchema} />,
        },
        {
          key: "brands",
          name: "Brand cards heading",
          icon: "eye",
          about: "Label, heading and the line above the cards, and the link text on each card.",
        },
        {
          key: "videos",
          name: "Videos",
          icon: "play",
          about: "The “End-To-End” text and the two offset video frames with their captions.",
        },
        {
          key: "cta",
          name: "Closing call to action",
          icon: "cursor",
          about: "The dark card at the bottom (its button opens the Contact page).",
        },
        {
          key: "seo",
          name: "SEO",
          icon: "search",
          about: "The page title in the browser tab and search results, and the meta description.",
        },
      ]}
    />
  );
}
