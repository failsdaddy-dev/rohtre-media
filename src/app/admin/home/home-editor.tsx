"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { COMMON_HINTS, SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { SaveBar } from "@/components/admin/save-bar";
import { Select } from "@/components/admin/select";
import { Button } from "@/components/admin/ui";
import { ServiceIcon } from "@/components/icons";
import type { HomeContent } from "@/content/home-schema";
import { FRAME_SIZE_LABELS } from "@/content/layout-presets";
import { homeBlockers, SECTION_NAMES } from "@/lib/home-blockers";
import { saveHome } from "./actions";

// Home page editor (R23). Left: every section in the order the site shows
// them (icon, name, shown/hidden dot, how many slots are still empty);
// below 1024 px a "Section" dropdown instead. Right: the chosen section only,
// with what it is, a "Show this section" switch, a link to it on the site,
// and its fields in cards (Words, Pictures & videos, Button, Advanced).
// Same generic form, same save call as before; saving goes live straight
// away (the home page cache tag is refreshed).

type Key = keyof HomeContent;
type Group = "words" | "media" | "button" | "advanced";

/** Sections in the order the site shows them, with what each one is and where it is. */
export const SECTIONS: { key: Key; icon: string; anchor: string; about: string }[] = [
  {
    key: "hero",
    icon: "sparkles",
    anchor: "",
    about: "The first screen: headline, video, Book a Call and the picture on the right.",
  },
  {
    key: "badges",
    icon: "megaphone",
    anchor: "partners",
    about: "The heading above the red partner strip. The badges themselves are in Proof & badges.",
  },
  {
    key: "whoWeServe",
    icon: "users",
    anchor: "services",
    about: "Dark section with the five service cards and the values row, under the partner strip.",
  },
  {
    key: "products",
    icon: "bag",
    anchor: "products",
    about: "The product cards slider (“Have an Ecommerce Product?”).",
  },
  {
    key: "engage",
    icon: "monitor",
    anchor: "engage",
    about: "Dark section with text and points on the left and phone frames on the right.",
  },
  {
    key: "videoAds",
    icon: "play",
    anchor: "video-ads",
    about: "Two phones in front of a screen, the strapline under it and the icon row (“Video Ads & Reels”).",
  },
  {
    key: "results",
    icon: "trend",
    anchor: "results",
    about: "The stacking result cards. The results themselves are in Proof & badges → Results.",
  },
  {
    key: "showcase",
    icon: "eye",
    anchor: "client-results",
    about: "The client slider with a poster and counting numbers (“We build growth that shows”).",
  },
  { key: "process", icon: "network", anchor: "process", about: "The steps from first call to growing sales." },
  { key: "brands", icon: "cart", anchor: "brands", about: "The moving row of client logos (dark)." },
  {
    key: "testimonials",
    icon: "pen",
    anchor: "testimonials",
    about: "Client quotes. The quotes themselves are in Proof & badges → Testimonials.",
  },
  { key: "founder", icon: "users", anchor: "founder", about: "The founder’s quote, photo and short bio." },
  { key: "faq", icon: "search", anchor: "faq", about: "Questions and answers; only approved answers go live." },
  {
    key: "finalCta",
    icon: "cursor",
    anchor: "lets-talk",
    about: "The dark “Let’s talk about your brand.” card at the bottom of the page.",
  },
];

/** An icon picker's preview (the Shopify file has no drawn icon, so it shows the name only). */
const iconPreview = (name: string) =>
  name === "shopify" ? null : <ServiceIcon name={name} size={20} className="text-brand" />;
const AD_ICON_LABELS: Record<string, string> = {
  reel: "Reel (play + clapper)",
  clapper: "Clapperboard",
  target: "Target with arrow",
  growth: "Rising bars",
};

