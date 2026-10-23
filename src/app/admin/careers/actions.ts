"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { careersSchema, parseCareers } from "@/content/careers-schema";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { CAREERS_TAG } from "@/lib/careers-data";
import { cleanupAfterEdit } from "@/lib/media.server";
import { supabaseServer } from "@/lib/supabase/server";

/** Remove anything that looks like an HTML tag from every text field (the page also escapes all text). */
function stripTags(v: unknown): unknown {
  if (typeof v === "string") return v.replace(/<[^>]*>/g, "");
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripTags(x)]));
  return v;
}

/** Save the Careers page content. Goes live straight away (the page's cache tag is refreshed). */
export async function saveCareers(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors: Record<string, string> }> {
  const staff = await requireStaff();
  const parsed = careersSchema.safeParse(stripTags(raw));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors };
  }
  const sb = await supabaseServer();
  const { data: before } = await sb.from("page_content").select("data").eq("key", "careers").maybeSingle();
  const { error } = await sb
    .from("page_content")
    .upsert({ key: "careers", data: parsed.data, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn’t save the Careers page.", fieldErrors: {} };
  const cleaned = await cleanupAfterEdit(parseCareers(before?.data), parsed.data);
  await audit(staff, "careers.save", "page_content", "careers", { mediaCleanup: cleaned });
  updateTag(CAREERS_TAG);
  return { ok: true };
}

const emails = z.array(z.email()).max(10);

/** HR addresses that receive each application (private table; owner/developer only). */
export async function saveHrEmails(text: string): Promise<{ ok: boolean; error?: string }> {
  const staff = await requireStaff({ manage: true });
  const list = [
    ...new Set(
      text
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const parsed = emails.safeParse(list);
  if (!parsed.success) return { ok: false, error: "Enter valid email addresses, one per line (up to 10)." };
  const sb = await supabaseServer();
  const { error } = await sb.from("careers_private").upsert({ id: true, notify_emails: parsed.data });
  if (error) return { ok: false, error: "Couldn’t save. Has the careers database update been applied?" };
  await audit(staff, "careers.hr_emails", "careers_private", null, { count: parsed.data.length });
  return { ok: true };
}
