"use server";

import { updateTag } from "next/cache";
import { DEFAULT_BRANDS, DEFAULT_WORK } from "@/content/work-defaults";
import { brandDataOf, brandSchema, parseSections, RESERVED_SLUGS, SLUG_RE, workSchema } from "@/content/work-schema";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { cleanupAfterEdit } from "@/lib/media.server";
import { supabaseServer } from "@/lib/supabase/server";
import { BRANDS_TAG, WORK_TAG } from "@/lib/work-data";

// Admin → Work page: the page itself (page_content "work") and its brands
// (public.work_brands). Every save is checked again here (Zod), all text has
// tags stripped, and the pages refresh at once (updateTag): no redeploy.

type Result = { ok: true; id?: string } | { ok: false; error: string; fieldErrors: Record<string, string> };

/** Remove anything that looks like an HTML tag from every text field (the page also escapes all text). */
function stripTags(v: unknown): unknown {
  if (typeof v === "string") return v.replace(/<[^>]*>/g, "");
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripTags(x)]));
  return v;
}

const issues = (e: { issues: { path: PropertyKey[]; message: string }[] }) => {
  const fieldErrors: Record<string, string> = {};
  for (const i of e.issues) fieldErrors[i.path.map(String).join(".")] ??= i.message;
  return fieldErrors;
};

/** Save the Work page content. Goes live straight away. */
export async function saveWork(raw: unknown): Promise<Result> {
  const staff = await requireStaff();
  const parsed = workSchema.safeParse(stripTags(raw));
  if (!parsed.success)
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors: issues(parsed.error) };
  const sb = await supabaseServer();
  const { data: before } = await sb.from("page_content").select("data").eq("key", "work").maybeSingle();
  const { error } = await sb
    .from("page_content")
    .upsert({ key: "work", data: parsed.data, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn’t save the Work page.", fieldErrors: {} };
  const old = before?.data ? parseSections(workSchema, before.data, DEFAULT_WORK) : DEFAULT_WORK;
  const cleaned = await cleanupAfterEdit(old, parsed.data);
  await audit(staff, "work.save", "page_content", "work", { mediaCleanup: cleaned });
  updateTag(WORK_TAG);
  return { ok: true };
}

/** Why a slug can't be used (format and reserved words; uniqueness is checked on save). */
function slugProblem(slug: string): string | null {
  if (!slug) return "Enter a slug.";
  if (slug.length > 60) return "Keep the slug to 60 characters or fewer.";
  if (!SLUG_RE.test(slug)) return "Use lowercase letters, numbers and single hyphens only (e.g. law-care-legal).";
  if (RESERVED_SLUGS.includes(slug)) return `“${slug}” is reserved. Choose another slug.`;
  return null;
}

export type BrandInput = { id: string | null; slug: string; published: boolean; data: unknown };

/**
 * Create or update a brand. A published brand's slug is locked (its page is
 * live): to change it, save it unpublished first; the old URL then 404s.
 */
export async function saveBrand(input: BrandInput): Promise<Result> {
  const staff = await requireStaff();
  const slug = String(input.slug ?? "").trim();
  const problem = slugProblem(slug);
  if (problem) return { ok: false, error: problem, fieldErrors: { slug: problem } };
  const parsed = brandSchema.safeParse(stripTags(input.data));
  if (!parsed.success)
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors: issues(parsed.error) };
  const published = Boolean(input.published);
  const sb = await supabaseServer();

  const { data: clash } = await sb.from("work_brands").select("id").eq("slug", slug).maybeSingle();
  if (clash && clash.id !== input.id) {
    const msg = `Another brand already uses “${slug}”. Choose another slug.`;
    return { ok: false, error: msg, fieldErrors: { slug: msg } };
  }

  if (input.id) {
    const { data: before, error: readError } = await sb
      .from("work_brands")
      .select("slug, published, data")
      .eq("id", input.id)
      .maybeSingle();
    if (readError || !before)
      return { ok: false, error: "This brand no longer exists. Reload the page.", fieldErrors: {} };
    if (before.published && published && before.slug !== slug) {
      const msg = "This brand is published, so its slug is locked. Unpublish and save first, then change the slug.";
      return { ok: false, error: msg, fieldErrors: { slug: msg } };
    }
    const { error } = await sb
      .from("work_brands")
      .update({ slug, name: parsed.data.name, published, data: parsed.data, updated_by: staff.userId })
      .eq("id", input.id);
    if (error) return { ok: false, error: "Couldn’t save the brand.", fieldErrors: {} };
    const cleaned = await cleanupAfterEdit(before.data, parsed.data);
    await audit(staff, "work.brand.save", "work_brands", input.id, { slug, published, mediaCleanup: cleaned });
    updateTag(BRANDS_TAG);
    return { ok: true, id: input.id };
  }

  const { data: last } = await sb
    .from("work_brands")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: row, error } = await sb
    .from("work_brands")
    .insert({
      slug,
      name: parsed.data.name,
      published,
      sort_order: (last?.sort_order ?? -1) + 1,
      data: parsed.data,
      updated_by: staff.userId,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Couldn’t add the brand.", fieldErrors: {} };
  await audit(staff, "work.brand.create", "work_brands", row.id, { slug, published });
  updateTag(BRANDS_TAG);
  return { ok: true, id: row.id };
}

/** Delete a brand for good (its page then 404s). */
export async function deleteBrand(id: string): Promise<Result> {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data: before } = await sb.from("work_brands").select("slug, data").eq("id", id).maybeSingle();
  if (!before) return { ok: false, error: "This brand no longer exists. Reload the page.", fieldErrors: {} };
  const { error } = await sb.from("work_brands").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn’t delete the brand.", fieldErrors: {} };
  const cleaned = await cleanupAfterEdit(before.data, {});
  await audit(staff, "work.brand.delete", "work_brands", id, { slug: before.slug, mediaCleanup: cleaned });
  updateTag(BRANDS_TAG);
  return { ok: true };
}

