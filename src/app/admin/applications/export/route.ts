import { audit } from "@/lib/audit";
import { canManage, getStaff } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { supabaseServer } from "@/lib/supabase/server";

// GET /admin/applications/export: every careers application as CSV (owner/developer only).
const COLUMNS = [
  "created_at",
  "category",
  "full_name",
  "email",
  "phone",
  "role",
  "experience",
  "portfolio_url",
  "message",
  "resume_name",
  "status",
  "consent_at",
  "source_page",
];

export async function GET() {
  const staff = await getStaff();
  if (!staff || !canManage(staff.role)) return new Response("Forbidden", { status: 403 });
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("careers_applications")
    .select(COLUMNS.join(","))
    .order("created_at", { ascending: false });
  if (error) return new Response("Export failed", { status: 500 });
  await audit(staff, "applications.export", "careers_applications", null, { count: data?.length ?? 0 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv((data ?? []) as unknown as Record<string, unknown>[], COLUMNS), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rohtre-applications-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
