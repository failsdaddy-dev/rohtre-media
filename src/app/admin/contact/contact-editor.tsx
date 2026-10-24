"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { COMMON_HINTS, SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { SaveBar } from "@/components/admin/save-bar";
import { Select } from "@/components/admin/select";
import { Button } from "@/components/admin/ui";
import { ServiceIcon } from "@/components/icons";
import type { ContactContent } from "@/content/contact-schema";
import { saveContact } from "./actions";

// Contact page editor. Same pattern as the Careers editor: a rail of the
// page's parts (a dropdown below 1024 px), the chosen part's fields from the
// generic schema form, and the save bar. Saving goes live straight away.
// Enquiries arrive in Admin → Leads (and by email to sales).

type Key = keyof ContactContent;

const SECTIONS: { key: Key; name: string; icon: string; anchor: string; about: string }[] = [
  { key: "hero", name: "Heading", icon: "sparkles", anchor: "", about: "The small label, the heading (its end in red) and the line under it." },
  { key: "form", name: "Form", icon: "briefcase", anchor: "enquiry", about: "The form’s title, the Careers line, the dropdown and chip choices, the button and the thank-you message." },
  { key: "steps", name: "What happens next", icon: "trend", anchor: "next-steps", about: "The numbered steps beside the form. Don’t promise a reply time unless it’s confirmed." },
  { key: "details", name: "Contact details", icon: "users", anchor: "reach-us", about: "The heading of the details card. The email, phones and address come from Settings." },
  { key: "seo", name: "SEO", icon: "eye", anchor: "", about: "The page title in the browser tab and search results, and the meta description." },
];

const HINTS: Hints = {
  ...COMMON_HINTS,
  title: { label: "Heading" },
  text: { label: "Text under it (optional)" },
};

const TAB_HINTS: Partial<Record<Key, Hints>> = {
  seo: {
    title: { label: "Page title", help: "Shown as “title | RohTre Media”." },
    description: { label: "Meta description", help: "One or two sentences, up to 170 characters." },
  },
  hero: {
    eyebrow: { label: "Small label above the heading" },
    title: { label: "Heading (H1)" },
    accent: { label: "Heading, end (shown in red)" },
    intro: { label: "Line under the heading" },
  },
  steps: {
    title: { label: "Panel heading" },
    items: { label: "Steps", noun: ["step", "steps"], help: "Shown numbered, in this order." },
    step: { label: "Step" },
  },
  form: {
    title: { label: "Form title" },
    qualifier: { label: "Line for job seekers (empty = hidden)" },
    qualifierLinkLabel: { label: "Link text" },
    qualifierHref: { label: "Link (starts with /, # or https://)" },
    businessTypes: { label: "“Business type” choices", noun: ["choice", "choices"] },
    adSpend: { label: "“Monthly ad spend” choices", noun: ["range", "ranges"] },
    interests: { label: "“Interested in” chips", noun: ["chip", "chips"] },
    submitLabel: { label: "Button text" },
    thanksTitle: { label: "Thank-you heading" },
    thanksText: { label: "Thank-you message", help: "Don’t say anyone has already been contacted." },
    whatsappLabel: { label: "WhatsApp link text after sending (empty = hidden)", help: "Opens the WhatsApp number in Settings." },
  },
  details: { title: { label: "Card heading" } },
};

export function ContactEditor({ initial, schemas }: { initial: ContactContent; schemas: Record<string, JsonSchema> }) {
  const router = useRouter();
  const [saved, setSaved] = useState<ContactContent>(initial);
  const [data, setData] = useState<ContactContent>(initial);
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
    setData({ ...data, [tab]: v } as ContactContent);
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
          aria-label="Contact page sections"
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
                href={`/contact${current.anchor ? `#${current.anchor}` : ""}`}
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
        idle="Saved. Changes go live on the Contact page when you save."
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
              const res = await saveContact(data);
              if (res.ok) {
                setErrors({});
                setDirty(false);
                setSaved(data);
                setMessage({ tone: "ok", text: "Saved. The Contact page is updated." });
                router.refresh();
              } else {
                setErrors(res.fieldErrors);
                setMessage({ tone: "error", text: res.error });
              }
            })
          }
        >
          Save Contact page
        </Button>
      </SaveBar>
    </div>
  );
}
