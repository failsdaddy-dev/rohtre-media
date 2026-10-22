"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { blankFor, SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { Button, Panel } from "@/components/admin/ui";
import type { ProofTable } from "@/lib/proof-schemas";
import { deleteProof, saveProof } from "./actions";

// Proof & badges (R11, R18-R20, R45): list each table, edit a record with
// the generic form, approve it, and tag it with service / niche / country so
// the right landing pages show it. A record only reaches the live site when
// it is approved (and not a placeholder), or, for badges, switched on.

type Row = Record<string, unknown> & { id: string };
type Dim = { id: string; type: string; label: string };

const HINTS: Hints = {
  is_placeholder: { label: "Is placeholder (never shown live)" },
  approved: { label: "Approved for the live site", help: "Testimonials: only with the client’s written OK." },
  enabled: { label: "Switched on (shown on the site)" },
  image_public_id: { label: "Image / screenshot" },
  logo_public_id: { label: "Brand / company logo", help: "Testimonials: shown next to the name on a dark chip." },
  photo_public_id: { label: "Photo" },
  poster_public_id: { label: "Poster image (shown before a reel plays)" },
  proof_url: { label: "Proof link (optional)", help: "https:// link to a directory listing, certificate or article." },
  last_verified_at: { label: "Last verified (YYYY-MM-DD)" },
  label_text: { label: "Label shown on the work", help: "Concept work always shows this label (R45)." },
  notes: { label: "Internal notes (never shown)" },
  sort: { label: "Order (lower first)" },
  metric_value: { label: "Metric (e.g. 3.2x)" },
  metric_label: { label: "What it measures (e.g. return on ad spend)" },
};

function title(table: ProofTable, r: Row): string {
  return String(r.brand_name ?? r.person_name ?? r.label ?? r.label_text ?? "Untitled");
}

function liveState(table: ProofTable, r: Row): { live: boolean; text: string } {
  if (table === "badges") return r.enabled ? { live: true, text: "Shown" } : { live: false, text: "Switched off" };
  if (r.is_placeholder) return { live: false, text: "Placeholder" };
  return r.approved ? { live: true, text: "Live" } : { live: false, text: "Not approved" };
}

export function ProofManager(props: {
  tables: { key: ProofTable; label: string; tagType: string | null }[];
  schemas: Record<string, JsonSchema>;
  rows: Record<ProofTable, Row[]>;
  tags: { item_type: string; item_id: string; value_id: string }[];
  dimensions: Dim[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<ProofTable>("results");
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, unknown>; tags: string[] } | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const def = props.tables.find((t) => t.key === tab)!;
  const schema = props.schemas[tab];

  const open = (r: Row | null) => {
    setErrors({});
    setMessage(null);
    if (!r) return setEditing({ id: null, values: blankFor(schema) as Record<string, unknown>, tags: [] });
    const values = Object.fromEntries(Object.keys(schema.properties ?? {}).map((k) => [k, r[k] ?? null]));
    const tags = props.tags.filter((t) => t.item_type === def.tagType && t.item_id === r.id).map((t) => t.value_id);
    setEditing({ id: r.id, values, tags });
  };

  const hints: Hints = {
    ...HINTS,
    media_public_id: {
      label: editing?.values.kind === "reel" ? "Reel video" : "Image",
      kind: editing?.values.kind === "reel" ? "video" : "image",
    },
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {props.tables.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setEditing(null);
            }}
            aria-current={tab === t.key ? "page" : undefined}
            className={`h-9 shrink-0 rounded-lg px-3.5 text-sm font-medium ${tab === t.key ? "bg-brand text-brand-fg" : "bg-chip hover:bg-chip-hover"}`}
          >
            {t.label} ({props.rows[t.key].length})
          </button>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel title={def.label}>
          <ul className="divide-y divide-line">
            {props.rows[tab].map((r) => {
              const state = liveState(tab, r);
              const tagCount = props.tags.filter((t) => t.item_type === def.tagType && t.item_id === r.id).length;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => open(r)}
                    className={`flex w-full items-center justify-between gap-3 py-3 text-left ${editing?.id === r.id ? "text-brand" : ""}`}
                  >
                    <span className="min-w-0 truncate font-medium">{title(tab, r)}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs">
                      {def.tagType && <span className="text-fg-2">{tagCount ? `${tagCount} tags` : "all pages"}</span>}
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${state.live ? "bg-[#1f7a3a] text-white" : "bg-chip"}`}
                      >
                        {state.text}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Button className="mt-4" onClick={() => open(null)}>
            + Add {def.label.toLowerCase().replace(/s$/, "")}
          </Button>
        </Panel>

        {editing && (
          <Panel title={editing.id ? "Edit" : "New"}>
            <SchemaForm
              schema={schema}
              value={editing.values}
              onChange={(v) => setEditing({ ...editing, values: v as Record<string, unknown> })}
              hints={hints}
              errors={errors}
            />
            {def.tagType && (
              <fieldset className="mt-5 rounded-2xl border border-line p-4">
                <legend className="px-1 text-sm font-semibold">Show on pages for…</legend>
                <p className="mb-3 text-xs text-fg-2">
                  Leave a group empty to show on every page for it. A parent (e.g. Fashion) also covers its sub-niches.
                </p>
                {["service", "niche", "country"].map((type) => (
                  <div key={type} className="mb-3">
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-fg-2">{type}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {props.dimensions
                        .filter((d) => d.type === type)
                        .map((d) => (
                          <label key={d.id} className="flex items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              className="size-4 accent-[var(--brand)]"
                              checked={editing.tags.includes(d.id)}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  tags: e.target.checked
                                    ? [...editing.tags, d.id]
                                    : editing.tags.filter((x) => x !== d.id),
                                })
                              }
                            />
                            {d.label}
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </fieldset>
            )}
            {message && <p className="mt-4 text-sm font-medium text-danger">{message}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="primary"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await saveProof(tab, editing.id, editing.values, editing.tags);
                    if (!res.ok) {
                      setErrors(res.fieldErrors ?? {});
                      setMessage(res.error);
                      return;
                    }
                    setEditing(null);
                    router.refresh();
                  })
                }
              >
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              {editing.id && props.canDelete && (
                <Button
                  variant="danger"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await deleteProof(tab, editing.id!);
                      if (!res.ok) return setMessage(res.error ?? "Couldn’t delete.");
                      setEditing(null);
                      router.refresh();
                    })
                  }
                >
                  Delete
                </Button>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
