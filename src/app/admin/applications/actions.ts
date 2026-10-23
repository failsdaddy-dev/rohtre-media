"use server";

import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { APPLICATION_STATUSES } from "@/lib/career-application";
import { supabaseServer } from "@/lib/supabase/server";

export async function setApplicationStatus(id: string, status: string): Promise<{ ok: boolean }> {
  const staff = await requireStaff({ manage: true });
  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) return { ok: false };
  const sb = await supabaseServer();
  const { error } = await sb.from("careers_applications").update({ status }).eq("id", id);
  if (!error) await audit(staff, "application.status", "careers_application", id, { status });
  return { ok: !error };
}

/** Delete one application, e.g. when the applicant asks (their data is gone; resumes were never stored). */
export async function deleteApplication(id: string): Promise<{ ok: boolean; error?: string }> {
  const staff = await requireStaff({ manage: true });
  const sb = await supabaseServer();
  const { error } = await sb.from("careers_applications").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit(staff, "application.delete", "careers_application", id, {});
  return { ok: true };
}
