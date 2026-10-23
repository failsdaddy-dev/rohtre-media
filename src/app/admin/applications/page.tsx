import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { CAREER_CATEGORIES } from "@/content/careers-schema";
import { requireStaff } from "@/lib/auth";
import { APPLICATION_STATUSES } from "@/lib/career-application";
import { getCareersContent } from "@/lib/careers-data";
import { supabaseServer } from "@/lib/supabase/server";
import { ApplicationsTable, type Application } from "./applications-table";

export const metadata: Metadata = { title: "Applications" };

const PER_PAGE = 50;
const pick = (v: unknown, allowed: readonly string[]) => (typeof v === "string" && allowed.includes(v) ? v : "");

async function ApplicationsScreen({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff({ manage: true });
  const params = await searchParams;
  const content = await getCareersContent();
  const roles = content.form.roles;
  const filters = {
    category: pick(params.category, CAREER_CATEGORIES),
    status: pick(params.status, APPLICATION_STATUSES),
    role: typeof params.role === "string" ? params.role.slice(0, 80) : "",
  };
  const page = Math.max(1, Number(params.page) || 1);
  const sb = await supabaseServer();
  let query = sb
    .from("careers_applications")
    .select(
      "id, created_at, category, full_name, email, phone, role, experience, portfolio_url, message, resume_name, status, notify_error",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.role === "Other") query = query.like("role", "Other:%");
  else if (filters.role) query = query.eq("role", filters.role);
  const { data, count, error } = await query;
  return (
    <AdminFrame staff={staff} current="/admin/applications" title={`Applications (${count ?? 0})`}>
      <ApplicationsTable
        rows={(data ?? []) as Application[]}
        roles={roles}
        filters={filters}
        page={page}
        pages={Math.max(1, Math.ceil((count ?? 0) / PER_PAGE))}
        missingTable={Boolean(error)}
      />
    </AdminFrame>
  );
}

export default function Page(props: PageProps<"/admin/applications">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ApplicationsScreen searchParams={props.searchParams} />
    </Suspense>
  );
}