/** Labels and help for every home field (keys never change). */
const HINTS: Hints = {
  ...COMMON_HINTS,
  desktop: { label: "Desktop version", help: "12:5, about 1920×800." },
  mobile: { label: "Phone version", help: "4:5, about 1080×1350." },
  href: { label: "Link when clicked (optional, starts with /)" },
  h1: { label: "Headline (H1), first line" },
  h1Accent: { label: "Headline, second line (shown in red)" },
  ctaLabel: { label: "Button text" },
  photo: { label: "Photo" },
  icon: { label: "Icon", optionIcon: iconPreview },
  tint: { label: "Icon colour" },
  logos: {
    label: "Platform logos (optional)",
    noun: ["logo", "logos"],
    help: "Official, unmodified logo files only (e.g. Shopify; Meta and Google). They mean “platforms we work with”, not a partnership.",
  },
  logo_public_id: { label: "Logo" },
  values: { label: "Values row", noun: ["value", "values"] },
  media: { label: "Image or video" },
  points: { label: "Points (with ticks)", noun: ["point", "points"] },
  strapline: { label: "Bold line under the heading" },
  approved: {
    label: "Approved",
    help: "Only approved answers show on the live site. Keep questions short (two lines at most).",
  },
  variant: { label: "Layout", optionLabels: { grid: "Grid", slider: "Moving rows" } },
};

const SIZE_HELP = "How big the frames are on the site. They never get taller than the screen, at any size.";

/** Hints for fields whose name means something different in another section. */
const TAB_HINTS: Partial<Record<Key, Hints>> = {
  hero: {
    mode: {
      label: "Layout",
      optionLabels: { composition: "Headline + video + picture", slider: "Two-slide slider" },
      help: "Headline + video + picture: side by side. Two-slide slider: the baked-text slides.",
    },
    tagline: { label: "Line under the headline (shown with dots between)", noun: ["phrase", "phrases"] },
    video: {
      label: "Video",
      showShape: true,
      help: "Landscape shapes only. The frame keeps its width and takes its height from the shape (very tall shapes get a little narrower so the headline and button stay in place). Loop clip on: muted 10-15 s loop. Off: poster with a play button and sound.",
    },
    videoCaption: { label: "Caption under the video" },
    ctaNote: { label: "Small line under the button" },
    visual: {
      label: "Right-hand picture",
      optionLabels: { illustration: "Built-in magnet drawing", media: "My own image or video" },
    },
    visualMedia: { label: "Your picture (shown whole, no frame)" },
    subline: { label: "Short line under the headline (slider layout only)" },
    slides: {
      label: "Slides (slider layout, exactly two)",
      noun: ["slide", "slides"],
      help: "Each slide needs a desktop and a phone version (image with the text baked in, or a video) and alt text.",
    },
  },
  whoWeServe: { items: { label: "Service cards", noun: ["card", "cards"] }, text: { label: "Card text" } },
  products: {
    items: { label: "Products", noun: ["product", "products"] },
    label: { label: "Small label (e.g. Your Product)" },
    action: { label: "Link text (one line)" },
    media: { label: "Product image or video" },
  },
  engage: {
    phones: {
      label: "Phones",
      noun: ["phone", "phones"],
      help: "One video or image per phone. 1 phone is centred, 2-3 sit side by side, 4 or more become a sideways row with arrows.",
    },
    phonesItem: { label: "Phone screen", phone: true },
    size: { label: "Phone size", optionLabels: FRAME_SIZE_LABELS, help: SIZE_HELP },
  },
  videoAds: {
    // The old four cards are kept in the data (deprecated) but no longer shown or edited.
    items: { hidden: true },
    strapline: { label: "Strapline under the screen (with a short red line)" },
    body: { label: "Paragraph under the strapline" },
    stage: {
      label: "Screens",
      help: "The phones sit in front of the screen’s left and right edges, so keep important content away from the edges.",
    },
    left: { label: "Left phone", showShape: true },
    centre: { label: "Centre screen", showShape: true },
    right: { label: "Right phone", showShape: true },
    icons: {
      label: "Icon row",
      noun: ["icon", "icons"],
      help: "2 to 6 items under the screens. The row re-flows when you add or remove one.",
      itemHints: {
        title: { label: "Title" },
        icon: { label: "Icon", optionLabels: AD_ICON_LABELS, optionIcon: iconPreview },
      },
    },
    size: { label: "Frame size", optionLabels: FRAME_SIZE_LABELS, help: SIZE_HELP },
  },
  process: { steps: { label: "Steps", noun: ["step", "steps"] }, text: { label: "Step text" } },
  brands: {
    items: {
      label: "Client logos",
      noun: ["logo", "logos"],
      help: "Untick a logo to hide it; the order here is the order on the site.",
    },
    name: { label: "Brand name" },
    alt: { label: "Describe the logo (alt text)" },
  },
  faq: {
    items: { label: "Questions", noun: ["question", "questions"] },
    q: { label: "Question" },
    a: { label: "Answer" },
  },
  showcase: {
    slides: {
      label: "Client slides",
      noun: ["slide", "slides"],
      help: "One slide per client. ⧉ duplicates a slide for a new brand; the arrows reorder.",
    },
    brand: { label: "Brand name" },
    poster: { label: "Poster (1:1, 4:5 or 16:10)" },
    period: { label: "Period (optional, e.g. Last 90 days)" },
    source: { label: "Source (optional, e.g. Meta Ads)" },
    currency: { label: "Currency symbol (shown in the Lower CPA icon)" },
    metrics: {
      label: "Numbers (up to six)",
      noun: ["number", "numbers"],
      help: "Only real numbers. Shown as prefix + value + suffix, e.g. 1.5 with suffix X = 1.5X. Switch one off or leave it empty to hide it.",
    },
    label: { label: "Label (e.g. ROAS)" },
    decimals: { label: "Decimal places" },
    icon: { label: "Icon" },
  },
  founder: {
    name: { label: "Name" },
    role: { label: "Role" },
    bio: { label: "Short bio" },
    quote: { label: "Quote" },
    yearsExperience: { label: "Number", help: "1 to 4 digits. Leave empty until confirmed (then nothing shows)." },
    yearsSuffix: { label: "Symbol after the number (optional)", help: "Same size as the number, e.g. +" },
    yearsLabel: { label: "Label", help: "Shown next to the number; wraps under it on narrow screens." },
  },
  finalCta: {
    text: { label: "Supporting line" },
    label: { label: "Button text" },
    animated: {
      label: "Show animated objects",
      help: "Extra shapes and icons in the card that drift gently with the mouse. Off = the card’s basic shapes only.",
    },
  },
};

