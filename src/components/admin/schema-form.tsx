"use client";

import { useState } from "react";
import { ASPECT_LABELS, isGif, isPhoneAspect, type Aspect, type MediaSlotValue } from "@/content/media-slot";
import { cloudinaryUrl, stillUrl } from "@/lib/cloudinary/url";
import { MediaField } from "./media-field";
import { MediaSlotField } from "./media-slot-field";
import { Select } from "./select";

// A form drawn from a JSON Schema (made from the Zod schemas with
// z.toJSONSchema on the server). Every section type and proof record gets
// its editor this way, so adding a section type needs no new admin form.
//   string           → text box (long limits → text area)
//   string enum      → dropdown
//   number / integer → number box
//   boolean          → switch
//   {publicId,…}     → image/video upload (MediaField)
//   media slot       → image-or-video slot editor (MediaSlotField)
//   *_public_id      → image/video upload storing the id string
//   object           → group of fields
//   array            → compact list: one row per item (thumbnail, title,
//                      shown/hidden switch when the item has `enabled`,
//                      up/down, duplicate, delete with a confirm click);
//                      a row opens to edit, one at a time; "+ Add" on top
//                      with the count. Lists of plain text stay inline.
// The server validates everything again with Zod when saving.

export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema[];
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  format?: string;
  default?: unknown;
};

export type FieldHint = {
  label?: string;
  help?: string;
  /** For *_public_id or media fields. */
  kind?: "image" | "video";
  /** Multi-select from a list instead of free text (e.g. badge ids). */
  options?: { value: string; label: string }[];
  hidden?: boolean;
  multiline?: boolean;
  /** Names for a dropdown's stored values (the value itself never changes). */
  optionLabels?: Record<string, string>;
  /** Lists: what one item is called, singular and plural ("phone", "phones"). */
  noun?: [string, string];
  /** Media slots: the admin calls the shape "Screen shape" and explains Fill/Fit. */
  phone?: boolean;
  /** Media slots: show the chosen shape in the box title, e.g. "Video (4:3)". */
  showShape?: boolean;
  /** Lists: labels for the fields inside each item (win over the page's hints there). */
  itemHints?: Hints;
  /** Dropdowns: a small icon or preview per option (e.g. the icon pickers). */
  optionIcon?: (value: string) => React.ReactNode;
};
export type Hints = Record<string, FieldHint>;

/**
 * Plain-language labels for keys used across many forms (each page's own
 * hints win). Field keys never change, only what the editor reads.
 */
export const COMMON_HINTS: Hints = {
  enabled: { label: "Show this", help: "Untick to hide it on the live site (nothing is deleted)." },
  eyebrow: { label: "Small label above the heading", help: "A few words, shown in red capitals." },
  title: { label: "Heading", help: "The section’s main line." },
  accent: { label: "Second line (shown in red)", help: "Continues the heading in the red gradient." },
  subline: { label: "Short line under the heading" },
  intro: { label: "Short intro under the heading", help: "One or two sentences." },
  body: { label: "Paragraph" },
  cta: { label: "Button at the end of the section", help: "The Book a Call button and the small line under it." },
  notes: { label: "Internal notes (never shown)" },
};
const INPUT = "rm-field w-full px-3.5 py-2.5 text-[15px] outline-none";

