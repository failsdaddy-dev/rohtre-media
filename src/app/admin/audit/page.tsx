import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { Panel } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// Audit log (R24): read-only history of admin actions, newest first.
// Owner/developer only; the database refuses edits and deletes.

export const metadata: Metadata = { title: "Audit log" };

const PER_PAGE = 100;
const GROUPS: Record<string, string[]> = {
  pages: ["page", "page_content"],
  proof: ["results", "testimonials", "creatives", "concept_works", "badges"],
  media: ["media"],
  leads: ["lead", "leads"],
  routing: ["redirect", "ad_mapping"],
  users: ["user"],
  settings: ["settings"],
};
const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" });

type Row = {
  id: number;
  at: string;
  actor_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
};

async function AuditScreen({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff({ manage: true });
  const params = await searchParams;
  const group = typeof params.group === "string" && params.group in GROUPS ? params.group : "";
  const page = Math.max(1, Number(params.page) || 1);
  const sb = await supabaseServer();
  let query = sb
    .from("audit_log")
    .select("id, at, actor_email, action, entity, entity_id, details", { count: "exact" })
    .order("at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (group) query = query.in("entity", GROUPS[group]);
  const { data, count } = await query;
  const rows = (data ?? []) as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));
  const href = (p: number) => `/admin/audit?${new URLSearchParams({ ...(group && { group }), page: String(p) })}`;

  return (
    <AdminFrame staff={staff} current="/admin/audit" title="Audit log">
      <nav aria-label="Filter" className="mb-4 flex flex-wrap gap-2 text-sm">
        {["", ...Object.keys(GROUPS)].map((g) => (
          <Link
            key={g || "all"}
            href={g ? `/admin/audit?group=${g}` : "/admin/audit"}
            aria-current={group === g ? "page" : undefined}
            className={`rounded-full px-3 py-1 capitalize ${group === g ? "bg-chip-on-bg text-chip-on-fg" : "bg-chip hover:bg-chip-hover"}`}
          >
            {g || "All"}
          </Link>
        ))}
      </nav>
      <Panel title={`${count ?? 0} entries`}>
        {rows.length === 0 ? (
          <p className="text-fg-2">Nothing recorded yet.</p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-fg-2">
                <tr>
                  {["When", "Who", "Action", "Item", "Details"].map((h) => (
                    <th key={h} className="px-2 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap px-2 py-2.5">{fmt.format(new Date(r.at))}</td>
                    <td className="px-2 py-2.5">{r.actor_email ?? "—"}</td>
                    <td className="px-2 py-2.5 font-mono text-[13px]">{r.action}</td>
                    <td className="break-all px-2 py-2.5 font-mono text-[12px] text-fg-2">
                      {r.entity}
                      {r.entity_id ? ` ${r.entity_id}` : ""}
                    </td>
                    <td className="max-w-[360px] break-words px-2 py-2.5 font-mono text-[12px] text-fg-2">
                      {Object.keys(r.details ?? {}).length ? JSON.stringify(r.details).slice(0, 300) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex gap-3 text-sm">
            {page > 1 && <Link href={href(page - 1)}>← Newer</Link>}
            <span className="text-fg-2">
              Page {page} of {pages}
            </span>
            {page < pages && <Link href={href(page + 1)}>Older →</Link>}
          </nav>
        )}
      </Panel>
    </AdminFrame>
  );
}

export default function Page(props: PageProps<"/admin/audit">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AuditScreen searchParams={props.searchParams} />
    </Suspense>
  );
}
