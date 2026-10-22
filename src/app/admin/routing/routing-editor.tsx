"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Select } from "@/components/admin/select";
import { Button, Field, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { deleteMapping, deleteRedirect, saveMapping, saveRedirect, type Result } from "./actions";

// Redirects (owner/developer) and the ad-group → page reference table (all
// staff). Slug changes add redirects automatically; those are marked "auto".

export type Redirect = { from_path: string; to_path: string; status: number; auto: boolean; created_at: string };
export type Mapping = {
  id: string;
  platform: "google" | "meta" | "other";
  campaign: string;
  ad_group: string | null;
  keyword_theme: string | null;
  page_id: string | null;
  notes: string | null;
};

const BLANK: Omit<Mapping, "id"> & { id?: string } = {
  platform: "google",
  campaign: "",
  ad_group: "",
  keyword_theme: "",
  page_id: null,
  notes: "",
};

export function RoutingEditor({
  canManage,
  redirects,
  mappings,
  pages,
}: {
  canManage: boolean;
  redirects: Redirect[];
  mappings: Mapping[];
  pages: { id: string; slug: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [redirect, setRedirect] = useState({ from_path: "", to_path: "", status: 301 });
  const [mapping, setMapping] = useState(BLANK);

  const run = (fn: () => Promise<Result>, done: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? done : (res.error ?? "Something went wrong."));
      if (res.ok) {
        after?.();
        router.refresh();
      }
    });

  const slugOf = (id: string | null) => pages.find((p) => p.id === id)?.slug;

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      )}

      <Panel title="Redirects">
        <p className="-mt-2 mb-4 text-sm text-fg-2">
          Old address → new address. Changing a landing page’s address adds one automatically.
        </p>
        {canManage && (
          <form
            className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => saveRedirect(redirect),
                "Redirect saved.",
                () => setRedirect({ from_path: "", to_path: "", status: 301 }),
              );
            }}
          >
            <Field label="From">
              <input
                required
                value={redirect.from_path}
                onChange={(e) => setRedirect({ ...redirect, from_path: e.target.value })}
                placeholder="/old-page"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="To">
              <input
                required
                value={redirect.to_path}
                onChange={(e) => setRedirect({ ...redirect, to_path: e.target.value })}
                placeholder="/lp/new-page"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Type">
              <Select
                value={String(redirect.status)}
                onChange={(v) => setRedirect({ ...redirect, status: Number(v) })}
                options={[
                  { value: "301", label: "301 permanent" },
                  { value: "308", label: "308 permanent (keeps method)" },
                ]}
              />
            </Field>
            <Button type="submit" variant="primary" disabled={pending}>
              Add redirect
            </Button>
          </form>
        )}
        {redirects.length === 0 ? (
          <p className="text-fg-2">No redirects yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {redirects.map((r) => (
              <li key={r.from_path} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 break-all font-mono text-[13px]">
                  {r.from_path} → {r.to_path}{" "}
                  <span className="font-sans text-xs text-fg-2">
                    {r.status}
                    {r.auto ? " · auto" : ""}
                  </span>
                </span>
                {canManage && (
                  <Button
                    className="h-8 text-xs"
                    variant={armed === r.from_path ? "danger" : "ghost"}
                    disabled={pending}
                    onClick={() => {
                      if (armed !== r.from_path) return setArmed(r.from_path);
                      setArmed(null);
                      run(() => deleteRedirect(r.from_path), "Redirect deleted.");
                    }}
                  >
                    {armed === r.from_path ? "Click again to delete" : "Delete"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Ad groups → pages">
        <p className="-mt-2 mb-4 text-sm text-fg-2">
          A reference list of which campaign and ad group sends traffic to which landing page. The website doesn’t use
          it to route visitors; it keeps the team in sync.
        </p>
        <form
          className="mb-5 grid gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => saveMapping(mapping),
              mapping.id ? "Row updated." : "Row added.",
              () => setMapping(BLANK),
            );
          }}
        >
          <Field label="Platform">
            <Select
              value={mapping.platform}
              onChange={(v) => setMapping({ ...mapping, platform: v as Mapping["platform"] })}
              options={[
                { value: "google", label: "Google Ads" },
                { value: "meta", label: "Meta ads" },
                { value: "other", label: "Other" },
              ]}
            />
          </Field>
          <Field label="Campaign">
            <input
              required
              value={mapping.campaign}
              onChange={(e) => setMapping({ ...mapping, campaign: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Ad group / ad set">
            <input
              value={mapping.ad_group ?? ""}
              onChange={(e) => setMapping({ ...mapping, ad_group: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Keyword theme">
            <input
              value={mapping.keyword_theme ?? ""}
              onChange={(e) => setMapping({ ...mapping, keyword_theme: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Landing page">
            <Select
              value={mapping.page_id ?? ""}
              onChange={(v) => setMapping({ ...mapping, page_id: v || null })}
              options={[
                { value: "", label: "— none —" },
                ...pages.map((p) => ({ value: p.id, label: `/lp/${p.slug}` })),
              ]}
            />
          </Field>
          <Field label="Notes">
            <input
              value={mapping.notes ?? ""}
              onChange={(e) => setMapping({ ...mapping, notes: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <div className="flex gap-2 md:col-span-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {mapping.id ? "Save row" : "Add row"}
            </Button>
            {mapping.id && <Button onClick={() => setMapping(BLANK)}>Cancel</Button>}
          </div>
        </form>
        {mappings.length === 0 ? (
          <p className="text-fg-2">No rows yet.</p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-fg-2">
                <tr>
                  {["Platform", "Campaign", "Ad group", "Keywords", "Page", ""].map((h) => (
                    <th key={h} className="px-2 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.id} className="border-t border-line align-top">
                    <td className="px-2 py-2.5 capitalize">{m.platform}</td>
                    <td className="px-2 py-2.5 font-medium">{m.campaign}</td>
                    <td className="px-2 py-2.5">{m.ad_group ?? "—"}</td>
                    <td className="px-2 py-2.5">{m.keyword_theme ?? "—"}</td>
                    <td className="px-2 py-2.5 font-mono text-[13px]">
                      {slugOf(m.page_id) ? `/lp/${slugOf(m.page_id)}` : "—"}
                    </td>
                    <td className="flex gap-1 px-2 py-1.5">
                      <Button className="h-8 text-xs" variant="ghost" onClick={() => setMapping(m)}>
                        Edit
                      </Button>
                      <Button
                        className="h-8 text-xs"
                        variant={armed === m.id ? "danger" : "ghost"}
                        disabled={pending}
                        onClick={() => {
                          if (armed !== m.id) return setArmed(m.id);
                          setArmed(null);
                          run(() => deleteMapping(m.id), "Row deleted.");
                        }}
                      >
                        {armed === m.id ? "Confirm" : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