export const humanize = (key: string) =>
  key
    .replace(/_public_id$/, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

function nonNull(schema: JsonSchema): { schema: JsonSchema; nullable: boolean } {
  if (schema.anyOf) {
    const rest = schema.anyOf.filter((s) => s.type !== "null");
    return { schema: rest[0] ?? {}, nullable: rest.length < schema.anyOf.length };
  }
  if (Array.isArray(schema.type)) {
    return {
      schema: { ...schema, type: schema.type.find((t) => t !== "null") },
      nullable: schema.type.includes("null"),
    };
  }
  return { schema, nullable: false };
}

const isMediaObject = (s: JsonSchema) => Boolean(s.properties?.publicId && s.properties?.width && s.properties?.height);
/** An image-or-video slot (src/content/media-slot.ts). */
const isMediaSlot = (s: JsonSchema) =>
  Boolean(s.properties?.publicId && s.properties?.aspect && s.properties?.loop && s.properties?.type);

/** A blank value for a schema (used when adding a list item). */
export function blankFor(schema: JsonSchema): unknown {
  const { schema: s, nullable } = nonNull(schema);
  if (s.default !== undefined) return structuredClone(s.default);
  if (nullable) return null;
  if (s.enum) return s.enum[0];
  switch (s.type) {
    case "string":
      return "";
    case "number":
    case "integer":
      return s.minimum ?? 0;
    case "boolean":
      return false;
    case "array":
      return [];
    case "object":
      return Object.fromEntries(Object.entries(s.properties ?? {}).map(([k, v]) => [k, blankFor(v)]));
    default:
      return null;
  }
}

type FieldProps = {
  name: string;
  schema: JsonSchema;
  value: unknown;
  onChange: (v: unknown) => void;
  hints: Hints;
  errors: Record<string, string>;
  path: string;
};

function Field({ name, schema: raw, value, onChange, hints, errors, path }: FieldProps) {
  const hint = hints[name] ?? {};
  if (hint.hidden) return null;
  const { schema, nullable } = nonNull(raw);
  const label = hint.label ?? humanize(name);
  const err = errors[path];
  const help = hint.help && <span className="text-xs text-fg-2">{hint.help}</span>;
  const error = err && <span className="text-xs font-medium text-danger">{err}</span>;

  if (isMediaSlot(schema)) {
    return (
      <div className="flex flex-col gap-1">
        <MediaSlotField
          label={label}
          value={value as MediaSlotValue}
          onChange={onChange}
          error={err}
          altError={errors[`${path}.alt`]}
          aspects={schema.properties?.aspect?.enum as Aspect[] | undefined}
          phone={hint.phone || Boolean((schema.properties?.aspect?.enum as string[] | undefined)?.every(isPhoneAspect))}
          showShape={hint.showShape}
        />
        {help}
      </div>
    );
  }
  if (isMediaObject(schema)) {
    return (
      <div className="flex flex-col gap-1">
        <MediaField label={label} kind={hint.kind ?? "image"} value={(value as never) ?? null} onChange={onChange} />
        {help}
        {error}
      </div>
    );
  }
  if (name.endsWith("_public_id")) {
    return (
      <div className="flex flex-col gap-1">
        <MediaField
          label={label}
          kind={hint.kind ?? "image"}
          asString
          value={(value as string) ?? null}
          onChange={onChange}
        />
        {help}
        {error}
      </div>
    );
  }
  if (schema.type === "array" && hint.options) {
    const chosen = new Set((value as string[]) ?? []);
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{label}</legend>
        {hint.options.length === 0 && <span className="text-sm text-fg-2">Nothing to choose yet.</span>}
        {hint.options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-[var(--brand)]"
              checked={chosen.has(o.value)}
              onChange={(e) => {
                const next = new Set(chosen);
                if (e.target.checked) next.add(o.value);
                else next.delete(o.value);
                onChange([...next]);
              }}
            />
            {o.label}
          </label>
        ))}
        {help}
        {error}
      </fieldset>
    );
  }
  if (schema.type === "array" && schema.items) {
    return (
      <ListField
        name={name}
        label={label}
        schema={schema}
        list={(value as unknown[]) ?? []}
        onChange={onChange}
        hints={hints}
        errors={errors}
        path={path}
        help={help}
        error={error}
      />
    );
  }
  if (schema.type === "object" && schema.properties) {
    const obj = (value as Record<string, unknown>) ?? {};
    const inner = (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(schema.properties).map(([k, sub]) => {
          const wide =
            nonNull(sub).schema.type === "array" ||
            nonNull(sub).schema.type === "object" ||
            (nonNull(sub).schema.maxLength ?? 0) > 160;
          return (
            <div key={k} className={wide ? "md:col-span-2" : ""}>
              <Field
                name={k}
                schema={sub}
                value={obj[k]}
                onChange={(v) => onChange({ ...obj, [k]: v })}
                hints={hints}
                errors={errors}
                path={path ? `${path}.${k}` : k}
              />
            </div>
          );
        })}
      </div>
    );
    if (name.endsWith("Item") || !path) return inner;
    return (
      <fieldset className="rounded-2xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold">{label}</legend>
        {nullable && value === null ? (
          <button type="button" className="text-sm underline" onClick={() => onChange(blankFor({ ...schema }))}>
            Add
          </button>
        ) : (
          inner
        )}
        {error}
      </fieldset>
    );
  }
  if (schema.type === "boolean") {
    return (
      <label className="flex items-center gap-2.5 pt-6 text-sm font-medium">
        <input
          type="checkbox"
          role="switch"
          className="size-4 accent-[var(--brand)]"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
        {error}
      </label>
    );
  }
  if (schema.enum) {
    return (
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">{label}</span>
        <Select
          value={String(value ?? "")}
          onChange={onChange}
          invalid={Boolean(err)}
          options={schema.enum.map((o) => ({
            value: String(o),
            label: hint.optionLabels?.[String(o)] ?? humanize(String(o)),
            icon: hint.optionIcon?.(String(o)),
          }))}
        />
        {help}
        {error}
      </label>
    );
  }
  if (schema.type === "number" || schema.type === "integer") {
    return (
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">{label}</span>
        <input
          type="number"
          className={INPUT}
          min={schema.minimum}
          max={schema.maximum}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? (nullable ? null : 0) : Number(e.target.value))}
        />
        {help}
        {error}
      </label>
    );
  }
  // string
  const long = hint.multiline || (schema.maxLength ?? 0) > 160;
  const str = (value as string | null) ?? "";
  const set = (v: string) => onChange(nullable && v === "" ? null : v);
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-baseline justify-between gap-2 font-semibold">
        {label}
        {schema.maxLength && schema.maxLength < 100000 && (
          <span className="text-xs font-normal text-fg-2">
            {str.length}/{schema.maxLength}
          </span>
        )}
      </span>
      {long ? (
        <textarea
          className={`${INPUT} min-h-24 ${name === "html" ? "min-h-64 font-mono text-[13px]" : ""}`}
          maxLength={schema.maxLength}
          value={str}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <input className={INPUT} maxLength={schema.maxLength} value={str} onChange={(e) => set(e.target.value)} />
      )}
      {help}
      {error}
    </label>
  );
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => Boolean(v && typeof v === "object" && !Array.isArray(v));
const isSlotValue = (v: unknown): v is MediaSlotValue => isObj(v) && "aspect" in v && "publicId" in v && "loop" in v;

