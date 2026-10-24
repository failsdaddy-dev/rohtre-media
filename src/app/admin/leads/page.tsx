import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";
import { LeadsTable, type Lead } from "./leads-table";

export const metadata: Metadata = { title: "Leads" };

const PER_PAGE = 50;
const COLUMNS =
  "id, created_at, name, phone, email, business_type, website, ad_spend_range, interest, message, page_path, utm_source, utm_campaign, gclid, fbclid, status";
/** Added by the contact database update (supabase/migrations, "contact_enquiries"). */
const NEW_COLUMNS = ", interested_in, notify_error";
const STATUSES = ["new", "contacted", "won", "lost", "spam"];

async function LeadsScreen({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff({ manage: true });
  const params = await searchParams;
  const filters = {
    q: typeof params.q === "string" ? params.q.trim().slice(0, 80) : "",
    status: typeof params.status === "string" && STATUSES.includes(params.status) ? params.status : "",
    source: params.source === "contact" || params.source === "other" ? params.source : "",
  };
  const page = Math.max(1, Number(params.page) || 1);
  const sb = await supabaseServer();
  const run = (columns: string) => {
    let query = sb
      .from("leads")
      .select(columns, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
    if (filters.q) {
      const safe = filters.q.replace(/[%,()]/g, " ");
      query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,page_path.ilike.%${safe}%`);
    }
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.source === "contact") query = query.eq("page_path", "/contact");
    else if (filters.source === "other") query = query.neq("page_path", "/contact");
    return query;
  };
  // Before the database update is applied, the list still loads (without the new columns).
  let res = await run(COLUMNS + NEW_COLUMNS);
  if (res.error) res = await run(COLUMNS);
  const settings = await getSettings();
  const { data, count } = res;
  return (
    <AdminFrame staff={staff} current="/admin/leads" title={`Leads (${count ?? 0})`}>
      <LeadsTable
        leads={(data ?? []) as unknown as Lead[]}
        filters={filters}
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