/** Move a brand one place up or down in the /work grid. */
export async function moveBrand(id: string, step: -1 | 1): Promise<Result> {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data: rows, error } = await sb.from("work_brands").select("id").order("sort_order").order("created_at");
  if (error || !rows) return { ok: false, error: "Couldn’t read the brands.", fieldErrors: {} };
  const ids = rows.map((r) => r.id as string);
  const at = ids.indexOf(id);
  const to = at + step;
  if (at < 0 || to < 0 || to >= ids.length) return { ok: true };
  [ids[at], ids[to]] = [ids[to], ids[at]];
  for (const [i, rowId] of ids.entries()) {
    const { error: e } = await sb.from("work_brands").update({ sort_order: i }).eq("id", rowId);
    if (e) return { ok: false, error: "Couldn’t save the new order.", fieldErrors: {} };
  }
  await audit(staff, "work.brand.move", "work_brands", id, { step });
  updateTag(BRANDS_TAG);
  return { ok: true };
}

/** Store the ten brands copied from the live site (only slugs not in the table yet). */
export async function importLiveBrands(): Promise<Result> {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data: rows, error } = await sb.from("work_brands").select("slug, sort_order");
  if (error)
    return { ok: false, error: "The brands table isn’t set up yet (apply the migration first).", fieldErrors: {} };
  const have = new Set((rows ?? []).map((r) => r.slug as string));
  let next = Math.max(-1, ...(rows ?? []).map((r) => r.sort_order as number)) + 1;
  const add = DEFAULT_BRANDS.filter((b) => !have.has(b.slug)).map((b) => ({
    slug: b.slug,
    name: b.name,
    published: b.published,
    sort_order: next++,
    data: brandSchema.parse(brandDataOf(b)),
    updated_by: staff.userId,
  }));
  if (add.length === 0) return { ok: true };
  const { error: insertError } = await sb.from("work_brands").insert(add);
  if (insertError) return { ok: false, error: "Couldn’t add the brands.", fieldErrors: {} };
  await audit(staff, "work.brand.import", "work_brands", null, { count: add.length });
  updateTag(BRANDS_TAG);
  return { ok: true };
}
