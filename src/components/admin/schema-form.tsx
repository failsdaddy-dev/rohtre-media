"use client";

import { MediaField } from "./media-field";
import { SELECT_CLASS } from "./ui";

// A form drawn from a JSON Schema (made from the Zod schemas with
// z.toJSONSchema on the server). Every section type and proof record gets
// its editor this way, so adding a section type needs no new admin form.
//   string           → text box (long limits → text area)
//   string enum      → dropdown
//   number / integer → number box
//   boolean          → switch
//   {publicId,…}     → image/video upload (MediaField)
//   *_public_id      → image/video upload storing the id string
//   object           → group of fields
//   array            → repeatable list (add, remove, move)
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
};
export type Hints = Record<string, FieldHint>;

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
    const list = (value as unknown[]) ?? [];
    const max = schema.maxItems ?? Infinity;
    const move = (i: number, d: number) => {
      const next = [...list];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      onChange(next);
    };
    return (
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">{label}</legend>
        {list.map((item, i) => (
          <div key={i} className="rounded-2xl border border-line bg-bg p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-fg-2">
                {humanize(name).replace(/s$/, "")} {i + 1}
              </span>
              <span className="flex gap-1">
                <SmallButton disabled={i === 0} onClick={() => move(i, -1)} label="Move up">
                  ↑
                </SmallButton>
                <SmallButton disabled={i === list.length - 1} onClick={() => move(i, 1)} label="Move down">
                  ↓
                </SmallButton>
                <SmallButton onClick={() => onChange(list.filter((_, j) => j !== i))} label="Remove">
                  ✕
                </SmallButton>
              </span>
            </div>
            <Field
              name={`${name}Item`}
              schema={schema.items!}
              value={item}
              onChange={(v) => onChange(list.map((x, j) => (j === i ? v : x)))}
              hints={hints}
              errors={errors}
              path={`${path}.${i}`}
            />
          </div>
        ))}
        {list.length < max && (
          <button
            type="button"
            onClick={() => onChange([...list, blankFor(schema.items!)])}
            className="self-start rounded-full bg-chip px-4 py-2 text-sm font-semibold hover:bg-chip-hover"
          >
            + Add
          </button>
        )}
        {help}
        {error}
      </fieldset>
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
        <select className={SELECT_CLASS} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {schema.enum.map((o) => (
            <option key={String(o)} value={String(o)}>
              {humanize(String(o))}
            </option>
          ))}
        </select>
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
      className="grid size-7 place-items-center rounded-full bg-chip text-xs hover:bg-chip-hover disabled:opacity-40"
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
