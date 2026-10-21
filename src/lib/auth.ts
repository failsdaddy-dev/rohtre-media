import "server-only";
import { redirect } from "next/navigation";
import { SUPABASE_CONFIGURED } from "./env";
import { supabaseServer } from "./supabase/server";

export type Role = "owner" | "developer" | "editor";
export type Staff = {
  userId: string;
  email: string | null;
  role: Role;
  name: string | null;
};

type Session =
  { state: "signed-out" } | { state: "no-access"; email: string | null } | { state: "staff"; staff: Staff };

/** Reads the session and the caller's profile. Server-only; the database enforces the same rules (RLS). */
export async function readSession(): Promise<Session> {
  if (!SUPABASE_CONFIGURED) return { state: "signed-out" };
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { state: "signed-out" };
  const email = (data.claims.email as string | undefined) ?? null;
  const { data: profile } = await sb
    .from("profiles")
    .select("role, active, full_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile?.active) return { state: "no-access", email };
  return { state: "staff", staff: { userId, email, role: profile.role as Role, name: profile.full_name } };
}

/** The signed-in staff member, or null. */
export async function getStaff(): Promise<Staff | null> {
  const s = await readSession();
  return s.state === "staff" ? s.staff : null;
}

/** Owner and developer manage settings, leads and publishing (R22, R24). */
export const canManage = (role: Role) => role === "owner" || role === "developer";

/** For admin pages and actions: sends visitors without access away. */
export async function requireStaff(opts: { manage?: boolean; owner?: boolean } = {}): Promise<Staff> {
  const s = await readSession();
  if (s.state === "signed-out") redirect("/login?next=/admin");
  if (s.state === "no-access") redirect("/no-access");
  if (opts.owner && s.staff.role !== "owner") redirect("/admin?denied=1");
  if (opts.manage && !canManage(s.staff.role)) redirect("/admin?denied=1");
  return s.staff;
}
