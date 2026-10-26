"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { COMMON_HINTS, SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { Button, Field, INPUT_CLASS } from "@/components/admin/ui";
import { cloudinaryUrl } from "@/lib/cloudinary/url";
import {
  blankBrand,
  brandDataOf,
  RESERVED_SLUGS,
  slugify,
  SLUG_RE,
  type Brand,
  type BrandData,
} from "@/content/work-schema";
import { deleteBrand, importLiveBrands, moveBrand, saveBrand } from "./actions";
import { PIC_HINTS, STAT_HINTS } from "./hints";

// Admin → Work page → Brands: every brand (logo, name, slug, published),
// reorder with the arrows, edit, delete (asks first) and "Add brand".
// The brand form: name (the slug is made from it while the brand is new and
// can be edited before the first save), logo, card line, hero, description,
// numbers, the story cards, gallery, video slots, published switch, SEO.
// A published brand's slug is locked; unpublish and save to change it (the
// old address then returns 404). Saving goes live at once.

const HINTS: Hints = {
  ...COMMON_HINTS,
  ...PIC_HINTS,
  logo: { label: "Logo (square, at least 480×480)", help: "Shown on a white tile. No logo = the brand name in text." },
  overview: { label: "Card line", help: "The one line on the /work card (cut to 3 lines there)." },
  eyebrow: { label: "Small label above the headline (red capitals)" },
  headline: { label: "Headline (H1)" },
  description: {
    label: "Description",
    noun: ["paragraph", "paragraphs"],
    help: "Under the headline: one or more paragraphs. (In SEO: the meta description.)",
  },
  buttons: { label: "Buttons", noun: ["button", "buttons"], help: "Up to two. The first is red." },
  href: { label: "Link (starts with /, # or https://)" },
  metrics: {
    label: "Numbers (red strip)",
    noun: ["number", "numbers"],
    help: "Empty = no red strip on this brand's page.",
    itemHints: STAT_HINTS,
  },
  sections: {
    label: "Story cards",
    noun: ["card", "cards"],
    help: "THE COMPANY, THE CHALLENGE, ... as white cards.",
    itemHints: {
      label: { label: "Label (red capitals)" },
      lead: { label: "Opening line (bold)" },
      paragraphs: { label: "Paragraphs", noun: ["paragraph", "paragraphs"] },
      bullets: { label: "Bullet points", noun: ["point", "points"] },
    },
  },
  gallery: { label: "Images", noun: ["image", "images"], help: "Sharp white frames, in this order." },
  videos: {
    label: "Video or image slots",
    noun: ["slot", "slots"],
    help: "Each plays with controls when clicked (never autoplays with sound). Empty slots are hidden on the live site.",
  },
  seo: { label: "SEO" },
  title: { label: "Page title", help: "Shown as “title | RohTre Media”." },
};

const slugError = (slug: string, taken: Set<string>): string | null => {
  if (!slug) return "Enter a slug.";
  if (!SLUG_RE.test(slug)) return "Use lowercase letters, numbers and single hyphens only.";
  if (RESERVED_SLUGS.includes(slug)) return `“${slug}” is reserved. Choose another slug.`;
  if (taken.has(slug)) return `Another brand already uses “${slug}”.`;
  return null;
};

type Draft = {
  id: string | null;
  slug: string;
  published: boolean;
  data: BrandData;
  locked: boolean;
  slugTouched: boolean;
};

const toDraft = (b: Brand): Draft => ({
  id: b.id,
  slug: b.slug,
  published: b.published,
  data: brandDataOf(b),
  locked: b.published,
  slugTouched: true,
});

