import "server-only";
import type { Staff } from "./auth";
import { supabaseServer } from "./supabase/server";

/**
 * Append to the audit log (R24): who did what, when. Written as the signed-in
 * user (the database only accepts their own id) and never editable.
 */
export async function audit(
  staff: Staff,
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  const sb = await supabaseServer();
  const { error } = await sb.from("audit_log").insert({
    actor_id: staff.userId,
    actor_email: staff.email,
    action,
    entity,
    entity_id: entityId,
    details,
  });
  if (error) console.error("audit log write failed", action, entity, error.message);
}
