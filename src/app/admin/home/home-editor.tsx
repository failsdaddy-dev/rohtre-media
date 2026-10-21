"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { Button } from "@/components/admin/ui";
import type { HomeContent } from "@/content/home-schema";
import { saveHome } from "./actions";

// Home page editor (R23): one tab per section, the same generic form as the
// landing pages. Saving goes live straight away.

const LABELS: Record<string, string> = {
  hero: "Hero & slides",
  badges: "Badges",
  services: "Services",
  results: "Results",
  process: "Process",
  testimonials: "Testimonials",
  founder: "Founder",
  faq: "FAQ",
  finalCta: "Final call to action",
};

const HINTS: Hints = {
  slides: {
    label: "Slides (exactly two)",
    help: "Finished images with the text baked in. Each needs a desktop and a mobile crop and alt text (R14).",
  },
  desktop: { label: "Desktop image (about 1920×800)" },
  mobile: { label: "Mobile image (about 1080×1350)" },
  alt: { label: "Alt text" },
  href: { label: "Link when clicked (optional, starts with /)" },
  h1: { label: "Headline (H1), first line" },
  h1Accent: { label: "Headline, red second line" },
  accent: { label: "Red second line" },
  photo: { label: "Photo" },
  yearsExperience: { label: "Years as a digital consultant (leave empty until confirmed)" },
  icon: { label: "Icon" },
  tags: { label: "Tags" },
  status: { label: "Status", help: "Only “ready” answers show on the live site." },
  cta: { label: "Call to action" },
  enabled: { label: "Show this section" },
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
              {LABELS[k] ?? k}
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
