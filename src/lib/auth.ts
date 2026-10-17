import "server-only";
import { SUPABASE_CONFIGURED } from "./env";
import { supabaseServer } from "./supabase/server";

export type Role = "owner" | "developer" | "editor";
export type Staff = { userId: string; email: string | null; role: Role };

/** The signed-in staff member, or null (signed out, inactive, or Supabase not set up). */
export async function getStaff(): Promise<Staff | null> {
  if (!SUPABASE_CONFIGURED) return null;
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await sb.from("profiles").select("role, active").eq("user_id", userId).maybeSingle();
  if (!profile?.active) return null;
  return { userId, email: (data.claims.email as string | undefined) ?? null, role: profile.role as Role };
}
