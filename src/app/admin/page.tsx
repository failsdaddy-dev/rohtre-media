import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { Panel } from "@/components/admin/ui";
import { canManage, requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

type LeadRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  interest: string | null;
  page_path: string;
  utm_source: string | null;
};

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const cell = "px-2 py-2.5";
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-fg-2">
          <tr>
            {["When", "Name", "Phone", "Email", "Interested in", "Page", "Source"].map((h) => (
              <th key={h} className="px-2 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-line">
              <td className={`${cell} whitespace-nowrap`}>{fmt.format(new Date(l.created_at))}</td>
              <td className={`${cell} font-medium`}>{l.name}</td>
              <td className={`${cell} whitespace-nowrap`}>
                <a href={`tel:${l.phone}`} className="hover:text-brand">
                  {l.phone}
                </a>
              </td>
              <td className={cell}>
                <a href={`mailto:${l.email}`} className="hover:text-brand">
                  {l.email}
                </a>
              </td>
              <td className={cell}>{l.interest ?? "—"}</td>
              <td className={`${cell} text-fg-2`}>{l.page_path}</td>
              <td className={`${cell} text-fg-2`}>{l.utm_source ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function Overview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const denied = (await searchParams).denied === "1";
  const manager = canManage(staff.role);

  let leads: LeadRow[] = [];
  let total = 0;
  if (manager) {
    const sb = await supabaseServer();
    const { data, count } = await sb
      .from("leads")
      .select("id, created_at, name, email, phone, interest, page_path, utm_source", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(20);
    leads = (data ?? []) as LeadRow[];
    total = count ?? 0;
  }

  return (
    <AdminFrame staff={staff} current="/admin" title={`Hello${staff.name ? `, ${staff.name.split(" ")[0]}` : ""}`}>
      {denied && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-4 py-3 text-sm"
        >
          That page is for the owner and developer only.
        </p>
      )}
      <div className="flex flex-col gap-6">
        {manager ? (
          <Panel title={`Website leads (${total})`}>
            {leads.length === 0 ? (
              <p className="text-fg-2">No leads yet. They appear here as soon as someone sends the contact form.</p>
            ) : (
              <LeadsTable leads={leads} />
            )}
            <p className="mt-4 text-xs text-fg-2">
              The full lead list with search, CSV export and delete-on-request arrives in Phase 4.
            </p>
          </Panel>
        ) : (
          <Panel title="Welcome">
            <p className="text-fg-2">
              Page editing arrives in Phase 4. Leads and settings are visible to the owner and developer only.
            </p>
          </Panel>
        )}
        {manager && (
          <Panel title="Quick links">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li>
                <Link href="/admin/settings" className="underline underline-offset-2">
                  Edit contact details, WhatsApp and form choices
                </Link>
              </li>
              <li>
                <Link href="/" className="underline underline-offset-2">
                  View the website
                </Link>
              </li>
            </ul>
          </Panel>
        )}
      </div>
    </AdminFrame>
  );
}

export default function Page(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Overview searchParams={props.searchParams} />
    </Suspense>
  );
}
