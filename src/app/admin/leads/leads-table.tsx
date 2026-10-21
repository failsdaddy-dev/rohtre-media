"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { deleteLead, purgeOldLeads, setLeadStatus } from "./actions";

// Lead list (R23, R38): search, CSV export, status, delete on request, and
// purge of leads older than the retention setting. Two-step confirm buttons
// instead of browser dialogs.

export type Lead = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  business_type: string | null;
  website: string | null;
  ad_spend_range: string | null;
  interest: string | null;
  message: string | null;
  page_path: string;
  utm_source: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  fbclid: string | null;
  status: string;
};

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export function LeadsTable({
  leads,
  q,
  page,
  pages,
  retentionDays,
}: {
  leads: Lead[];
  q: string;
  page: number;
  pages: number;
  retentionDays: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex min-w-0 flex-1 gap-2" action="/admin/leads">
          <input name="q" defaultValue={q} placeholder="Search name, email, phone or page…" className={INPUT_CLASS} />
          <Button type="submit">Search</Button>
        </form>
        <a
          href="/admin/leads/export"
          className="rm-press inline-flex h-10 items-center rounded-full bg-chip-on-bg px-5 text-sm font-semibold text-chip-on-fg"
        >
          Export CSV
        </a>
        <Button
          variant={armed === "purge" ? "danger" : "ghost"}
          disabled={pending}
          onClick={() => {
            if (armed !== "purge") return setArmed("purge");
            setArmed(null);
            start(async () => {
              const res = await purgeOldLeads();
              setMessage(
                res.ok ? `${res.deleted ?? 0} lead(s) older than ${retentionDays} days deleted.` : "Couldn’t purge.",
              );
              router.refresh();
            });
          }}
        >
          {armed === "purge" ? "Click again to purge" : `Delete leads older than ${retentionDays} days`}
        </Button>
      </div>
      {message && <p className="text-sm font-medium">{message}</p>}

      <Panel title="Leads">
        {leads.length === 0 ? (
          <p className="text-fg-2">{q ? "No leads match." : "No leads yet."}</p>
        ) : (
          <ul className="divide-y divide-line">
            {leads.map((l) => (
              <li key={l.id} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpen(open === l.id ? null : l.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="font-semibold">{l.name}</span>{" "}
                    <span className="text-sm text-fg-2">
                      {l.phone} · {l.email}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-fg-2">
                    {l.utm_source ?? (l.gclid ? "google ads" : l.fbclid ? "meta ads" : "direct")} · {l.page_path} ·{" "}
                    {fmt.format(new Date(l.created_at))}
                    <span className="rounded-full bg-chip px-2 py-0.5 font-bold uppercase text-fg">{l.status}</span>
                  </span>
                </button>
                {open === l.id && (
                  <div className="mt-3 grid gap-3 rounded-2xl border border-line p-4 text-sm md:grid-cols-2">
                    <p>
                      <strong>Business:</strong> {l.business_type ?? "—"} {l.website && `· ${l.website}`}
                    </p>
                    <p>
                      <strong>Ad spend:</strong> {l.ad_spend_range ?? "—"} · <strong>Interested in:</strong>{" "}
                      {l.interest ?? "—"}
                    </p>
                    <p className="md:col-span-2">
                      <strong>Message:</strong> {l.message ?? "—"}
                    </p>
                    <p className="md:col-span-2 text-fg-2">
                      Campaign: {l.utm_campaign ?? "—"} {l.gclid ? "· gclid ✓" : ""} {l.fbclid ? "· fbclid ✓" : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      {["new", "contacted", "won", "lost", "spam"].map((s) => (
                        <Button
                          key={s}
                          className="h-8 text-xs"
                          variant={l.status === s ? "primary" : "plain"}
                          disabled={pending}
                          onClick={() => start(async () => void (await setLeadStatus(l.id, s), router.refresh()))}
                        >
                          {s}
                        </Button>
                      ))}
                      <Button
                        className="h-8 text-xs"
                        variant={armed === l.id ? "danger" : "ghost"}
                        disabled={pending}
                        onClick={() => {
                          if (armed !== l.id) return setArmed(l.id);
                          setArmed(null);
                          start(async () => {
                            const res = await deleteLead(l.id, "Deleted from the admin");
                            setMessage(res.ok ? "Lead deleted." : (res.error ?? "Couldn’t delete."));
                            router.refresh();
                          });
                        }}
                      >
                        {armed === l.id ? "Click again to delete for good" : "Delete (on request)"}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex gap-2 text-sm">
            {page > 1 && <Link href={`/admin/leads?q=${encodeURIComponent(q)}&page=${page - 1}`}>← Newer</Link>}
            <span className="text-fg-2">
              Page {page} of {pages}
            </span>
            {page < pages && <Link href={`/admin/leads?q=${encodeURIComponent(q)}&page=${page + 1}`}>Older →</Link>}
          </nav>
        )}
      </Panel>
    </div>
  );
}
