"use client";

import { COMMON_HINTS, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import type { RecognitionContent } from "@/content/work-schema";
import { PIC_HINTS } from "../work/hints";
import { SectionsEditor } from "../work/sections-editor";
import { saveRecognition } from "./actions";

// Admin → Recognition page: the slider, the award cards, the client quotes,
// the team block and SEO (the Work page editor's pattern).

const HINTS: Hints = {
  ...COMMON_HINTS,
  ...PIC_HINTS,
  label: { label: "Button text" },
  href: { label: "Link (starts with /, # or https://)" },
};

const TAB_HINTS: Record<string, Hints> = {
  hero: {
    slides: {
      label: "Slides",
      noun: ["slide", "slides"],
      help: "Shown one at a time with arrows, dots and swipe (no autoplay). Add, edit, delete and reorder with the arrows.",
      itemHints: {
        image: { label: "Background photo (wide, about 1920×1080)" },
        title: { label: "Heading" },
        text: { label: "Line under the heading" },
        buttons: { label: "Buttons", noun: ["button", "buttons"], help: "Up to two. The first is red." },
      },
    },
  },
  awards: {
    items: {
      label: "Award cards",
      noun: ["award", "awards"],
      help: "Logo on a white tile (upload the logo as it is; it is never recoloured), title and description.",
      itemHints: {
        logo: { label: "Award logo (square, transparent PNG works best)" },
        title: { label: "Title" },
        body: { label: "Description" },
      },
    },
  },
  clients: {
    eyebrow: { label: "Small label (red capitals)" },
    title: { label: "Heading" },
    items: {
      label: "Quotes",
      noun: ["quote", "quotes"],
      itemHints: {
        quote: { label: "Quote" },
        name: { label: "Name" },
        role: { label: "Role / company (optional)" },
        photo: { label: "Photo (square, optional)" },
      },
    },
  },
  team: {
    image: { label: "Image (left column)" },
    eyebrow: { label: "Small label (red capitals)" },
    title: { label: "Heading" },
    body: { label: "Paragraph" },
    linkLabel: { label: "Link text (empty = hidden)" },
    linkHref: { label: "Link (starts with /, # or https://)" },
  },
  seo: {
    title: { label: "Page title", help: "Shown as “title | RohTre Media”." },
    description: { label: "Meta description", help: "Search engines show about 160 characters." },
  },
};

export function RecognitionEditor({
  initial,
  schemas,
}: {
  initial: RecognitionContent;
  schemas: Record<string, JsonSchema>;
}) {
  return (
    <SectionsEditor
      initial={initial}
      schemas={schemas}
      hints={HINTS}
      tabHints={TAB_HINTS}
      pagePath="/recognition"
      pageName="Recognition page"
      save={saveRecognition}
      sections={[
        {
          key: "hero",
          name: "Hero slider",
          icon: "sparkles",
          about: "The slides at the top: photo, heading, line and buttons.",
        },
        {
          key: "awards",
          name: "Award cards",
          icon: "star",
          about: "The four award blocks: logo, title and description.",
        },
        {
          key: "clients",
          name: "Client recognition",
          icon: "users",
          about: "“We work hard to make our clients look good” and the client quotes.",
        },
        {
          key: "team",
          name: "Our team",
          icon: "network",
          about: "“Our team makes us successful.” with the YouTube buttons image and the link.",
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