/** A small preview for a list row: the item's first image, video still or logo. */
function thumbFor(item: unknown): string | null {
  const slot = isSlotValue(item)
    ? item
    : isObj(item)
      ? (Object.values(item).find((v) => isSlotValue(v) && v.publicId) as MediaSlotValue | undefined)
      : undefined;
  if (slot?.publicId) {
    if (slot.type === "video")
      return slot.poster ? cloudinaryUrl(slot.poster, { width: 96 }) : stillUrl(slot.publicId, { width: 96 });
    return isGif(slot)
      ? stillUrl(slot.publicId, { width: 96, gif: true })
      : cloudinaryUrl(slot.publicId, { width: 96 });
  }
  if (!isObj(item)) return null;
  const id = Object.entries(item).find(([k, v]) => k.endsWith("_public_id") && typeof v === "string" && v)?.[1];
  if (typeof id === "string") return cloudinaryUrl(id, { width: 96 });
  const photo = item.photo;
  return isObj(photo) && typeof photo.publicId === "string" ? cloudinaryUrl(photo.publicId, { width: 96 }) : null;
}

const TITLE_KEYS = ["title", "brand", "label", "name", "q", "action", "person_name"];
const SHAPE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(ASPECT_LABELS).map(([a, l]) => [a, a === "9:19.5" ? "modern phone" : l.toLowerCase()]),
);

