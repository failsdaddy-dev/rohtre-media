import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { UsersManager, type StaffRow } from "./users-manager";

export const metadata: Metadata = { title: "Users" };

async function UsersScreen() {
  const staff = await requireStaff({ owner: true });
  const sb = await supabaseServer();
  const admin = supabaseAdmin();
  const [{ data: profiles }, users] = await Promise.all([
    sb.from("profiles").select("user_id, role, full_name, active, created_at").order("created_at"),
    admin ? admin.auth.admin.listUsers({ perPage: 200 }) : null,
  ]);
  const byId = new Map((users?.data.users ?? []).map((u) => [u.id, u]));
  const rows: StaffRow[] = (profiles ?? []).map((p) => {
    const u = byId.get(p.user_id as string);
    return {
      userId: p.user_id as string,
      role: p.role as StaffRow["role"],
      name: p.full_name as string | null,
      active: p.active as boolean,
      email: u?.email ?? null,
      lastSignIn: u?.last_sign_in_at ?? null,
      twoFactor: (u?.factors ?? []).some((f) => f.status === "verified"),
    };
  });
  return (
    <AdminFrame staff={staff} current="/admin/users" title="Users">
      <UsersManager rows={rows} me={staff.userId} />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <UsersScreen />
    </Suspense>
  );
}
