"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { MediaSlotField } from "@/components/admin/media-slot-field";
import { SaveBar } from "@/components/admin/save-bar";
import { Select } from "@/components/admin/select";
import { Button, Field, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { emptySlot } from "@/content/media-slot";
import type { Block, BlockType, LegalPage, LegalSection, LegalSlug } from "@/content/legal-schema";
import { saveLegal } from "./actions";

// Legal page editor (Admin → Legal → a page), built from the admin's usual
// parts (Panel, Field, Select, Button, SaveBar, the media slot uploader).
// Page details first, then the sections: add, edit, delete (two-step) and
// move up/down; inside a section the blocks, with the same controls. Block
// types: paragraph, bulleted list, numbered list, table, link button,
// image/video. Text takes **bold**, *italic* and [link text](url) only.
// Saving goes live straight away; the save bar warns before leaving with
// unsaved changes. The server checks and cleans everything again.

const BLOCK_LABEL: Record<BlockType, string> = {
  paragraph: "Paragraph",
  bullets: "Bulleted list",
  numbered: "Numbered list",
  table: "Table",
  button: "Link button",
  media: "Image or video",
};

const FORMAT_HINT = "Formatting: **bold**, *italic*, [link text](https://…). Press Enter for a new line.";

const blankBlock = (type: BlockType): Block => {
  switch (type) {
    case "paragraph":
      return { type, text: "" };
    case "bullets":
    case "numbered":
      return { type, items: [""] };
    case "table":
      return { type, header: ["", ""], rows: [["", ""]] };
    case "button":
      return { type, label: "", href: "" };
    case "media":
      return { type, media: emptySlot("16:9", "image") };
  }
};
const blankSection = (): LegalSection => ({ label: "", heading: "", level: "h2", subtitle: "", blocks: [] });

/** Move item i by d (-1 up, 1 down). */
function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function Small({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-full bg-chip text-sm hover:bg-chip-hover disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** Up / down / delete (click twice to delete). */
function RowControls({
  name,
  index,
  count,
  onMove,
  onDelete,
}: {
  name: string;
  index: number;
  count: number;
  onMove: (d: number) => void;
  onDelete: () => void;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <Small label={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(-1)}>
        ↑
      </Small>
      <Small label={`Move ${name} down`} disabled={index === count - 1} onClick={() => onMove(1)}>
        ↓
      </Small>
      <Button
        variant={armed ? "danger" : "ghost"}
        className="h-9 px-3"
        onClick={() => (armed ? (setArmed(false), onDelete()) : setArmed(true))}
        onBlur={() => setArmed(false)}
      >
        {armed ? "Click again to delete" : "Delete"}
      </Button>
    </span>
  );
}

function TextArea({ value, onChange, rows = 3, ...rest }: { value: string; onChange: (v: string) => void; rows?: number; "aria-label"?: string }) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={`${INPUT_CLASS} resize-y leading-relaxed`}
      {...rest}
    />
  );
}

function BlockEditor({
  block,
  onChange,
  err,
}: {
  block: Block;
  onChange: (b: Block) => void;
  err: (sub: string) => string | undefined;
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <Field label="Text" hint={FORMAT_HINT} error={err("text")}>
          <TextArea value={block.text} rows={4} onChange={(text) => onChange({ ...block, text })} />
        </Field>
      );
    case "bullets":
    case "numbered":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">List style</span>
            <Select
              size="sm"
              aria-label="List style"
              value={block.type}
              onChange={(t) => onChange({ ...block, type: t as "bullets" | "numbered" })}
              options={[
                { value: "bullets", label: "Bullets" },
                { value: "numbered", label: "Numbers" },
              ]}
            />
          </div>
          {block.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-3 w-6 shrink-0 text-right text-sm text-fg-2">{block.type === "numbered" ? `${i + 1}.` : "•"}</span>
              <div className="min-w-0 flex-1">
                <TextArea
                  aria-label={`Item ${i + 1}`}
                  value={item}
                  rows={2}
                  onChange={(v) => onChange({ ...block, items: block.items.map((x, j) => (j === i ? v : x)) })}
                />
                {err(`items.${i}`) && <span className="text-xs font-medium text-danger">{err(`items.${i}`)}</span>}
              </div>
              <RowControls
                name={`item ${i + 1}`}
                index={i}
                count={block.items.length}
                onMove={(d) => onChange({ ...block, items: move(block.items, i, d) })}
                onDelete={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
              />
            </div>
          ))}
          <p className="text-xs text-fg-2">{FORMAT_HINT}</p>
          <span>
            <Button onClick={() => onChange({ ...block, items: [...block.items, ""] })}>+ Add item</Button>
          </span>
          {err("items") && <span className="text-xs font-medium text-danger">{err("items")}</span>}
        </div>
      );
    case "table": {
      const cols = Math.max(block.header.length, ...block.rows.map((r) => r.length), 1);
      const pad = (r: string[]) => [...r, ...Array(Math.max(0, cols - r.length)).fill("")];
      const hasHead = block.header.length > 0;
      const setCols = (n: number) =>
        onChange({
          ...block,
          header: hasHead ? pad(block.header).slice(0, n).concat(Array(Math.max(0, n - cols)).fill("")) : [],
          rows: block.rows.map((r) => pad(r).slice(0, n).concat(Array(Math.max(0, n - cols)).fill(""))),
        });
      const cell = "rm-field min-w-36 px-2.5 py-2 text-sm outline-none";
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                className="size-5 accent-[var(--brand)]"
                checked={hasHead}
                onChange={(e) => onChange({ ...block, header: e.target.checked ? Array(cols).fill("") : [] })}
              />
              Heading row
            </label>
            <Button onClick={() => onChange({ ...block, rows: [...block.rows, Array(cols).fill("")] })}>+ Row</Button>
            <Button disabled={cols >= 8} onClick={() => setCols(cols + 1)}>
              + Column
            </Button>
            <Button disabled={cols <= 1} onClick={() => setCols(cols - 1)}>
              − Last column
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1.5">
              <tbody>
                {hasHead && (
                  <tr>
                    {pad(block.header).map((h, c) => (
                      <td key={c}>
                        <input
                          aria-label={`Heading ${c + 1}`}
                          placeholder={`Heading ${c + 1}`}
                          value={h}
                          onChange={(e) =>
                            onChange({ ...block, header: pad(block.header).map((x, j) => (j === c ? e.target.value : x)) })
                          }
                          className={`${cell} font-semibold`}
                        />
                      </td>
                    ))}
                  </tr>
                )}
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {pad(row).map((v, c) => (
                      <td key={c}>
                        <input
                          aria-label={`Row ${r + 1}, column ${c + 1}`}
                          value={v}
                          onChange={(e) =>
                            onChange({
                              ...block,
                              rows: block.rows.map((x, i) => (i === r ? pad(x).map((y, j) => (j === c ? e.target.value : y)) : x)),
                            })
                          }
                          className={cell}
                        />
                      </td>
                    ))}
                    <td>
                      <RowControls
                        name={`row ${r + 1}`}
                        index={r}
                        count={block.rows.length}
                        onMove={(d) => onChange({ ...block, rows: move(block.rows, r, d) })}
                        onDelete={() => onChange({ ...block, rows: block.rows.filter((_, i) => i !== r) })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-fg-2">{FORMAT_HINT.replace(" Press Enter for a new line.", "")}</p>
          {(err("rows") || err("header")) && (
            <span className="text-xs font-medium text-danger">{err("rows") ?? err("header")}</span>
          )}
        </div>
      );
    }
    case "button":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Button text" error={err("label")}>
            <input value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} className={INPUT_CLASS} />
          </Field>
          <Field label="Link" hint="Starts with /, #, https://, mailto: or tel:" error={err("href")}>
            <input value={block.href} onChange={(e) => onChange({ ...block, href: e.target.value })} className={INPUT_CLASS} />
          </Field>
        </div>
      );
    case "media":
      return (
        <MediaSlotField
          label="Image or video"
          value={block.media}
          onChange={(media) => onChange({ ...block, media })}
          error={err("media")}
          altError={err("media.alt")}
          showShape
        />
      );
  }
}