const GROUPS: { key: Group; title: string; open: boolean }[] = [
  { key: "words", title: "Words", open: true },
  { key: "media", title: "Pictures & videos", open: true },
  { key: "button", title: "Button", open: true },
  { key: "advanced", title: "Advanced", open: false },
];

const BUTTON_KEYS = new Set(["cta", "ctaLabel", "ctaNote", "label"]);
const ADVANCED_KEYS = new Set(["mode", "variant"]);
const MEDIA_KEYS = new Set(["size", "visual", "animated", "photo"]);

/** Does a schema hold an image/video anywhere inside? */
const hasMedia = (s: JsonSchema | undefined): boolean =>
  Boolean(
    s &&
    (s.properties?.publicId ||
      Object.entries(s.properties ?? {}).some(([k, v]) => k.endsWith("_public_id") || hasMedia(v)) ||
      hasMedia(s.items) ||
      s.anyOf?.some(hasMedia)),
  );

/** Which card a field goes in. Slider-only hero fields move to Advanced in the other layout, and back. */
export function groupOf(section: Key, key: string, schema: JsonSchema | undefined, value: HomeContent[Key]): Group {
  if (section === "hero") {
    const sliderOnly = key === "subline" || key === "slides";
    const compositionOnly = ["tagline", "video", "videoCaption", "ctaNote", "visual", "visualMedia"].includes(key);
    const mode = (value as HomeContent["hero"]).mode;
    if ((mode === "composition" && sliderOnly) || (mode === "slider" && compositionOnly)) return "advanced";
  }
  if (section === "whoWeServe" && (key === "items" || key === "values")) return "words";
  if (BUTTON_KEYS.has(key)) return "button";
  if (ADVANCED_KEYS.has(key)) return "advanced";
  if (MEDIA_KEYS.has(key) || hasMedia(schema)) return "media";
  return "words";
}

