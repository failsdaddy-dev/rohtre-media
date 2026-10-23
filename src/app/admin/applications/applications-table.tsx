"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Select } from "@/components/admin/select";
import { Button } from "@/components/admin/ui";
import { CAREER_CATEGORIES } from "@/content/careers-schema";
import { APPLICATION_STATUSES } from "@/lib/career-application";
import { whatsappLink } from "@/lib/whatsapp";
import { deleteApplication, setApplicationStatus } from "./actions";

// Careers applications inbox: filter by category, role and status; one card
// per application (name, role, category, experience, date, status); open a
// card to read it, change its status, WhatsApp or email the applicant (wa.me
// click-to-chat, free, no API), or delete it on request; CSV export.
// A failed HR email shows as a plain-language warning with what to fix.
// Two-step confirm for delete instead of browser dialogs, like the leads list.

export type Application = {
  id: string;
  created_at: string;
  category: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  experience: string;
  portfolio_url: string | null;
  message: string | null;
  resume_name: string | null;
  status: string;
  notify_error: string | null;
};

type Filters = { category: string; status: string; role: string };

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

/** Status colours: new blue, contacted amber, rejected grey, hired green. */
const STATUS_LOOK: Record<string, string> = {
  new: "bg-[#e8f0ff] text-[#1d4ed8]",
  contacted: "bg-[#fff4e0] text-[#a15c00]",
  rejected: "bg-[#eef0f3] text-[#4b5563]",
  hired: "bg-[#e5f6ec] text-[#167a3c]",
};
const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  rejected: "Rejected",
  hired: "Hired",
};

/** What went wrong with the HR email, in plain words, plus what to do. */
function explain(error: string): string {
  if (/invalid login|badcredentials|username and password not accepted/i.test(error))
    return "Gmail didn’t accept the sign-in. In .env.local, SMTP_USER must be the Gmail address and SMTP_PASS an app password created on that same account. Restart npm run dev after changing it.";
  if (/smtp_not_configured/.test(error))
    return "Email sending isn’t set up yet: add SMTP_USER and SMTP_PASS to .env.local.";
  if (/no_hr_email/.test(error)) return "No HR email address is saved: add one in Admin → Careers page → HR emails.";
  return error;
}

function Info({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-2">{label}</dt>
      <dd className="min-w-0 break-words text-[15px]">{children}</dd>
    </div>
  );
}

