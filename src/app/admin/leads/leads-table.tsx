"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Select } from "@/components/admin/select";
import { Button, INPUT_CLASS } from "@/components/admin/ui";
import { whatsappLink } from "@/lib/whatsapp";
import { deleteLead, purgeOldLeads, setLeadStatus } from "./actions";

// Lead inbox (R23, R38), in the same style as Applications: search, filters
// (status, source page) that apply as soon as they change, one card per lead
// (name, interests, business type, page, date, status); open a card to read
// it, change its status, WhatsApp the client (wa.me click-to-chat, free, no
// API) or email them, or delete it on request; CSV export and purge of leads
// older than the retention setting. A failed sales email (Contact page)
// shows as a plain-language warning. Two-step confirm buttons instead of
// browser dialogs.

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
  interested_in?: string[] | null;
  message: string | null;
  page_path: string;
  utm_source: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  fbclid: string | null;
  status: string;
  notify_error?: string | null;
};

export const LEAD_STATUSES = ["new", "contacted", "won", "lost", "spam"] as const;
export type LeadFilters = { q: string; status: string; source: string };

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

/** Status colours: new blue, contacted amber, won green, lost grey, spam red. */
const STATUS_LOOK: Record<string, string> = {
  new: "bg-[#e8f0ff] text-[#1d4ed8]",
  contacted: "bg-[#fff4e0] text-[#a15c00]",
  won: "bg-[#e5f6ec] text-[#167a3c]",
  lost: "bg-[#eef0f3] text-[#4b5563]",
  spam: "bg-[color-mix(in_srgb,var(--danger)_12%,white)] text-danger",
};
const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", won: "Won", lost: "Lost", spam: "Spam" };

/** What went wrong with the sales email, in plain words, plus what to do. */
function explain(error: string): string {
  if (/invalid login|badcredentials|username and password not accepted/i.test(error))
    return "The mailbox didn’t accept the sign-in. Check the mailbox address and password in the SMTP settings, then restart the site.";
  if (/smtp_not_configured/.test(error)) return "Email sending isn’t set up yet: add SMTP_USER and SMTP_PASS to .env.local.";
  if (/no_sales_email/.test(error)) return "No sales email address is set: add CONTACT_NOTIFY_EMAIL to .env.local.";
  return error;
}

const sourceOf = (l: Lead) => l.utm_source ?? (l.gclid ? "Google Ads" : l.fbclid ? "Meta Ads" : "Direct");
const interestsOf = (l: Lead) => (l.interested_in?.length ? l.interested_in : l.interest ? [l.interest] : []);

function Info({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-2">{label}</dt>
      <dd className="min-w-0 break-words text-[15px]">{children}</dd>
    </div>
  );
}

const none = <span className="text-fg-2">Not given</span>;

