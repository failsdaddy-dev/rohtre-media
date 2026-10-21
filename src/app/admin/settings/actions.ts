"use server";

import { updateTag } from "next/cache";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { SETTINGS_TAG } from "@/lib/settings";
import { settingsFromForm } from "@/lib/settings-form";
import { parseSettings } from "@/lib/settings-schema";
import { supabaseServer } from "@/lib/supabase/server";

export type SaveState = { status: "idle" | "saved" | "error"; errors: Record<string, string>; message?: string };

/** Saves global settings (owner/developer). RLS enforces the same rule in the database. */
export async function saveSettings(_prev: SaveState, form: FormData): Promise<SaveState> {
  const staff = await requireStaff({ manage: true });
  const sb = await supabaseServer();
  const { data: row } = await sb.from("site_settings").select("data").eq("id", true).maybeSingle();
  const current = parseSettings(row?.data);

  const result = settingsFromForm(form, current, staff.role === "owner");
  if (!result.ok) return { status: "error", errors: result.errors, message: "Please fix the highlighted fields." };

  const { error } = await sb
    .from("site_settings")
    .update({ data: result.settings, updated_by: staff.userId })
    .eq("id", true);
  if (error) return { status: "error", errors: {}, message: "Couldn’t save. Please try again." };

  const changed = Object.keys(result.settings).filter(
    (k) =>
      JSON.stringify(result.settings[k as keyof typeof current]) !== JSON.stringify(current[k as keyof typeof current]),
  );
  await audit(staff, "settings.save", "settings", null, { changed });
  updateTag(SETTINGS_TAG); // every public page picks up the new details
  return { status: "saved", errors: {} };
}
