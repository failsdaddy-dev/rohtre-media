"use server";

import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

/** Delete one lead, e.g. when the person asks (DPDP right to erasure, R38). */
export async function deleteLead(id: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const staff = await requireStaff({ manage: true });
  const sb = await supabaseServer();
  const { error } = await sb.from("leads").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit(staff, "lead.delete", "lead", id, { reason: reason.slice(0, 200) });
  return { ok: true };
}

export async function setLeadStatus(id: string, status: string): Promise<{ ok: boolean }> {
  const staff = await requireStaff({ manage: true });
  if (!["new", "contacted", "won", "lost", "spam"].includes(status)) return { ok: false };
  const sb = await supabaseServer();
  const { error } = await sb.from("leads").update({ status }).eq("id", id);
  if (!error) await audit(staff, "lead.status", "lead", id, { status });
  return { ok: !error };
}

/** Delete every lead older than the retention setting (R38). */
export async function purgeOldLeads(): Promise<{ ok: boolean; deleted?: number }> {
  const staff = await requireStaff({ manage: true });
  const admin = supabaseAdmin();
  if (!admin) return { ok: false };
  const { data, error } = await admin.rpc("purge_old_leads");
  if (error) return { ok: false };
  await audit(staff, "leads.purge", "leads", null, { deleted: data });
  return { ok: true, deleted: data as number };
}