/** A short title for a list row. */
export function itemTitle(item: unknown, noun: string, i: number): string {
  const n = `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${i + 1}`;
  if (isSlotValue(item))
    return `${n} · ${item.type === "video" ? "video" : "image"} · ${SHAPE_NAMES[item.aspect] ?? item.aspect}${item.publicId ? "" : " · empty"}`;
  if (isObj(item)) {
    const key = TITLE_KEYS.find((k) => typeof item[k] === "string" && (item[k] as string).trim());
    if (key) return `${n} · ${(item[key] as string).trim()}`;
  }
  return n;
}

const singular = (word: string) => (word.endsWith("ies") ? `${word.slice(0, -3)}y` : word.replace(/s$/, ""));

/** The compact list editor (see the top of this file). */
function ListField({
  name,
  label,
  schema,
  list,
  onChange,
  hints,
  errors,
  path,
  help,
  error,
}: {
  name: string;
  label: string;
  schema: JsonSchema;
  list: unknown[];
  onChange: (v: unknown) => void;
  hints: Hints;
  errors: Record<string, string>;
  path: string;
  help: React.ReactNode;
  error: React.ReactNode;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const hint = hints[name] ?? {};
  const inner = hint.itemHints ? { ...hints, ...hint.itemHints } : hints;
  const words = humanize(name).toLowerCase();
  const [one, many] = hint.noun ?? [singular(words), words];
  const max = schema.maxItems ?? Infinity;
  const item = nonNull(schema.items!).schema;
  const simple = item.type !== "object";
  const toggle = Boolean(item.properties?.enabled && nonNull(item.properties.enabled).schema.type === "boolean");
  const bad = (i: number) => Object.keys(errors).some((p) => p === `${path}.${i}` || p.startsWith(`${path}.${i}.`));

  const set = (next: unknown[]) => {
    setConfirm(null);
    onChange(next);
  };
  const move = (i: number, d: number) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set(next);
    if (open === i) setOpen(i + d);
    else if (open === i + d) setOpen(i);
  };
  const add = () => {
    set([...list, blankFor(schema.items!)]);
    setOpen(list.length);
  };
  const remove = (i: number) => {
    if (confirm !== i) return setConfirm(i);
    set(list.filter((_, j) => j !== i));
    setOpen(open === i ? null : open !== null && open > i ? open - 1 : open);
  };
  const controls = (i: number, x: unknown) => (
    <span className="flex shrink-0 items-center gap-1">
      {toggle && isObj(x) && (
        <label className="mr-1 flex min-h-9 items-center gap-1.5 text-xs font-semibold">
          <input
            type="checkbox"
            role="switch"
            className="size-4 accent-[var(--brand)]"
            checked={Boolean(x.enabled)}
            onChange={(e) => set(list.map((y, j) => (j === i ? { ...x, enabled: e.target.checked } : y)))}
          />
          <span className="max-sm:sr-only">{x.enabled ? "Shown" : "Hidden"}</span>
        </label>
      )}
      <SmallButton disabled={i === 0} onClick={() => move(i, -1)} label={`Move ${one} ${i + 1} up`}>
        ↑
      </SmallButton>
      <SmallButton disabled={i === list.length - 1} onClick={() => move(i, 1)} label={`Move ${one} ${i + 1} down`}>
        ↓
      </SmallButton>
      {list.length < max && (
        <SmallButton
          onClick={() => {
            set([...list.slice(0, i + 1), structuredClone(x), ...list.slice(i + 1)]);
            setOpen(i + 1);
          }}
          label={`Duplicate ${one} ${i + 1}`}
        >
          ⧉
        </SmallButton>
      )}
      {confirm === i ? (
        <button
          type="button"
          autoFocus
          onClick={() => remove(i)}
          onBlur={() => setConfirm(null)}
          className="h-9 rounded-full bg-brand px-3 text-xs font-bold text-brand-fg"
        >
          Delete?
        </button>
      ) : (
        <SmallButton onClick={() => remove(i)} label={`Delete ${one} ${i + 1}`}>
          ✕
        </SmallButton>
      )}
    </span>
  );

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1 flex w-full flex-wrap items-center justify-between gap-2 text-sm font-semibold">
        <span>
          {label}{" "}
          <span className="font-normal text-fg-2">
            ({list.length} {list.length === 1 ? one : many})
          </span>
        </span>
        {list.length < max && (
          <button
            type="button"
            onClick={add}
            className="min-h-9 rounded-full bg-chip px-4 py-1.5 text-sm font-semibold hover:bg-chip-hover"
          >
            + Add {one}
          </button>
        )}
      </legend>
      {help}
      {list.length === 0 && <p className="text-sm text-fg-2">Nothing here yet.</p>}
      {simple ? (
        <ul className="flex flex-col gap-2">
          {list.map((x, i) =>
            nonNull(schema.items!).schema.type === "string" && !nonNull(schema.items!).schema.enum ? (
              // A plain text item: one row with its number, the text box and the buttons (no label line).
              <li key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-bg py-1.5 pl-2 pr-1.5">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-chip text-xs font-bold text-fg-2"
                  >
                    {i + 1}
                  </span>
                  <input
                    className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                    aria-label={`${one.charAt(0).toUpperCase()}${one.slice(1)} ${i + 1}`}
                    maxLength={nonNull(schema.items!).schema.maxLength}
                    value={(x as string) ?? ""}
                    onChange={(e) => set(list.map((y, j) => (j === i ? e.target.value : y)))}
                  />
                  {controls(i, x)}
                </div>
                {errors[`${path}.${i}`] && (
                  <span className="pl-12 text-xs font-medium text-danger">{errors[`${path}.${i}`]}</span>
                )}
              </li>
            ) : (
            <li key={i} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Field
                  name={`${name}Item`}
                  schema={schema.items!}
                  value={x}
                  onChange={(v) => set(list.map((y, j) => (j === i ? v : y)))}
                  hints={{ ...inner, [`${name}Item`]: { label: `${one} ${i + 1}`, ...hints[`${name}Item`] } }}
                  errors={errors}
                  path={`${path}.${i}`}
                />
              </div>
              <span className="pb-1">{controls(i, x)}</span>
            </li>
            ),
          )}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((x, i) => {
            const thumb = thumbFor(x);
            const expanded = open === i;
            return (
              <li
                key={i}
                className={`min-w-0 rounded-2xl border bg-bg ${bad(i) ? "border-danger" : expanded ? "border-fg-2" : "border-line"}`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 p-2 pl-2.5">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : i)}
                    className="flex min-h-12 min-w-0 flex-1 basis-56 items-center gap-3 rounded-xl text-left"
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail straight from Cloudinary
                      <img
                        src={thumb}
                        alt=""
                        className="size-11 shrink-0 rounded-lg border border-line bg-chip object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="grid size-11 shrink-0 place-items-center rounded-lg bg-chip text-sm font-semibold text-fg-2"
                      >
                        {i + 1}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{itemTitle(x, one, i)}</span>
                    <span
                      aria-hidden="true"
                      className={`text-fg-2 transition-transform ${expanded ? "rotate-180" : ""}`}
                    >
                      ▾
                    </span>
                  </button>
                  {controls(i, x)}
                </div>
                {expanded && (
                  <div className="border-t border-line p-4">
                    <Field
                      name={`${name}Item`}
                      schema={schema.items!}
                      value={x}
                      onChange={(v) => set(list.map((y, j) => (j === i ? v : y)))}
                      hints={toggle ? { ...inner, enabled: { hidden: true } } : inner}
                      errors={errors}
                      path={`${path}.${i}`}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error}
    </fieldset>
  );
}

function SmallButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full bg-chip text-sm hover:bg-chip-hover disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** The whole form for one object schema. */
export function SchemaForm({
  schema,
  value,
  onChange,
  hints = {},
  errors = {},
  path = "",
}: {
  schema: JsonSchema;
  value: unknown;
  onChange: (v: unknown) => void;
  hints?: Hints;
  errors?: Record<string, string>;
  path?: string;
}) {
  return (
    <Field name="root" schema={schema} value={value} onChange={onChange} hints={hints} errors={errors} path={path} />
  );
}
