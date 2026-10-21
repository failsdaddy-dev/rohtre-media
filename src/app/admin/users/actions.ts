"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

// Staff accounts (owner only, R22). No public sign-up: the owner adds people
// here with a one-time password to pass on; they change it on Security.

export type Result = { ok: boolean; error?: string; tempPassword?: string };

const ROLE = z.enum(["owner", "developer", "editor"]);

/** 20 characters, letters and digits, no look-alikes. */
function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(20), (b) => chars[b % chars.length]).join("");
}

const newUser = z.object({
  email: z.email().max(200),
  name: z.string().trim().min(1, "Name is required").max(120),
  role: ROLE,
});

export async function createStaff(input: unknown): Promise<Result> {
  const staff = await requireStaff({ owner: true });
  const parsed = newUser.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const admin = supabaseAdmin();
  if (!admin) return { ok: false, error: "The server key isn’t set." };
  const password = tempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    return {
      ok: false,
      error: error?.code === "email_exists" ? "That email already has an account." : "Couldn’t create the account.",
    };
  }
  const sb = await supabaseServer();
  const { error: profileError } = await sb
    .from("profiles")
    .insert({ user_id: data.user.id, role: parsed.data.role, full_name: parsed.data.name, active: true });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "Couldn’t save the profile." };
  }
  await audit(staff, "user.create", "user", data.user.id, { email: parsed.data.email, role: parsed.data.role });
  return { ok: true, tempPassword: password };
}

/** True when this change would leave no active owner. */
async function lastOwner(userId: string): Promise<boolean> {
  const sb = await supabaseServer();
  const { data } = await sb.from("profiles").select("user_id").eq("role", "owner").eq("active", true);
  const owners = (data ?? []).map((r) => r.user_id as string);
  return owners.length <= 1 && owners.includes(userId);
}

export async function updateStaff(
  userId: string,
  change: { role?: string; active?: boolean; name?: string },
): Promise<Result> {
  const staff = await requireStaff({ owner: true });
  const patch: Record<string, unknown> = {};
  if (change.role !== undefined) {
    const role = ROLE.safeParse(change.role);
    if (!role.success) return { ok: false, error: "Unknown role." };
    patch.role = role.data;
  }
  if (change.active !== undefined) patch.active = Boolean(change.active);
  if (change.name !== undefined) patch.full_name = change.name.trim().slice(0, 120) || null;
  const demotes = (patch.role !== undefined && patch.role !== "owner") || patch.active === false;
  if (demotes && (await lastOwner(userId))) return { ok: false, error: "There must always be one active owner." };
  const sb = await supabaseServer();
  const { error } = await sb.from("profiles").update(patch).eq("user_id", userId);
  if (error) return { ok: false, error: "Couldn’t save." };
  await audit(staff, "user.update", "user", userId, patch);
  return { ok: true };
}

/** New one-time password, e.g. when someone forgot theirs. */
export async function resetPassword(userId: string): Promise<Result> {
  const staff = await requireStaff({ owner: true });
  const admin = supabaseAdmin();
  if (!admin) return { ok: false, error: "The server key isn’t set." };
  const password = tempPassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: "Couldn’t reset the password." };
  await audit(staff, "user.reset_password", "user", userId);
  return { ok: true, tempPassword: password };
}
