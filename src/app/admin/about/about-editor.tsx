"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { COMMON_HINTS, SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { SaveBar } from "@/components/admin/save-bar";
import { Select } from "@/components/admin/select";
import { Button } from "@/components/admin/ui";
import { ServiceIcon } from "@/components/icons";
import type { AboutContent } from "@/content/about-schema";
import { saveAbout } from "./actions";

// About page editor. Same pattern as the home editor: a rail of the page's
// sections (a dropdown below 1024 px), the chosen section's fields from the
// generic schema form, and the save bar. Saving goes live straight away.

type Key = keyof AboutContent;

const SECTIONS: { key: Key; name: string; icon: string; anchor: string; about: string }[] = [
  { key: "hero", name: "Hero", icon: "sparkles", anchor: "", about: "Headline, intro line and two buttons over the founder photo." },
  { key: "highlights", name: "Red stats strip", icon: "trend", anchor: "highlights", about: "The red strip under the hero (number + line). The numbers count up when scrolled into view." },
  { key: "intro", name: "Who we are", icon: "pen", anchor: "who-we-are", about: "Heading and paragraph above the three values." },
  { key: "values", name: "Values", icon: "megaphone", anchor: "who-we-are", about: "The three value cards (icon, title, text)." },
  { key: "numbers", name: "Counter cards", icon: "eye", anchor: "counters", about: "Four white cards (awards, clients, hours, teams), each icon in its own colour." },
  { key: "diversity", name: "Diversity & inclusion", icon: "users", anchor: "diversity", about: "Text, the hiring button and the progress bars." },
  { key: "review", name: "Year in review", icon: "play", anchor: "year-in-review", about: "Heading, the 19:10 video and the paragraph under it." },
  { key: "team", name: "Team", icon: "network", anchor: "team", about: "Leadership card and the team members (add, edit, delete, reorder)." },
  { key: "cta", name: "Closing call to action", icon: "cursor", anchor: "lets-talk", about: "The dark Book a Call card at the bottom." },
  { key: "seo", name: "SEO", icon: "search", anchor: "", about: "The page title in the browser tab and search results, and the meta description." },
];

const iconPreview = (name: string) => <ServiceIcon name={name} size={20} className="text-brand" />;

const HINTS: Hints = {
  ...COMMON_HINTS,
  icon: { label: "Icon", optionIcon: iconPreview },
  tint: { label: "Icon colour" },
  value: { label: "Number", help: "As shown, e.g. +2B or +10M mins. The digits count up on the page." },
  text: { label: "Text" },
  label: { label: "Label" },
  photo: { label: "Photo (square, at least 400×400)" },
  name: { label: "Name" },
  role: { label: "Role" },
  bio: { label: "Short bio (optional)", multiline: true },
};

const TAB_HINTS: Partial<Record<Key, Hints>> = {
  seo: {
    title: { label: "Page title", help: "Shown as “title | RohTre Media”." },
    description: { label: "Meta description", help: "One or two sentences, up to 170 characters." },
  },
  hero: {
    title: { label: "Headline (H1)" },
    accent: { label: "Headline, end (shown in red)" },
    intro: { label: "Line under the headline" },
    primaryLabel: { label: "First button text" },
    primaryHref: { label: "First button link (starts with /, # or https://)" },
    secondaryLabel: { label: "Second button text (empty = hidden)" },
    secondaryHref: { label: "Second button link" },
    image: {
      label: "Background photo (wide, about 2400×1000)",
      help: "Fills the hero behind the text and stays still while the page scrolls over it. A dark shade is added for the text.",
    },
    focusX: {
      label: "Where the person stands, desktop (0 = left, 100 = right)",
      help: "The photo is cropped to the screen; this point stays in view. 66 keeps Rohan in the frame.",
    },
    focusXMobile: {
      label: "Where the person stands, phones (0 = left, 100 = right)",
      help: "Phones show a narrow slice of the photo. Same idea, set separately.",
    },
  },
  highlights: { items: { label: "Numbers", noun: ["number", "numbers"] } },
  values: { items: { label: "Value cards", noun: ["card", "cards"] }, title: { label: "Title" } },
  numbers: {
    items: { label: "Counter cards", noun: ["card", "cards"] },
    label: { label: "Label (capitals)" },
    color: {
      label: "Icon colour",
      optionLabels: { amber: "Amber", blue: "Blue", violet: "Violet", teal: "Teal", green: "Green", pink: "Pink" },
    },
  },
  diversity: {
    body: { label: "First paragraph" },
    highlight: { label: "Bold sentence (starts the second paragraph)" },
    body2: { label: "Second paragraph" },
    ctaLabel: { label: "Button text (empty = hidden)" },
    ctaHref: { label: "Button link" },
    bars: {
      label: "Progress bars",
      noun: ["bar", "bars"],
      help: "Label and percentage (0-100). They fill once when scrolled into view.",
      itemHints: { label: { label: "Label" }, percent: { label: "Percentage" } },
    },
  },
  review: {
    video: {
      label: "Video (19:10, about 1900×1000)",
      showShape: true,
      help: "Plays with controls when clicked; never autoplays with sound. Poster image optional. Untick “loop” for a normal player.",
    },
  },
  team: {
    intro: { label: "Intro paragraph" },
    leadershipTitle: { label: "Leadership heading" },
    leader: { label: "Leader (bio: 4-5 lines on desktop, up to 420 characters)" },
    membersTitle: { label: "Team heading" },
    members: {
      label: "Team members",
      noun: ["member", "members"],
      help: "Shown left to right in this order. The arrows reorder.",
    },
  },
  cta: {
    title: { label: "Heading" },
    accent: { label: "Heading, end (shown in red)" },
    text: { label: "Supporting line (optional)" },
    label: { label: "Button text" },
    animated: {
      label: "Show animated objects",
      help: "Extra shapes and icons in the card that drift gently with the mouse. Off = the card’s basic shapes only.",
    },
  },
};

