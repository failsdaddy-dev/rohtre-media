"use server";

import { updateTag } from "next/cache";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import {
  isCustomValue,
  optionNameSchema,
  optionSlugSchema,
  optionWordingSchema,
  parseNicheWording,
  type DimensionValue,
} from "@/lib/dimensions";
import { LANDING_TAG } from "@/lib/landing-data";
import { dimensionMap } from "@/lib/page-ops";
import { supabaseServer } from "@/lib/supabase/server";

// Add, rename, hide, reorder and delete the Service, Niche and Country options
// of the "New landing page" card. Options are rows in dimension_values, so a
// new one works everywhere the seeded ones do (proof tags, matching, WhatsApp
// message). Owner/developer only, as the table's RLS already requires.

export type OptionType = "service" | "niche" | "country";
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const TYPES: OptionType[] = ["service", "niche", "country"];

function wordingFields(type: OptionType, wording: string, attrs: Record<string, unknown>) {
  if (type !== "niche") return { headline_label: wording, attrs };
  const { headline_label, noBrands } = parseNicheWording(wording);
  const next = { ...attrs };
  delete next.noBrands;
  return { headline_label, attrs: noBrands ? { ...next, noBrands: true } : next };
}

export async function addOption(
  type: OptionType,
  input: { label: string; slug: string; wording: string },
): Promise<Result<{ option: DimensionValue }>> {
  const staff = await requireStaff({ manage: true });
  if (!TYPES.includes(type)) return { ok: false, error: "Choose a service, niche or country." };
  const label = optionNameSchema.safeParse(input.label);
  const slug = optionSlugSchema.safeParse(input.slug);
  const wording = optionWordingSchema.safeParse(input.wording);
  if (!label.success) return { ok: false, error: label.error.issues[0].message };
  if (!slug.success) return { ok: false, error: slug.error.issues[0].message };
  if (!wording.success) return { ok: false, error: wording.error.issues[0].message };

  const db = await supabaseServer();
  const all = await dimensionMap(db);
  const sameType = [...all.values()].filter((v) => v.type_key === type);
  if (sameType.some((v) => v.slug === slug.data))
    return { ok: false, error: `The URL text “${slug.data}” is already used by another ${type}.` };
  const sort = Math.max(0, ...sameType.map((v) => v.sort ?? 0)) + 10;

  const { data, error } = await db
    .from("dimension_values")
    .insert({
      type_key: type,
      slug: slug.data,
      label: label.data,
      sort,
      ...wordingFields(type, wording.data, { custom: true }),
    })
    .select("id, type_key, parent_id, slug, label, headline_label, attrs, active, sort")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Couldn’t save this option." };
  await audit(staff, "option.add", "dimension_value", data.id, { type, slug: slug.data });
  updateTag(LANDING_TAG);
  return { ok: true, option: data as DimensionValue };
}

/** Rename an option. Its URL text stays, so pages already made from it keep their address. */
export async function renameOption(id: string, input: { label: string; wording: string }): Promise<Result> {
  const staff = await requireStaff({ manage: true });
  const label = optionNameSchema.safeParse(input.label);
  const wording = optionWordingSchema.safeParse(input.wording);
  if (!label.success) return { ok: false, error: label.error.issues[0].message };
  if (!wording.success) return { ok: false, error: wording.error.issues[0].message };
  const db = await supabaseServer();
  const value = (await dimensionMap(db)).get(id);
  if (!value) return { ok: false, error: "That option no longer exists." };
  const { error } = await db
    .from("dimension_values")
    .update({ label: label.data, ...wordingFields(value.type_key as OptionType, wording.data, value.attrs) })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit(staff, "option.rename", "dimension_value", id, { from: value.label, to: label.data });
  updateTag(LANDING_TAG);
  return { ok: true };
}

/** Hide or show an option in the dropdowns. Pages already made from it are not affected. */
export async function setOptionActive(id: string, active: boolean): Promise<Result> {
  const staff = await requireStaff({ manage: true });
  const db = await supabaseServer();
  const { error } = await db.from("dimension_values").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit(staff, active ? "option.show" : "option.hide", "dimension_value", id);
  return { ok: true };
}

export async function moveOption(id: string, direction: "up" | "down"): Promise<Result> {
  await requireStaff({ manage: true });
  const db = await supabaseServer();
  const all = await dimensionMap(db);
  const value = all.get(id);
  if (!value) return { ok: false, error: "That option no longer exists." };
  const list = [...all.values()].filter((v) => v.type_key === value.type_key);
  const from = list.findIndex((v) => v.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= list.length) return { ok: true };
  [list[from], list[to]] = [list[to], list[from]];
  // Renumber, so options with equal sort values still move.
  for (const [i, v] of list.entries()) {
    const sort = (i + 1) * 10;
    if (v.sort === sort) continue;
    const { error } = await db.from("dimension_values").update({ sort }).eq("id", v.id);
    if (error) return { ok: false, error: error.message };
  }
  updateTag(LANDING_TAG);
  return { ok: true };
}

/** Custom options only, and only when nothing uses them. Seeded options can be hidden instead. */
export async function deleteOption(id: string): Promise<Result> {
  const staff = await requireStaff({ manage: true });
  const db = await supabaseServer();
  const value = (await dimensionMap(db)).get(id);
  if (!value) return { ok: false, error: "That option no longer exists." };
  if (!isCustomValue(value)) return { ok: false, error: "Built-in options can’t be deleted. Hide it instead." };
  const { count: pages } = await db
    .from("page_dimensions")
    .select("page_id", { count: "exact", head: true })
    .eq("value_id", id);
  if (pages)
    return {
      ok: false,
      error: `“${value.label}” is used by ${pages} landing page${pages === 1 ? "" : "s"}. Delete those pages first, or hide this option.`,
    };
  const { count: tags } = await db
    .from("proof_tags")
    .select("item_id", { count: "exact", head: true })
    .eq("value_id", id);
  if (tags)
    return {
      ok: false,
      error: `“${value.label}” is tagged on ${tags} proof item${tags === 1 ? "" : "s"}. Remove the tag${tags === 1 ? "" : "s"} first, or hide this option.`,
    };
  const { error } = await db.from("dimension_values").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit(staff, "option.delete", "dimension_value", id, { type: value.type_key, slug: value.slug });
  updateTag(LANDING_TAG);
  return { ok: true };
}