function Thumb({ b }: { b: Brand }) {
  const src = b.logo.media.publicId ? cloudinaryUrl(b.logo.media.publicId, { width: 96 }) : b.logo.src;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- a 48 px admin thumbnail
    <img
      src={src}
      alt=""
      width={48}
      height={48}
      className="size-12 shrink-0 border border-line bg-white object-contain"
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid size-12 shrink-0 place-items-center border border-line bg-white text-xs font-bold"
    >
      {b.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function BrandsManager({ initial, schema }: { initial: Brand[] | null; schema: JsonSchema }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (initial === null)
    return (
      <div className="rounded-[18px] border border-line bg-bg-elev p-5 text-sm sm:p-6">
        <p className="font-semibold">The brands table isn’t set up yet.</p>
        <p className="mt-2 text-fg-2">
          Until it is, /work shows the ten brands copied from the live site. Apply the work_brands migration (see the
          commands you were given), then come back here to add the ten brands with one click and edit them.
        </p>
      </div>
    );

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        setMessage({ tone: "ok", text: ok });
        after?.();
        router.refresh();
      } else setMessage({ tone: "error", text: res.error ?? "Something went wrong." });
    });

  // ------------------------------------------------------------ brand form
  if (draft) {
    const taken = new Set(initial.filter((b) => b.id !== draft.id).map((b) => b.slug));
    const sErr = draft.locked ? null : slugError(draft.slug, taken);
    const set = (patch: Partial<Draft>) => {
      setDraft({ ...draft, ...patch });
      setMessage(null);
    };
    const restSchema = Object.fromEntries(Object.entries(schema.properties ?? {}).filter(([k]) => k !== "name"));
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
          <h3 className="text-lg font-bold">{draft.id ? `Edit ${draft.data.name || "brand"}` : "Add brand"}</h3>
          <Button
            onClick={() => {
              setDraft(null);
              setErrors({});
              setMessage(null);
            }}
          >
            ← Back to all brands
          </Button>
        </div>

        <div className="grid gap-4 rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6 md:grid-cols-2">
          <Field label="Brand name" error={errors.name}>
            <input
              className={INPUT_CLASS}
              maxLength={60}
              value={draft.data.name}
              onChange={(e) => {
                const name = e.target.value;
                set({
                  data: {
                    ...draft.data,
                    name,
                    seo: draft.id ? draft.data.seo : { ...draft.data.seo, title: name.slice(0, 70) },
                  },
                  slug: draft.locked || draft.slugTouched ? draft.slug : slugify(name),
                });
              }}
            />
          </Field>
          <Field
            label="Slug (the page address)"
            error={errors.slug ?? sErr ?? undefined}
            hint={
              draft.locked
                ? `Locked while published: /work/${draft.slug}. To change it, untick Published and save first (the old address then shows “not found”).`
                : `The page will be /work/${draft.slug || "…"}. Made from the name; you can edit it before saving.`
            }
          >
            <input
              className={INPUT_CLASS}
              maxLength={60}
              value={draft.slug}
              disabled={draft.locked}
              onChange={(e) => set({ slug: e.target.value.toLowerCase(), slugTouched: true })}
            />
          </Field>
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold md:col-span-2">
            <input
              type="checkbox"
              role="switch"
              className="size-5 accent-[var(--brand)]"
              checked={draft.published}
              onChange={(e) => set({ published: e.target.checked, locked: e.target.checked ? draft.locked : false })}
            />
            Published (shown on /work and at its own address)
          </label>
        </div>

        <div className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
          <SchemaForm
            schema={{ ...schema, properties: restSchema }}
            value={draft.data}
            onChange={(v) => set({ data: { ...(v as BrandData), name: draft.data.name } })}
            hints={HINTS}
            errors={errors}
          />
        </div>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-full border border-line bg-bg-elev px-4 py-2 shadow-lg">
          <p role="status" className={`text-sm ${message?.tone === "error" ? "text-danger" : "text-fg-2"}`}>
            {message?.text ??
              (draft.published ? "Saving makes this brand live at once." : "Unpublished: hidden on the site.")}
          </p>
          <Button
            variant="primary"
            disabled={pending || Boolean(sErr) || !draft.data.name.trim()}
            onClick={() =>
              start(async () => {
                const res = await saveBrand({
                  id: draft.id,
                  slug: draft.slug,
                  published: draft.published,
                  data: draft.data,
                });
                if (res.ok) {
                  setErrors({});
                  setDraft({ ...draft, id: res.id ?? draft.id, locked: draft.published, slugTouched: true });
                  setMessage({
                    tone: "ok",
                    text: draft.published ? `Saved. Live at /work/${draft.slug}.` : "Saved (unpublished).",
                  });
                  router.refresh();
                } else {
                  setErrors(res.fieldErrors);
                  setMessage({ tone: "error", text: res.error });
                }
              })
            }
          >
            {pending ? "Saving…" : "Save brand"}
          </Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ brand list
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
        <p className="text-sm text-fg-2">
          {initial.length} brand{initial.length === 1 ? "" : "s"}, shown on /work in this order.
        </p>
        <div className="flex flex-wrap gap-2">
          {initial.length === 0 && (
            <Button
              disabled={pending}
              onClick={() => run(importLiveBrands, "The ten brands from the live site are added.")}
            >
              Add the ten live brands
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => {
              setErrors({});
              setMessage(null);
              setDraft({ id: null, slug: "", published: false, data: blankBrand(), locked: false, slugTouched: false });
            }}
          >
            + Add brand
          </Button>
        </div>
      </div>
      {message && (
        <p role="status" className={`text-sm ${message.tone === "error" ? "text-danger" : "text-fg-2"}`}>
          {message.text}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {initial.map((b, i) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center gap-3 rounded-[18px] border border-line bg-bg-elev p-3 sm:p-4"
          >
            <Thumb b={b} />
            <div className="min-w-0 flex-1 basis-48">
              <p className="truncate font-semibold">{b.name || "(no name)"}</p>
              <p className="truncate text-xs text-fg-2">/work/{b.slug}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.published ? "bg-[#e7f6ec] text-[#14632f]" : "bg-chip text-fg-2"}`}
            >
              {b.published ? "Published" : "Hidden"}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="ghost"
                aria-label={`Move ${b.name} up`}
                disabled={pending || i === 0}
                onClick={() => run(() => moveBrand(b.id, -1), "Order saved.")}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                aria-label={`Move ${b.name} down`}
                disabled={pending || i === initial.length - 1}
                onClick={() => run(() => moveBrand(b.id, 1), "Order saved.")}
              >
                ↓
              </Button>
              <Button
                onClick={() => {
                  setErrors({});
                  setMessage(null);
                  setDraft(toDraft(b));
                }}
              >
                Edit
              </Button>
              {confirm === b.id ? (
                <>
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => deleteBrand(b.id),
                        `${b.name} deleted.`,
                        () => setConfirm(null),
                      )
                    }
                  >
                    Delete for good
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirm(null)}>
                    Keep
                  </Button>
                </>
              ) : (
                <Button variant="ghost" onClick={() => setConfirm(b.id)}>
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
