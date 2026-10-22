"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { Button } from "@/components/admin/ui";
import type { HomeContent } from "@/content/home-schema";
import { homeBlockers, SECTION_NAMES } from "@/lib/home-blockers";
import { saveHome } from "./actions";

// Home page editor (R23): one tab per section, the same generic form as the
// landing pages. Saving goes live straight away.

const HINTS: Hints = {
  slides: {
    label: "Slides (exactly two)",
    help: "Each slide needs a desktop and a mobile version (image with the text baked in, or a video) and alt text (R14).",
  },
  desktop: { label: "Desktop (12:5, about 1920×800)" },
  mobile: { label: "Mobile (4:5, about 1080×1350)" },
  href: { label: "Link when clicked (optional, starts with /)" },
  h1: { label: "Headline (H1), first line" },
  h1Accent: { label: "Headline, red second line" },
  accent: { label: "Red second line" },
  intro: { label: "Sub-heading" },
  photo: { label: "Photo" },
  yearsExperience: { label: "Years as a digital consultant (leave empty until confirmed)" },
  icon: { label: "Icon (shown when there is no logo)" },
  logos: {
    label: "Platform logos (optional)",
    help: "Official, unmodified logo files only (e.g. Shopify; Meta and Google). They mean “platforms we work with”, not a partnership.",
  },
  logo_public_id: { label: "Logo" },
  values: { label: "Values row" },
  media: { label: "Image or video" },
  phones: { label: "Phone videos (9:16)", help: "Shown inside phone frames." },
  phonesItem: { label: "Phone screen" },
  points: { label: "Points" },
  strapline: { label: "Strapline" },
  client: { label: "Client name" },
  metrics: {
    label: "Numbers (leave empty to hide)",
    help: "Only real, approved numbers. ROAS, sales and orders show as “x”, impressions as “M+”, the rest as “%”.",
  },
  roas: { label: "ROAS (x)" },
  sales: { label: "Sales (x)" },
  orders: { label: "Orders (x)" },
  impressions: { label: "Impressions (M+)" },
  lowerCpa: { label: "Lower CPA (%)" },
  conversionRate: { label: "Conversion rate (%)" },
  status: { label: "Status", help: "Only “ready” answers show on the live site." },
  cta: { label: "Call to action (Book a Call button + supporting line)" },
  enabled: { label: "Show this" },
};

export function HomeEditor({ initial, schemas }: { initial: HomeContent; schemas: Record<string, JsonSchema> }) {
  const router = useRouter();
  const [data, setData] = useState<HomeContent>(initial);
  const [tab, setTab] = useState<keyof HomeContent>("hero");
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const keys = Object.keys(schemas) as (keyof HomeContent)[];
  const blockers = homeBlockers(data);

  const tabErrors = (k: string) =>
    Object.fromEntries(
      Object.entries(errors)
        .filter(([p]) => p === k || p.startsWith(`${k}.`))
        .map(([p, v]) => [p.slice(k.length + 1), v]),
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {keys.map((k) => {
          const bad = Object.keys(errors).some((p) => p === k || p.startsWith(`${k}.`));
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-current={tab === k ? "page" : undefined}
              className={`h-9 shrink-0 rounded-lg px-3.5 text-sm font-medium ${
                tab === k
                  ? "bg-brand text-brand-fg"
                  : bad
                    ? "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)]"
                    : "bg-chip hover:bg-chip-hover"
              }`}
            >
              {SECTION_NAMES[k] ?? k}
            </button>
          );
        })}
      </div>
      <div className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
        <SchemaForm
          schema={schemas[tab]}
          value={data[tab]}
          onChange={(v) => {
            setData({ ...data, [tab]: v } as HomeContent);
            setDirty(true);
          }}
          hints={HINTS}
          errors={tabErrors(tab)}
        />
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
      <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-full border border-line bg-bg-elev p-2 pl-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]">
        <p role="status" className={`flex-1 text-sm ${message?.tone === "error" ? "text-danger" : ""}`}>
          {pending
            ? "Saving…"
            : (message?.text ?? (dirty ? "Unsaved changes" : "Changes go live on the home page when you save."))}
        </p>
        <Button
          variant="primary"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const res = await saveHome(data);
              if (res.ok) {
                setErrors({});
                setDirty(false);
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
      </div>
    </div>
  );
}
