"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { COMMON_HINTS, SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { SaveBar } from "@/components/admin/save-bar";
import { Select } from "@/components/admin/select";
import { Button } from "@/components/admin/ui";
import { ServiceIcon } from "@/components/icons";
import { CARD_COLORS, type CareersContent } from "@/content/careers-schema";
import { saveCareers } from "./actions";

// Careers page editor. Same pattern as the About editor: a rail of the
// page's sections (a dropdown below 1024 px), the chosen section's fields
// from the generic schema form, and the save bar. Saving goes live straight
// away. "Application form" holds the form's choices; the HR emails are
// private and saved separately (HrEmails, below the editor).

type Key = keyof CareersContent;

const SECTIONS: { key: Key; name: string; icon: string; anchor: string; about: string }[] = [
  { key: "hero", name: "Hero", icon: "sparkles", anchor: "", about: "Headline, intro, buttons and the background photo (fixed while scrolling, fades out)." },
  { key: "strip", name: "Red strip", icon: "trend", anchor: "", about: "Awards and partners: logo (or big text) and a label. 5 across on desktop." },
  { key: "blocks", name: "Image + text blocks", icon: "monitor", anchor: "", about: "The alternating photo and text blocks. Choose the photo side per block." },
  { key: "benefits", name: "Benefits intro", icon: "heart", anchor: "benefits", about: "Heading, paragraph, three cards and the “See all benefits” link." },
  { key: "spotlights", name: "Employee spotlights", icon: "users", anchor: "spotlights", about: "Team cards: photo, headline, name, role, story." },
  { key: "values", name: "Values", icon: "star", anchor: "", about: "“We run the show”, the intro and the three value cards." },
  { key: "perks", name: "Benefits grid", icon: "network", anchor: "all-benefits", about: "The grid of benefit cards (3 across on desktop)." },
  { key: "faq", name: "FAQ", icon: "search", anchor: "faq", about: "Hiring questions and answers (also given to search engines as FAQ data)." },
  { key: "cta", name: "Closing card", icon: "cursor", anchor: "apply-now", about: "The dark card at the bottom; its button opens the application form." },
  { key: "form", name: "Application form", icon: "briefcase", anchor: "", about: "The roles and experience choices in the form, and the thank-you line. HR emails are below." },
  { key: "seo", name: "SEO", icon: "eye", anchor: "", about: "The page title in the browser tab and search results, and the meta description." },
];

const iconPreview = (name: string) => <ServiceIcon name={name} size={20} className="text-brand" />;
const COLOR_LABELS = Object.fromEntries(
  Object.keys(CARD_COLORS).map((k) => [k, k.charAt(0).toUpperCase() + k.slice(1)]),
);

const HINTS: Hints = {
  ...COMMON_HINTS,
  icon: { label: "Icon", optionIcon: iconPreview },
  color: { label: "Icon colour", optionLabels: COLOR_LABELS },
  text: { label: "Text" },
  label: { label: "Label" },
  photo: { label: "Photo (square, at least 400×400)" },
  name: { label: "Name" },
  role: { label: "Role" },
  linkLabel: { label: "Link text (empty = hidden)" },
  linkHref: { label: "Link (starts with /, # or https://; #apply opens the form)" },
  body2: { label: "Second paragraph (optional)" },
};

const TAB_HINTS: Partial<Record<Key, Hints>> = {
  seo: {
    title: { label: "Page title", help: "Shown as “title | RohTre Media”." },
    description: { label: "Meta description", help: "One or two sentences, up to 170 characters." },
  },
  hero: {
    title: { label: "Headline (H1)" },
    intro: { label: "Paragraph under the headline" },
    primaryLabel: { label: "First button text" },
    primaryHref: { label: "First button link (#apply opens the application form)" },
    hrLabel: { label: "WhatsApp HR button text (empty = hidden)", help: "Opens WhatsApp to the HR number in Settings." },
    image: {
      label: "Background photo (wide, about 2400×1000)",
      help: "Use the company’s own photos only. Fills the hero, stays still while the page scrolls, then fades.",
    },
    focusX: { label: "Where the subject is, desktop (0 = left, 100 = right)" },
    focusXMobile: { label: "Where the subject is, phones (0 = left, 100 = right)" },
  },
  strip: {
    items: {
      label: "Strip items",
      noun: ["item", "items"],
      itemHints: {
        logo_public_id: { label: "Logo (white artwork on transparent works best)" },
        value: { label: "Big text instead of a logo (e.g. 2Billion+)" },
        label: { label: "Label under it" },
      },
    },
  },
  blocks: {
    items: { label: "Blocks", noun: ["block", "blocks"] },
    eyebrow: { label: "Small label above the heading (optional)" },
    title: { label: "Heading" },
    body: { label: "Paragraph" },
    image: { label: "Photo (4:3, about 1440×1080)" },
    side: { label: "Photo side on desktop", optionLabels: { left: "Left", right: "Right" } },
  },
  benefits: { items: { label: "Cards", noun: ["card", "cards"] }, title: { label: "Heading" } },
  spotlights: {
    title: { label: "Heading" },
    items: { label: "People", noun: ["person", "people"], help: "Shown left to right in this order." },
    headline: { label: "Headline (e.g. Intern to team lead)" },
    story: { label: "Story", multiline: true },
  },
  values: {
    title: { label: "Heading" },
    subtitle: { label: "Second line (shown in red)" },
    items: { label: "Value cards", noun: ["card", "cards"] },
  },
  perks: { title: { label: "Heading" }, items: { label: "Benefit cards", noun: ["card", "cards"] } },
  faq: {
    title: { label: "Heading" },
    items: { label: "Questions", noun: ["question", "questions"] },
    q: { label: "Question" },
    a: { label: "Answer", multiline: true },
  },
  cta: {
    title: { label: "Heading" },
    accent: { label: "Heading, end (shown in red)" },
    text: { label: "Supporting line (optional)" },
    label: { label: "Button text (opens the application form)" },
    animated: {
      label: "Show animated objects",
      help: "Extra shapes and icons in the card that drift gently with the mouse. Off = the card’s basic shapes only.",
    },
  },
  form: {
    roles: { label: "Roles in the “Role” dropdown", noun: ["role", "roles"], help: "“Other” is always added at the end." },
    experience: { label: "Experience choices", noun: ["choice", "choices"] },
    success: { label: "Thank-you line after sending" },
  },
};

export function CareersEditor({ initial, schemas }: { initial: CareersContent; schemas: Record<string, JsonSchema> }) {
  const router = useRouter();
  const [saved, setSaved] = useState<CareersContent>(initial);
  const [data, setData] = useState<CareersContent>(initial);
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
    setData({ ...data, [tab]: v } as CareersContent);
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
          aria-label="Careers page sections"
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
                href={`/careers${current.anchor ? `#${current.anchor}` : ""}`}
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
        idle="Saved. Changes go live on the Careers page when you save."
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
              const res = await saveCareers(data);
              if (res.ok) {
                setErrors({});
                setDirty(false);
                setSaved(data);
                setMessage({ tone: "ok", text: "Saved. The Careers page is updated." });
                router.refresh();
              } else {
                setErrors(res.fieldErrors);
                setMessage({ tone: "error", text: res.error });
              }
            })
          }
        >
          Save Careers page
        </Button>
      </SaveBar>
    </div>
  );
}
