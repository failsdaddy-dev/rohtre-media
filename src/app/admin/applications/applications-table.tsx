"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Panel } from "@/components/admin/ui";
import { CAREER_CATEGORIES } from "@/content/careers-schema";
import { APPLICATION_STATUSES } from "@/lib/career-application";
import { whatsappLink } from "@/lib/whatsapp";
import { deleteApplication, setApplicationStatus } from "./actions";

// Careers applications inbox: filter by category, role and status; open one
// to read it; set its status; WhatsApp the applicant (a wa.me click-to-chat
// link, free, no API); delete on request; CSV export. Two-step confirm
// buttons instead of browser dialogs, like the leads list.

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
const SELECT = "rm-field h-10 px-3 text-sm";

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
  const qs = (p: number) => {
    const sp = new URLSearchParams({ ...filters, page: String(p) });
    for (const [k, v] of [...sp]) if (!v) sp.delete(k);
    return `/admin/applications?${sp}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <form action="/admin/applications" className="flex flex-wrap items-end gap-2">
          <select name="category" defaultValue={filters.category} aria-label="Category" className={SELECT}>
            <option value="">All categories</option>
            {CAREER_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select name="role" defaultValue={filters.role} aria-label="Role" className={SELECT}>
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          <select name="status" defaultValue={filters.status} aria-label="Status" className={SELECT}>
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button type="submit">Filter</Button>
        </form>
        <a
          href="/admin/applications/export"
          className="rm-press ml-auto inline-flex h-10 items-center rounded-full bg-chip-on-bg px-5 text-sm font-semibold text-chip-on-fg"
        >
          Export CSV
        </a>
      </div>
      {message && <p className="text-sm font-medium">{message}</p>}

      <Panel title="Applications">
        {missingTable ? (
          <p className="text-sm font-medium text-danger">
            The applications table isn’t in the database yet. Apply the careers database update (supabase/migrations,
            “careers”) and reload.
          </p>
        ) : rows.length === 0 ? (
          <p className="text-fg-2">No applications match.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((a) => (
              <li key={a.id} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpen(open === a.id ? null : a.id)}
                  aria-expanded={open === a.id}
                  className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="font-semibold">{a.full_name}</span>{" "}
                    <span className="text-sm text-fg-2">
                      {a.role} · {a.category} · {a.experience}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-fg-2">
                    {fmt.format(new Date(a.created_at))}
                    {a.notify_error && (
                      <span title={a.notify_error} className="rounded-full bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-2 py-0.5 font-bold text-danger">
                        not emailed
                      </span>
                    )}
                    <span className="rounded-full bg-chip px-2 py-0.5 font-bold uppercase text-fg">{a.status}</span>
                  </span>
                </button>
                {open === a.id && (
                  <div className="mt-3 grid gap-3 rounded-2xl border border-line p-4 text-sm md:grid-cols-2">
                    <p>
                      <strong>Email:</strong> <a href={`mailto:${a.email}`} className="underline">{a.email}</a>
                    </p>
                    <p>
                      <strong>Phone/WhatsApp:</strong> <a href={`tel:${a.phone}`} className="underline">{a.phone}</a>
                    </p>
                    <p className="md:col-span-2 break-words">
                      <strong>Portfolio/LinkedIn:</strong>{" "}
                      {a.portfolio_url ? (
                        <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer" className="underline">
                          {a.portfolio_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="md:col-span-2 whitespace-pre-line">
                      <strong>Message:</strong> {a.message ?? "—"}
                    </p>
                    <p className="md:col-span-2 text-fg-2">
                      Resume: {a.resume_name ? `${a.resume_name} (attached to the HR email)` : "none"}
                      {a.notify_error && ` · Notification problem: ${a.notify_error}`}
                    </p>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <a
                        href={whatsappLink(
                          a.phone.replace(/\D/g, ""),
                          `Hi ${a.full_name}, this is the HR team at RohTre Media about your application for ${a.role}.`,
                        )}
                        target="_blank"
                        rel="noopener"
                        className="rm-press inline-flex h-8 items-center rounded-full bg-[#1f9d4c] px-4 text-xs font-semibold text-white"
                      >
                        WhatsApp this applicant
                      </a>
                      {APPLICATION_STATUSES.map((s) => (
                        <Button
                          key={s}
                          className="h-8 text-xs"
                          variant={a.status === s ? "primary" : "plain"}
                          disabled={pending}
                          onClick={() => start(async () => void (await setApplicationStatus(a.id, s), router.refresh()))}
                        >
                          {s}
                        </Button>
                      ))}
                      <Button
                        className="h-8 text-xs"
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
                        {armed === a.id ? "Click again to delete for good" : "Delete (on request)"}
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
            {page > 1 && <Link href={qs(page - 1)}>← Newer</Link>}
            <span className="text-fg-2">
              Page {page} of {pages}
            </span>
            {page < pages && <Link href={qs(page + 1)}>Older →</Link>}
          </nav>
        )}
      </Panel>
    </div>
  );
}