const pick = (schema: JsonSchema, keys: string[]): JsonSchema => ({
  ...schema,
  properties: Object.fromEntries(keys.map((k) => [k, schema.properties![k]])),
});

export function HomeEditor({ initial, schemas }: { initial: HomeContent; schemas: Record<string, JsonSchema> }) {
  const router = useRouter();
  const [saved, setSaved] = useState<HomeContent>(initial);
  const [data, setData] = useState<HomeContent>(initial);
  const [tab, setTab] = useState<Key>("hero");
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const rail = useRef<HTMLUListElement>(null);
  const blockers = homeBlockers(data);
  const sections = SECTIONS.filter((s) => schemas[s.key]);
  const current = sections.find((s) => s.key === tab)!;
  const schema = schemas[tab];
  const value = data[tab] as Record<string, unknown>;
  const hasSwitch = Boolean(schema.properties?.enabled);
  const shown = (k: Key) => (data[k] as { enabled?: boolean }).enabled !== false;
  const empties = (k: Key) => blockers.filter((b) => b.section === (SECTION_NAMES[k] ?? k)).length;
  const hasErrors = (k: string) => Object.keys(errors).some((p) => p === k || p.startsWith(`${k}.`));

  const tabErrors = (k: string) =>
    Object.fromEntries(
      Object.entries(errors)
        .filter(([p]) => p === k || p.startsWith(`${k}.`))
        .map(([p, v]) => [p.slice(k.length + 1), v]),
    );
  const update = (v: unknown) => {
    setData({ ...data, [tab]: v } as HomeContent);
    setDirty(true);
    setMessage(null);
  };

  /** ↑/↓ (and Home/End) move through the rail, like a list of tabs. */
  const railKeys = (e: KeyboardEvent<HTMLUListElement>) => {
    const i = sections.findIndex((s) => s.key === tab);
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? Math.min(i + 1, sections.length - 1)
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? Math.max(i - 1, 0)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? sections.length - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    setTab(sections[next].key);
    rail.current?.querySelectorAll("button")[next]?.focus();
  };

  const fields = Object.keys(schema.properties ?? {}).filter((k) => k !== "enabled");
  const hints: Hints = { ...HINTS, ...TAB_HINTS[tab], enabled: { hidden: true } };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Section list: a rail from 1024 px, a dropdown below. */}
        <label className="flex flex-col gap-1.5 text-sm lg:hidden">
          <span className="font-semibold">Section</span>
          <Select
            value={tab}
            onChange={(v) => setTab(v as Key)}
            options={sections.map((s, i) => ({
              value: s.key,
              label: `${i + 1}. ${SECTION_NAMES[s.key]}${shown(s.key) ? "" : " (hidden)"}`,
              hint: empties(s.key) ? `${empties(s.key)} to fill` : undefined,
              icon: <ServiceIcon name={s.icon} size={17} />,
            }))}
          />
        </label>
        <nav
          aria-label="Home page sections"
          className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-[18px] border border-line bg-bg-elev p-2 lg:block"
        >
          <ul ref={rail} onKeyDown={railKeys} className="flex flex-col gap-0.5">
            {sections.map((s) => {
              const on = s.key === tab;
              const n = empties(s.key);
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setTab(s.key)}
                    aria-current={on ? "true" : undefined}
                    tabIndex={on ? 0 : -1}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm ${
                      on ? "bg-chip-on-bg font-semibold text-chip-on-fg" : "hover:bg-chip-hover"
                    } ${hasErrors(s.key) && !on ? "text-danger" : ""}`}
                  >
                    <ServiceIcon name={s.icon} size={17} className="shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{SECTION_NAMES[s.key]}</span>
                    {n > 0 && (
                      <span
                        title={`${n} still to fill`}
                        className={`rounded-full px-1.5 text-[11px] font-bold ${on ? "bg-white/20" : "bg-chip"}`}
                      >
                        {n}
                        <span className="sr-only"> still to fill</span>
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className={`size-2 shrink-0 rounded-full ${shown(s.key) ? "bg-[#1f9d4c]" : "bg-[#9a9a9a]"}`}
                    />
                    <span className="sr-only">{shown(s.key) ? "shown" : "hidden"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="section-name" className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
            <div className="min-w-0 flex-1 basis-72">
              <h2 id="section-name" className="text-xl font-bold tracking-[-0.01em]">
                {SECTION_NAMES[tab]}
              </h2>
              <p className="mt-1 text-sm text-fg-2">{current.about}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {hasSwitch ? (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border border-line px-4 text-sm font-semibold">
                  <input
                    type="checkbox"
                    role="switch"
                    className="size-5 accent-[var(--brand)]"
                    checked={value.enabled !== false}
                    onChange={(e) => update({ ...value, enabled: e.target.checked })}
                  />
                  Show this section
                </label>
              ) : (
                <span className="text-sm text-fg-2">Always shown</span>
              )}
              <a
                href={`/${current.anchor ? `#${current.anchor}` : ""}`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center rounded-full bg-chip px-4 text-sm font-semibold hover:bg-chip-hover"
              >
                View on site ↗
              </a>
            </div>
          </header>

          {GROUPS.map((g) => {
            const keys = fields.filter((k) => groupOf(tab, k, schema.properties?.[k], data[tab]) === g.key);
            if (keys.length === 0) return null;
            return (
              <details
                key={`${tab}-${g.key}`}
                open={g.open}
                className="group rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6"
              >
                <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 text-base font-bold">
                  {g.title}
                  <span aria-hidden="true" className="text-fg-2 transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="mt-4">
                  <SchemaForm
                    schema={pick(schema, keys)}
                    value={value}
                    onChange={update}
                    hints={hints}
                    errors={tabErrors(tab)}
                  />
                </div>
              </details>
            );
          })}
        </section>
      </div>

      <details className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
        <summary className="cursor-pointer text-sm font-semibold">
          Launch blockers: {blockers.length === 0 ? "none" : `${blockers.length} still to fill`}
        </summary>
        <p className="mt-2 text-xs text-fg-2">
          Empty slots show a neutral frame on the live site. Fill these before launch (switched-off sections don’t
          count).
        </p>
        <ul className="mt-3 divide-y divide-line text-sm">
          {blockers.map((b, i) => (
            <li key={i} className="flex flex-wrap gap-x-2 py-2">
              <span className="font-semibold">{b.section}</span>
              <span className="text-fg-2">{b.where}</span>
              <span>· {b.message}</span>
            </li>
          ))}
        </ul>
      </details>

      <SaveBar
        dirty={dirty}
        pending={pending}
        message={message}
        idle="Saved. Changes go live on the home page when you save."
        onDiscard={() => {
          setData(saved);
          setErrors({});
          setDirty(false);
          setMessage(null);
        }}
      >
        <Button
          variant="primary"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const res = await saveHome(data);
              if (res.ok) {
                setErrors({});
                setDirty(false);
                setSaved(data);
                setMessage({ tone: "ok", text: "Saved. The home page is updated." });
                router.refresh();
              } else {
                setErrors(res.fieldErrors);
                setMessage({ tone: "error", text: res.error });
              }
            })
          }
        >
          Save home page
        </Button>
      </SaveBar>
    </div>
  );
}