export function LeadsTable({
  leads,
  filters,
  page,
  pages,
  retentionDays,
}: {
  leads: Lead[];
  filters: LeadFilters;
  page: number;
  pages: number;
  retentionDays: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [f, setF] = useState(filters);
  const qs = (next: LeadFilters, p = 1) => {
    const sp = new URLSearchParams({ ...next, page: String(p) });
    for (const [k, v] of [...sp]) if (!v || (k === "page" && v === "1")) sp.delete(k);
    const s = sp.toString();
    return `/admin/leads${s ? `?${s}` : ""}`;
  };
  const filter = (k: keyof LeadFilters, v: string) => {
    const next = { ...f, [k]: v };
    setF(next);
    router.push(qs(next));
  };
  const clear = { q: "", status: "", source: "" };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-line bg-bg-elev p-3 sm:p-4">
        <form
          className="flex min-w-0 flex-1 basis-64 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            filter("q", String(new FormData(e.currentTarget).get("q") ?? "").trim());
          }}
        >
          <input name="q" defaultValue={f.q} placeholder="Search name, email, phone or page…" className={INPUT_CLASS} />
          <Button type="submit">Search</Button>
        </form>
        <Select
          size="sm"
          aria-label="Status"
          value={f.status}
          onChange={(v) => filter("status", v)}
          options={[{ value: "", label: "All statuses" }, ...LEAD_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))]}
        />
        <Select
          size="sm"
          aria-label="Source page"
          value={f.source}
          onChange={(v) => filter("source", v)}
          options={[
            { value: "", label: "All pages" },
            { value: "contact", label: "Contact page" },
            { value: "other", label: "Other pages" },
          ]}
        />
        {(f.q || f.status || f.source) && (
          <Button variant="ghost" onClick={() => (setF(clear), router.push(qs(clear)))}>
            Clear filters
          </Button>
        )}
        <a
          href="/admin/leads/export"
          className="rm-press ml-auto inline-flex h-11 items-center rounded-full bg-chip-on-bg px-5 text-sm font-semibold text-chip-on-fg"
        >
          Export CSV
        </a>
      </div>
      {message && (
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      )}

      {leads.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-bg-elev p-10 text-center text-fg-2">
          {f.q || f.status || f.source ? "No leads match." : "No leads yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {leads.map((l) => {
            const isOpen = open === l.id;
            const interests = interestsOf(l);
            return (
              <li
                key={l.id}
                className={`overflow-hidden rounded-[18px] border bg-bg-elev transition-shadow ${
                  isOpen
                    ? "border-[color-mix(in_srgb,var(--brand)_35%,var(--line))] shadow-[0_14px_40px_-24px_rgba(0,0,0,0.35)]"
                    : "border-line"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : l.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 p-4 text-left hover:bg-hover sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-base font-bold uppercase text-brand"
                  >
                    {l.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-bold">{l.name}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
                      {l.business_type && <span className="rounded-full bg-chip px-2.5 py-1">{l.business_type}</span>}
                      {interests.slice(0, 3).map((i) => (
                        <span key={i} className="rounded-full bg-chip px-2.5 py-1">
                          {i}
                        </span>
                      ))}
                      {interests.length > 3 && <span className="rounded-full bg-chip px-2.5 py-1">+{interests.length - 3}</span>}
                      <span className="rounded-full bg-chip px-2.5 py-1 font-medium text-fg-2">{l.page_path}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
                    <span className="flex items-center gap-1.5">
                      {l.notify_error && (
                        <span className="rounded-full bg-[color-mix(in_srgb,var(--danger)_14%,white)] px-2.5 py-1 font-bold text-danger">
                          Email failed
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 font-bold ${STATUS_LOOK[l.status] ?? "bg-chip"}`}>
                        {STATUS_LABEL[l.status] ?? l.status}
                      </span>
                    </span>
                    <span className="text-fg-2 max-sm:hidden">{fmt.format(new Date(l.created_at))}</span>
                  </span>
                  <span aria-hidden="true" className={`text-fg-2 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-5 border-t border-line p-4 sm:p-6">
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <Info label="Email">
                        <a href={`mailto:${l.email}`} className="font-medium underline underline-offset-2">
                          {l.email}
                        </a>
                      </Info>
                      <Info label="WhatsApp / phone">
                        <a href={`tel:${l.phone}`} className="font-medium underline underline-offset-2">
                          {l.phone}
                        </a>
                      </Info>
                      <Info label="Business type">{l.business_type ?? none}</Info>
                      <Info label="Website">
                        {l.website ? (
                          <a href={l.website} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
                            {l.website}
                          </a>
                        ) : (
                          none
                        )}
                      </Info>
                      <Info label="Monthly ad spend">{l.ad_spend_range ?? none}</Info>
                      <Info label="Interested in">{interests.length ? interests.join(", ") : none}</Info>
                      <Info label="Received">{fmt.format(new Date(l.created_at))}</Info>
                      <Info label="Page / source">
                        {l.page_path} · {sourceOf(l)}
                        {l.utm_campaign && ` · ${l.utm_campaign}`}
                      </Info>
                      <Info label="Message" wide>
                        {l.message ? (
                          <span className="block whitespace-pre-line rounded-xl bg-chip px-4 py-3">{l.message}</span>
                        ) : (
                          <span className="text-fg-2">No message</span>
                        )}
                      </Info>
                    </dl>

                    {l.notify_error && (
                      <div
                        role="note"
                        className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,white)] bg-[color-mix(in_srgb,var(--danger)_7%,white)] px-4 py-3 text-sm"
                      >
                        <p className="font-bold text-danger">The sales email for this enquiry was not sent.</p>
                        <p className="mt-1 text-fg">{explain(l.notify_error)}</p>
                        <p className="mt-1 text-fg-2">The enquiry itself is saved here.</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                      <a
                        href={whatsappLink(l.phone, `Hi ${l.name}, this is RohTre Media about your enquiry.`)}
                        target="_blank"
                        rel="noopener"
                        className="rm-press inline-flex h-11 items-center rounded-full bg-[#1f9d4c] px-5 text-sm font-semibold text-white"
                      >
                        WhatsApp this client
                      </a>
                      <a
                        href={`mailto:${l.email}?subject=${encodeURIComponent("Your enquiry with RohTre Media")}`}
                        className="rm-press inline-flex h-11 items-center rounded-full bg-chip px-5 text-sm font-semibold hover:bg-chip-hover"
                      >
                        Email
                      </a>
                      <span className="mx-1 h-6 w-px bg-line max-sm:hidden" aria-hidden="true" />
                      <span className="text-sm font-semibold text-fg-2">Status</span>
                      <Select
                        size="sm"
                        aria-label="Status"
                        value={l.status}
                        disabled={pending}
                        onChange={(s) => start(async () => void (await setLeadStatus(l.id, s), router.refresh()))}
                        options={LEAD_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
                      />
                      <Button
                        className="ml-auto"
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
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {pages > 1 ? (
          <nav aria-label="Pages" className="flex items-center gap-3 text-sm">
            {page > 1 && <Link href={qs(f, page - 1)}>← Newer</Link>}
            <span className="text-fg-2">
              Page {page} of {pages}
            </span>
            {page < pages && <Link href={qs(f, page + 1)}>Older →</Link>}
          </nav>
        ) : (
          <span />
        )}
        <Button
          variant={armed === "purge" ? "danger" : "ghost"}
          disabled={pending}
          onClick={() => {
            if (armed !== "purge") return setArmed("purge");
            setArmed(null);
            start(async () => {
              const res = await purgeOldLeads();
              setMessage(res.ok ? `${res.deleted ?? 0} lead(s) older than ${retentionDays} days deleted.` : "Couldn’t purge.");
              router.refresh();
            });
          }}
        >
          {armed === "purge" ? "Click again to purge" : `Delete leads older than ${retentionDays} days`}
        </Button>
      </div>
    </div>
  );
}
