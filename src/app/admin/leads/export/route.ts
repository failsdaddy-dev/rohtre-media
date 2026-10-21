import { audit } from "@/lib/audit";
import { canManage, getStaff, needsSecondFactor } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { supabaseServer } from "@/lib/supabase/server";

// GET /admin/leads/export: every lead as CSV (owner/developer only, R23).
const COLUMNS = [
  "created_at",
  "name",
  "phone",
  "email",
  "business_type",
  "website",
  "ad_spend_range",
  "interest",
  "message",
  "page_path",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "referrer",
  "consent",
  "consent_at",
  "consent_text_version",
  "status",
];

export async function GET() {
  const staff = await getStaff();
  if (!staff || !canManage(staff.role) || needsSecondFactor(staff)) return new Response("Forbidden", { status: 403 });
  const sb = await supabaseServer();
  const { data, error } = await sb.from("leads").select(COLUMNS.join(",")).order("created_at", { ascending: false });
  if (error) return new Response("Export failed", { status: 500 });
  await audit(staff, "leads.export", "leads", null, { count: data?.length ?? 0 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv((data ?? []) as unknown as Record<string, unknown>[], COLUMNS), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rohtre-leads-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