export function LegalEditor({ slug, initial, saved: wasSaved }: { slug: LegalSlug; initial: LegalPage; saved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [page, setPage] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [addType, setAddType] = useState<BlockType>("paragraph");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  const update = (next: LegalPage) => {
    setPage(next);
    setDirty(true);
    setMessage(null);
  };
  const set = <K extends keyof LegalPage>(k: K, v: LegalPage[K]) => update({ ...page, [k]: v });
  const setSections = (sections: LegalSection[]) => update({ ...page, sections });
  const setSection = (i: number, s: LegalSection) => setSections(page.sections.map((x, j) => (j === i ? s : x)));
  const sectionHasError = (i: number) => Object.keys(errors).some((k) => k.startsWith(`sections.${i}.`));

  const text = (k: "title" | "eyebrow" | "effective" | "updated" | "seoTitle" | "seoDescription", label: string, hint?: string) => (
    <Field label={label} hint={hint} error={errors[k]}>
      <input value={page[k]} onChange={(e) => set(k, e.target.value)} className={INPUT_CLASS} />
    </Field>
  );

  return (
    <div className="flex flex-col gap-5">
      {!wasSaved && (
        <p className="rounded-[18px] border border-line bg-bg-elev px-5 py-4 text-sm text-fg-2">
          This page shows the copy of the live page until you save it here for the first time.
        </p>
      )}

      <Panel title="Page">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("title", "Page title (H1)")}
          {text("eyebrow", "Small label above the title", "Empty = “Legal”.")}
          <Field label="Line under the title (optional)" hint={FORMAT_HINT} error={errors.intro} className="sm:col-span-2">
            <TextArea value={page.intro} onChange={(v) => set("intro", v)} />
          </Field>
          {text("effective", "Effective date (optional)", "As it should read, e.g. January 1, 2025. Empty = hidden.")}
          {text("updated", "Last updated (optional)", "As it should read, e.g. May 2025. Empty = hidden.")}
          {text("seoTitle", "SEO title", "Shown as “title | RohTre Media” in search results.")}
          {text("seoDescription", "Meta description", "One or two sentences, up to 170 characters.")}
        </div>
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-chip px-4 text-sm font-semibold hover:bg-chip-hover"
        >
          Preview on site ↗
        </a>
      </Panel>

      <Panel title={`Sections (${page.sections.length})`}>
        <p className="mb-4 text-sm text-fg-2">
          Sections with an H2 heading make the page’s “On this page” list. A section without a heading continues the one above.
        </p>
        <ul className="flex flex-col gap-3">
          {page.sections.map((s, i) => {
            const isOpen = open === i;
            return (
              <li
                key={i}
                className={`rounded-[18px] border bg-bg-elev ${sectionHasError(i) ? "border-danger" : "border-line"}`}
              >
                <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-11 min-w-0 flex-1 basis-60 items-center gap-3 text-left"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-chip text-xs font-bold">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {[s.label, s.heading].filter(Boolean).join(" · ") || "(no heading)"}
                      </span>
                      <span className="text-xs text-fg-2">
                        {s.level.toUpperCase()} · {s.blocks.length} block{s.blocks.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span aria-hidden="true" className={`ml-auto text-fg-2 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </button>
                  <RowControls
                    name={`section ${i + 1}`}
                    index={i}
                    count={page.sections.length}
                    onMove={(d) => {
                      setSections(move(page.sections, i, d));
                      setOpen(open === i ? i + d : open);
                    }}
                    onDelete={() => {
                      setSections(page.sections.filter((_, j) => j !== i));
                      setOpen(null);
                    }}
                  />
                </div>

                {isOpen && (
                  <div className="flex flex-col gap-4 border-t border-line p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Heading (empty = no heading)" error={errors[`sections.${i}.heading`]}>
                        <input
                          value={s.heading}
                          onChange={(e) => setSection(i, { ...s, heading: e.target.value })}
                          className={INPUT_CLASS}
                        />
                      </Field>
                      <div className="flex flex-col gap-1.5 text-sm">
                        <span className="font-semibold">Heading level</span>
                        <Select
                          aria-label="Heading level"
                          value={s.level}
                          onChange={(v) => setSection(i, { ...s, level: v as "h2" | "h3" })}
                          options={[
                            { value: "h2", label: "H2: main section (in “On this page”)" },
                            { value: "h3", label: "H3: sub-section" },
                          ]}
                        />
                      </div>
                      <Field label="Small label above the heading (optional)" hint="e.g. 01" error={errors[`sections.${i}.label`]}>
                        <input value={s.label} onChange={(e) => setSection(i, { ...s, label: e.target.value })} className={INPUT_CLASS} />
                      </Field>
                      <Field label="Line under the heading (optional)" error={errors[`sections.${i}.subtitle`]}>
                        <input
                          value={s.subtitle}
                          onChange={(e) => setSection(i, { ...s, subtitle: e.target.value })}
                          className={INPUT_CLASS}
                        />
                      </Field>
                    </div>

                    <div className="flex flex-col gap-3">
                      <p className="text-sm font-semibold">Blocks ({s.blocks.length})</p>
                      {s.blocks.map((b, j) => {
                        const base = `sections.${i}.blocks.${j}`;
                        return (
                          <div key={j} className="flex flex-col gap-3 rounded-2xl border border-line p-3 sm:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-bold">
                                {j + 1}. {BLOCK_LABEL[b.type]}
                              </span>
                              <RowControls
                                name={`block ${j + 1}`}
                                index={j}
                                count={s.blocks.length}
                                onMove={(d) => setSection(i, { ...s, blocks: move(s.blocks, j, d) })}
                                onDelete={() => setSection(i, { ...s, blocks: s.blocks.filter((_, k) => k !== j) })}
                              />
                            </div>
                            <BlockEditor
                              block={b}
                              err={(sub) => errors[`${base}.${sub}`]}
                              onChange={(nb) => setSection(i, { ...s, blocks: s.blocks.map((x, k) => (k === j ? nb : x)) })}
                            />
                          </div>
                        );
                      })}
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          size="sm"
                          aria-label="Block type to add"
                          value={addType}
                          onChange={(v) => setAddType(v as BlockType)}
                          options={(Object.keys(BLOCK_LABEL) as BlockType[]).map((t) => ({ value: t, label: BLOCK_LABEL[t] }))}
                        />
                        <Button onClick={() => setSection(i, { ...s, blocks: [...s.blocks, blankBlock(addType)] })}>
                          + Add block
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <Button
            onClick={() => {
              setSections([...page.sections, blankSection()]);
              setOpen(page.sections.length);
            }}
          >
            + Add section
          </Button>
        </div>
      </Panel>

      <SaveBar
        dirty={dirty}
        pending={pending}
        message={message}
        idle="Saved. Changes go live on the page when you save."
        onDiscard={() => {
          setPage(saved);
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
              const res = await saveLegal(slug, page);
              if (res.ok) {
                setErrors({});
                setDirty(false);
                setSaved(page);
                setMessage({ tone: "ok", text: "Saved. The page is updated." });
                router.refresh();
              } else {
                setErrors(res.fieldErrors);
                setMessage({ tone: "error", text: res.error });
              }
            })
          }
        >
          Save page
        </Button>
      </SaveBar>
    </div>
  );
}
