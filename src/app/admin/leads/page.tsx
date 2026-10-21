import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";
import { LeadsTable, type Lead } from "./leads-table";

export const metadata: Metadata = { title: "Leads" };

const PER_PAGE = 50;

async function LeadsScreen({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff({ manage: true });
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number(params.page) || 1);
  const sb = await supabaseServer();
  let query = sb
    .from("leads")
    .select(
      "id, created_at, name, phone, email, business_type, website, ad_spend_range, interest, message, page_path, utm_source, utm_campaign, gclid, fbclid, status",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,page_path.ilike.%${safe}%`);
  }
  const [{ data, count }, settings] = await Promise.all([query, getSettings()]);
  return (
    <AdminFrame staff={staff} current="/admin/leads" title={`Leads (${count ?? 0})`}>
      <LeadsTable
        leads={(data ?? []) as Lead[]}
        q={q}
        page={page}
        pages={Math.max(1, Math.ceil((count ?? 0) / PER_PAGE))}
        retentionDays={settings.leadRetentionDays}
      />
    </AdminFrame>
  );
}

export default function Page(props: PageProps<"/admin/leads">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <LeadsScreen searchParams={props.searchParams} />
    </Suspense>
  );
}
