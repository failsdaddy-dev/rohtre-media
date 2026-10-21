"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { LANDING_TAG } from "@/lib/landing-data";
import { supabaseServer } from "@/lib/supabase/server";

export type Result = { ok: boolean; error?: string };

const path = z
  .string()
  .trim()
  .regex(/^\/[A-Za-z0-9\-._~/%]*$/, "Start with / and use a plain path (no spaces or ?query)")
  .max(300);

const redirectSchema = z
  .object({ from_path: path, to_path: path, status: z.union([z.literal(301), z.literal(308)]) })
  .refine((r) => r.from_path !== r.to_path, "A page can’t redirect to itself");

/** Add or change a redirect (owner/developer, R23). */
export async function saveRedirect(input: unknown): Promise<Result> {
  const staff = await requireStaff({ manage: true });
  const parsed = redirectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const sb = await supabaseServer();
  const { error } = await sb.from("redirects").upsert({ ...parsed.data, auto: false }, { onConflict: "from_path" });
  if (error) return { ok: false, error: "Couldn’t save the redirect." };
  await audit(staff, "redirect.save", "redirect", parsed.data.from_path, parsed.data);
  updateTag(LANDING_TAG);
  return { ok: true };
}

export async function deleteRedirect(fromPath: string): Promise<Result> {
  const staff = await requireStaff({ manage: true });
  const sb = await supabaseServer();
  const { error } = await sb.from("redirects").delete().eq("from_path", fromPath);
  if (error) return { ok: false, error: "Couldn’t delete the redirect." };
  await audit(staff, "redirect.delete", "redirect", fromPath);
  updateTag(LANDING_TAG);
  return { ok: true };
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const mappingSchema = z.object({
  id: z.uuid().optional(),
  platform: z.enum(["google", "meta", "other"]),
  campaign: z.string().trim().min(1, "Campaign is required").max(200),
  ad_group: text(200),
  keyword_theme: text(200),
  page_id: z.uuid().nullable(),
  notes: text(1000),
});

/** Add or change a row in the ad-group → page reference table (any staff, R5). */
export async function saveMapping(input: unknown): Promise<Result> {
  const staff = await requireStaff();
  const parsed = mappingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const sb = await supabaseServer();
  const { id, ...row } = parsed.data;
  const { data, error } = id
    ? await sb.from("ad_mappings").update(row).eq("id", id).select("id").single()
    : await sb.from("ad_mappings").insert(row).select("id").single();
  if (error) return { ok: false, error: "Couldn’t save the row." };
  await audit(staff, id ? "ad_mapping.update" : "ad_mapping.create", "ad_mapping", data.id as string, row);
  return { ok: true };
}

export async function deleteMapping(id: string): Promise<Result> {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { error } = await sb.from("ad_mappings").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn’t delete the row." };
  await audit(staff, "ad_mapping.delete", "ad_mapping", id);
  return { ok: true };
}