export function AboutEditor({ initial, schemas }: { initial: AboutContent; schemas: Record<string, JsonSchema> }) {
  const router = useRouter();
  const [saved, setSaved] = useState<AboutContent>(initial);
  const [data, setData] = useState<AboutContent>(initial);
  const [tab, setTab] = useState<Key>("hero");
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const current = SECTIONS.find((s) => s.key === tab)!;
  const schema = schemas[tab];
  const value = data[tab] as Record<string, unknown>;
  const hasSwitch = Boolean(schema.properties?.enabled);
  const shown = (k: Key) => (data[k] as { enabled?: boolean }).enabled !== false;
  const hasErrors = (k: string) => Object.keys(errors).some((p) => p === k || p.startsWith(`${k}.`));
  const tabErrors = Object.fromEntries(
    Object.entries(errors)
      .filter(([p]) => p === tab || p.startsWith(`${tab}.`))
      .map(([p, v]) => [p.slice(tab.length + 1), v]),
  );
  const update = (v: unknown) => {
    setData({ ...data, [tab]: v } as AboutContent);
    setDirty(true);
    setMessage(null);
  };
  const hints: Hints = { ...HINTS, ...TAB_HINTS[tab], enabled: { hidden: true } };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <label className="flex flex-col gap-1.5 text-sm lg:hidden">
          <span className="font-semibold">Section</span>
          <Select
            value={tab}
            onChange={(v) => setTab(v as Key)}
            options={SECTIONS.map((s, i) => ({
              value: s.key,
              label: `${i + 1}. ${s.name}${shown(s.key) ? "" : " (hidden)"}`,
              icon: <ServiceIcon name={s.icon} size={17} />,
            }))}
          />
        </label>
        <nav
          aria-label="About page sections"
          className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-[18px] border border-line bg-bg-elev p-2 lg:block"
        >
          <ul className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => {
              const on = s.key === tab;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setTab(s.key)}
                    aria-current={on ? "true" : undefined}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm ${
                      on ? "bg-chip-on-bg font-semibold text-chip-on-fg" : "hover:bg-chip-hover"
                    } ${hasErrors(s.key) && !on ? "text-danger" : ""}`}
                  >
                    <ServiceIcon name={s.icon} size={17} className="shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
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
                {current.name}
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
                href={`/about${current.anchor ? `#${current.anchor}` : ""}`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center rounded-full bg-chip px-4 text-sm font-semibold hover:bg-chip-hover"
              >
                View on site ↗
              </a>
            </div>
          </header>

          <div className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
            <SchemaForm
              key={tab}
              schema={{ ...schema, properties: Object.fromEntries(Object.entries(schema.properties ?? {}).filter(([k]) => k !== "enabled")) }}
              value={value}
              onChange={update}
              hints={hints}
              errors={tabErrors}
            />
          </div>
        </section>
      </div>

      <SaveBar
        dirty={dirty}
        pending={pending}
        message={message}
        idle="Saved. Changes go live on the About page when you save."
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
              const res = await saveAbout(data);
              if (res.ok) {
                setErrors({});
                setDirty(false);
                setSaved(data);
                setMessage({ tone: "ok", text: "Saved. The About page is updated." });
                router.refresh();
              } else {
                setErrors(res.fieldErrors);
                setMessage({ tone: "error", text: res.error });
              }
            })
          }
        >
          Save About page
        </Button>
      </SaveBar>
    </div>
  );
}
