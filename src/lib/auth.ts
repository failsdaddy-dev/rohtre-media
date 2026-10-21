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
  /** "aal2" once the user has confirmed their authenticator-app code this session. */
  aal: "aal1" | "aal2";
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
  const aal = data.claims.aal === "aal2" ? "aal2" : "aal1";
  return { state: "staff", staff: { userId, email, role: profile.role as Role, name: profile.full_name, aal } };
}

/** The signed-in staff member, or null. */
export async function getStaff(): Promise<Staff | null> {
  const s = await readSession();
  return s.state === "staff" ? s.staff : null;
}

/** Owner and developer manage settings, leads and publishing (R22, R24). */
export const canManage = (role: Role) => role === "owner" || role === "developer";

/**
 * Two-factor sign-in (R22, Gate 0 default): the owner and developer must
 * have confirmed an authenticator-app code (AAL2) before using the admin.
 * Until then every admin page sends them to /admin/security, where they can
 * set one up or enter their code. Editors may use it but aren't forced.
 * verified: https://supabase.com/docs/guides/auth/auth-mfa/totp (free, on by default)
 */
export const needsSecondFactor = (staff: Staff) => canManage(staff.role) && staff.aal !== "aal2";

/** For admin pages and actions: sends visitors without access away. */
export async function requireStaff(
  opts: { manage?: boolean; owner?: boolean; securityPage?: boolean } = {},
): Promise<Staff> {
  const s = await readSession();
  if (s.state === "signed-out") redirect("/login?next=/admin");
  if (s.state === "no-access") redirect("/no-access");
  if (!opts.securityPage && needsSecondFactor(s.staff)) redirect("/admin/security");
  if (opts.owner && s.staff.role !== "owner") redirect("/admin?denied=1");
  if (opts.manage && !canManage(s.staff.role)) redirect("/admin?denied=1");
  return s.staff;
}