export function ApplicationsTable({
  rows,
  roles,
  filters,
  page,
  pages,
  missingTable,
}: {
  rows: Application[];
  roles: string[];
  filters: Filters;
  page: number;
  pages: number;
  missingTable: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [f, setF] = useState(filters);
  const qs = (next: Filters, p = 1) => {
    const sp = new URLSearchParams({ ...next, page: String(p) });
    for (const [k, v] of [...sp]) if (!v || (k === "page" && v === "1")) sp.delete(k);
    const q = sp.toString();
    return `/admin/applications${q ? `?${q}` : ""}`;
  };
  const filter = (k: keyof Filters, v: string) => {
    const next = { ...f, [k]: v };
    setF(next);
    router.push(qs(next));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Filters apply as soon as one changes. */}
      <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-line bg-bg-elev p-3 sm:p-4">
        <Select
          size="sm"
          aria-label="Category"
          value={f.category}
          onChange={(v) => filter("category", v)}
          options={[{ value: "", label: "All categories" }, ...CAREER_CATEGORIES.map((c) => ({ value: c, label: c }))]}
        />
        <Select
          size="sm"
          aria-label="Role"
          value={f.role}
          onChange={(v) => filter("role", v)}
          options={[
            { value: "", label: "All roles" },
            ...roles.map((r) => ({ value: r, label: r })),
            { value: "Other", label: "Other" },
          ]}
        />
        <Select
          size="sm"
          aria-label="Status"
          value={f.status}
          onChange={(v) => filter("status", v)}
          options={[
            { value: "", label: "All statuses" },
            ...APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
          ]}
        />
        {(f.category || f.role || f.status) && (
          <Button
            variant="ghost"
            onClick={() => (
              setF({ category: "", role: "", status: "" }),
              router.push(qs({ category: "", role: "", status: "" }))
            )}
          >
            Clear filters
          </Button>
        )}
        <a
          href="/admin/applications/export"
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

      {missingTable ? (
        <p className="rounded-[18px] border border-line bg-bg-elev p-6 text-sm font-medium text-danger">
          The applications table isn’t in the database yet. Apply the careers database update (supabase/migrations,
          “careers”) and reload.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-bg-elev p-10 text-center text-fg-2">
          No applications match.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((a) => {
            const isOpen = open === a.id;
            return (
              <li
                key={a.id}
                className={`overflow-hidden rounded-[18px] border bg-bg-elev transition-shadow ${
                  isOpen
                    ? "border-[color-mix(in_srgb,var(--brand)_35%,var(--line))] shadow-[0_14px_40px_-24px_rgba(0,0,0,0.35)]"
                    : "border-line"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : a.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 p-4 text-left hover:bg-hover sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-base font-bold uppercase text-brand"
                  >
                    {a.full_name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-bold">{a.full_name}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
                      <span className="rounded-full bg-chip px-2.5 py-1">{a.role}</span>
                      <span className="rounded-full bg-chip px-2.5 py-1">{a.category}</span>
                      <span className="rounded-full bg-chip px-2.5 py-1">{a.experience}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
                    <span className="flex items-center gap-1.5">
                      {a.notify_error && (
                        <span className="rounded-full bg-[color-mix(in_srgb,var(--danger)_14%,white)] px-2.5 py-1 font-bold text-danger">
                          Email failed
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 font-bold ${STATUS_LOOK[a.status] ?? "bg-chip"}`}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </span>
                    <span className="text-fg-2 max-sm:hidden">{fmt.format(new Date(a.created_at))}</span>
                  </span>
                  <span aria-hidden="true" className={`text-fg-2 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-5 border-t border-line p-4 sm:p-6">
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <Info label="Email">
                        <a href={`mailto:${a.email}`} className="font-medium underline underline-offset-2">
                          {a.email}
                        </a>
                      </Info>
                      <Info label="Phone / WhatsApp">
                        <a href={`tel:${a.phone}`} className="font-medium underline underline-offset-2">
                          {a.phone}
                        </a>
                      </Info>
                      <Info label="Portfolio / LinkedIn">
                        {a.portfolio_url ? (
                          <a
                            href={a.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline underline-offset-2"
                          >
                            {a.portfolio_url}
                          </a>
                        ) : (
                          <span className="text-fg-2">Not given</span>
                        )}
                      </Info>
                      <Info label="Resume">
                        {a.resume_name ? (
                          <>
                            {a.resume_name} <span className="text-fg-2">(attached to the HR email)</span>
                          </>
                        ) : (
                          <span className="text-fg-2">None</span>
                        )}
                      </Info>
                      <Info label="Applied">{fmt.format(new Date(a.created_at))}</Info>
                      <Info label="Message" wide>
                        {a.message ? (
                          <span className="block whitespace-pre-line rounded-xl bg-chip px-4 py-3">{a.message}</span>
                        ) : (
                          <span className="text-fg-2">No message</span>
                        )}
                      </Info>
                    </dl>

                    {a.notify_error && (
                      <div
                        role="note"
                        className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,white)] bg-[color-mix(in_srgb,var(--danger)_7%,white)] px-4 py-3 text-sm"
                      >
                        <p className="font-bold text-danger">The HR email for this application was not sent.</p>
                        <p className="mt-1 text-fg">{explain(a.notify_error)}</p>
                        {a.resume_name && (
                          <p className="mt-1 text-fg-2">
                            The resume was only in that email, so ask the applicant to send it again.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                      <a
                        href={whatsappLink(
                          a.phone.replace(/\D/g, ""),
                          `Hi ${a.full_name}, this is the HR team at RohTre Media about your application for ${a.role}.`,
                        )}
                        target="_blank"
                        rel="noopener"
                        className="rm-press inline-flex h-11 items-center rounded-full bg-[#1f9d4c] px-5 text-sm font-semibold text-white"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`mailto:${a.email}?subject=${encodeURIComponent(`Your application at RohTre Media (${a.role})`)}`}
                        className="rm-press inline-flex h-11 items-center rounded-full bg-chip px-5 text-sm font-semibold hover:bg-chip-hover"
                      >
                        Email
                      </a>
                      <span className="mx-1 h-6 w-px bg-line max-sm:hidden" aria-hidden="true" />
                      <span className="text-sm font-semibold text-fg-2">Status</span>
                      <Select
                        size="sm"
                        aria-label="Status"
                        value={a.status}
                        disabled={pending}
                        onChange={(s) =>
                          start(async () => void (await setApplicationStatus(a.id, s), router.refresh()))
                        }
                        options={APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
                      />
                      <Button
                        className="ml-auto"
                        variant={armed === a.id ? "danger" : "ghost"}
                        disabled={pending}
                        onClick={() => {
                          if (armed !== a.id) return setArmed(a.id);
                          setArmed(null);
                          start(async () => {
                            const res = await deleteApplication(a.id);
                            setMessage(res.ok ? "Application deleted." : (res.error ?? "Couldn’t delete."));
                            router.refresh();
                          });
                        }}
                      >
                        {armed === a.id ? "Click again to delete for good" : "Delete"}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-3 text-sm">
          {page > 1 && <Link href={qs(f, page - 1)}>← Newer</Link>}
          <span className="text-fg-2">
            Page {page} of {pages}
          </span>
          {page < pages && <Link href={qs(f, page + 1)}>Older →</Link>}
        </nav>
      )}
    </div>
  );
}
