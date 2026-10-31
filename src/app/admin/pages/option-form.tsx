"use client";

import { useState, useTransition } from "react";
import { Button, Field, INPUT_CLASS } from "@/components/admin/ui";
import {
  headlineFor,
  nichePhrase,
  parseNicheWording,
  slugFor,
  slugPart,
  type DimensionValue,
} from "@/lib/dimensions";
import { addOption, renameOption, type OptionType } from "./option-actions";

// The small form behind "+ Add new …" and "Rename": name, URL text and how the
// option reads inside the headline, with a live preview of both.

type Picks = Record<OptionType, DimensionValue | null>;

const SAMPLE = (type: OptionType, slug: string, headline_label: string): DimensionValue => ({
  id: "",
  type_key: type,
  parent_id: null,
  slug,
  label: headline_label,
  headline_label,
  attrs: {},
});
const SAMPLES: Record<OptionType, DimensionValue> = {
  service: SAMPLE("service", "google-ads", "Google Ads"),
  niche: SAMPLE("niche", "clothing", "Clothing"),
  country: SAMPLE("country", "india", "India"),
};

const defaultWording = (type: OptionType, name: string) => (type === "niche" && name.trim() ? `${name.trim()} Brands` : name);

const WORDING_HINT: Record<OptionType, string> = {
  service: "How it reads in the headline, before “for”.",
  niche: "Keep “Brands” at the end, or remove it if it reads badly (for example “Schools”).",
  country: "How it reads after “in”. Add “the” if it needs it (for example “the USA”).",
};

export function OptionForm({
  type,
  picks,
  editing,
  onCancel,
  onSaved,
}: {
  type: OptionType;
  picks?: Picks;
  /** Rename this option; its URL text can't change. */
  editing?: DimensionValue;
  onCancel: () => void;
  onSaved: (option: DimensionValue) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(editing?.label ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [wording, setWording] = useState(
    editing ? (type === "niche" ? nichePhrase(editing) : editing.headline_label) : "",
  );
  const [slugEdited, setSlugEdited] = useState(false);
  const [wordingEdited, setWordingEdited] = useState(false);

  const draft: DimensionValue = {
    ...SAMPLES[type],
    slug: slug || "your-text",
    label: name,
    ...(type === "niche"
      ? (() => {
          const parsed = parseNicheWording(wording || "Your Niche Brands");
          return { headline_label: parsed.headline_label, attrs: { noBrands: parsed.noBrands } };
        })()
      : { headline_label: wording || "Your Wording" }),
  };
  const dims = {
    service: picks?.service ?? SAMPLES.service,
    niche: picks?.niche ?? SAMPLES.niche,
    country: picks?.country ?? SAMPLES.country,
    [type]: draft,
  };

  const save = () =>
    start(async () => {
      setError(null);
      if (editing) {
        const res = await renameOption(editing.id, { label: name, wording });
        if (res.ok) onSaved({ ...editing, label: name, ...draft, id: editing.id, slug: editing.slug, attrs: { ...editing.attrs, ...draft.attrs } });
        else setError(res.error);
        return;
      }
      const res = await addOption(type, { label: name, slug, wording });
      if (res.ok) onSaved(res.option);
      else setError(res.error);
    });

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-bg p-4">
      <p className="font-semibold">{editing ? `Rename ${editing.label}` : `Add new ${type}`}</p>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Name">
          <input
            value={name}
            maxLength={60}
            required
            autoFocus
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              if (!editing && !slugEdited) setSlug(slugPart(v));
              if (!editing && !wordingEdited) setWording(defaultWording(type, v));
            }}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="URL text" hint={editing ? "Stays the same, so existing pages keep their address." : undefined}>
          <input
            value={slug}
            maxLength={40}
            disabled={Boolean(editing)}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase());
              setSlugEdited(true);
            }}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Headline wording" hint={WORDING_HINT[type]}>
          <input
            value={wording}
            maxLength={48}
            onChange={(e) => {
              setWording(e.target.value);
              setWordingEdited(true);
            }}
            className={INPUT_CLASS}
          />
        </Field>
      </div>
      <div className="text-sm text-fg-2">
        <p className="break-all">URL: /lp/{slugFor(dims)}</p>
        <p>Headline: {headlineFor(dims)}</p>
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button variant="primary" disabled={pending || !name.trim()} onClick={save}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
