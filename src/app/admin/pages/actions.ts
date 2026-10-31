"use server";

import { createHash, randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { audit } from "@/lib/audit";
import { canManage, requireStaff, type Staff } from "@/lib/auth";
import { headlineFor, slugFor, type PageDims } from "@/lib/dimensions";
import { LANDING_TAG, pageTag } from "@/lib/landing-data";
import { cleanupAfterEdit } from "@/lib/media.server";
import {
  contentForCountry,
  createLandingPage,
  dimensionMap,
  loadLandingPage,
  publishIssues,
  publishPage,
  saveDraft,
} from "@/lib/page-ops";
import type { PublishIssue } from "@/lib/publish-check";
import { getSettings } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";
import { pageContentSchema } from "@/sections/schemas";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** R24: publishing is for the developer; the owner too once "Owner can publish" is on. */
async function canPublish(staff: Staff): Promise<boolean> {
  if (staff.role === "developer") return true;
  if (staff.role === "owner") return (await getSettings()).founderCanPublish;
  return false;
}

function refresh(slug: string) {
  updateTag(pageTag(slug));
  updateTag(LANDING_TAG);
}

export async function createPage(
  serviceId: string,
  nicheId: string,
  countryId: string,
): Promise<Result<{ id: string }> | { ok: false; error: string; existingId: string }> {
  const staff = await requireStaff();
  const db = await supabaseServer();
  const all = await dimensionMap(db);
  const dims = { service: all.get(serviceId), niche: all.get(nicheId), country: all.get(countryId) };
  if (dims.service?.type_key !== "service" || dims.niche?.type_key !== "niche" || dims.country?.type_key !== "country")
    return { ok: false, error: "Choose a service, a niche and a country." };
  const slug = slugFor(dims as PageDims);
  if (slug.length > 120 || headlineFor(dims as PageDims).length > 120)
    return { ok: false, error: "That combination is too long. Shorten the wording of one of the options." };
  const { data: existing } = await db.from("pages").select("id").eq("slug", slug).maybeSingle();
  if (existing)
    return { ok: false, error: `A page for this combination already exists: /lp/${slug}.`, existingId: existing.id };
  try {
    const page = await createLandingPage(db, dims as PageDims, {
      note: "Created from the master template",
      userId: staff.userId,
    });
    await audit(staff, "page.create", "page", page.id, { slug: page.slug });
    refresh(page.slug);
    return { ok: true, id: page.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn’t create the page." };
  }
}

/** Save the editor's content as a new draft version. */
export async function savePage(pageId: string, rawContent: unknown, note: string): Promise<Result<{ number: number }>> {
  const staff = await requireStaff();
  const parsed = pageContentSchema.safeParse(rawContent);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors };
  }
  const db = await supabaseServer();
  const before = await loadLandingPage(db, { id: pageId });

  // R26: raw custom HTML (scripts allowed) is for the owner/developer only.
  if (!canManage(staff.role)) {
    const rawBefore = JSON.stringify(
      (before.content?.sections ?? [])
        .filter((s) => s.type === "customHtml" && s.props.mode === "raw")
        .map((s) => s.props),
    );
    const rawAfter = JSON.stringify(
      parsed.data.sections.filter((s) => s.type === "customHtml" && s.props.mode === "raw").map((s) => s.props),
    );
    if (rawAfter !== rawBefore) return { ok: false, error: "Only the owner or developer can add or change raw HTML." };
  }

  const saved = await saveDraft(db, pageId, parsed.data, {
    note: note.slice(0, 200) || undefined,
    userId: staff.userId,
  });
  const cleaned = await cleanupAfterEdit(before.rawContent, parsed.data);
  await audit(staff, "page.save", "page", pageId, {
    version: saved.number,
    slug: before.page.slug,
    mediaCleanup: cleaned,
  });
  refresh(before.page.slug);
  return { ok: true, number: saved.number };
}

export async function checkPage(pageId: string): Promise<PublishIssue[]> {
  await requireStaff();
  const db = await supabaseServer();
  return publishIssues(db, await loadLandingPage(db, { id: pageId }));
}

export async function publish(pageId: string): Promise<Result<{ issues: PublishIssue[] }>> {
  const staff = await requireStaff();
  if (!(await canPublish(staff)))
    return {
      ok: false,
      error: "Publishing is for the developer (the owner can publish once it’s switched on in Settings).",
    };
  const db = await supabaseServer();
  const issues = await publishPage(db, pageId, staff.userId);
  if (issues.length) return { ok: true, issues };
  const { page } = await loadLandingPage(db, { id: pageId });
  await audit(staff, "page.publish", "page", pageId, { slug: page.slug, version: page.published_version_id });
  refresh(page.slug);
  return { ok: true, issues: [] };
}

export async function unpublish(pageId: string): Promise<Result> {
  const staff = await requireStaff();
  if (!(await canPublish(staff))) return { ok: false, error: "Only the developer can take a page offline." };
  const db = await supabaseServer();
  const { page } = await loadLandingPage(db, { id: pageId });
  const { error } = await db.from("pages").update({ status: "draft" }).eq("id", pageId);
  if (error) return { ok: false, error: error.message };
  await audit(staff, "page.unpublish", "page", pageId, { slug: page.slug });
  refresh(page.slug);
  return { ok: true };
}

export async function setPageSettings(
  pageId: string,
  input: { slug: string; visibility: "public" | "unlisted" | "private" },
): Promise<Result<{ slug: string }>> {
  const staff = await requireStaff({ manage: true });
  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120)
    return { ok: false, error: "The URL may only use a-z, 0-9 and single dashes." };
  if (!["public", "unlisted", "private"].includes(input.visibility))
    return { ok: false, error: "Choose a visibility." };
  const db = await supabaseServer();
  const { page } = await loadLandingPage(db, { id: pageId });
  const { error } = await db
    .from("pages")
    .update({ slug, visibility: input.visibility, slug_auto: slug === page.slug ? page.slug_auto : false })
    .eq("id", pageId);
  if (error)
    return {
      ok: false,
      error: error.message.includes("duplicate") ? "Another page already uses that URL." : error.message,
    };
  await audit(staff, "page.settings", "page", pageId, { from: page.slug, to: slug, visibility: input.visibility });
  refresh(page.slug);
  refresh(slug);
  return { ok: true, slug };
}

/** R24: an expiring preview link (7 days) to the current draft. Only a hash is stored. */
export async function createPreviewLink(pageId: string): Promise<Result<{ path: string; expires: string }>> {
  const staff = await requireStaff();
  const db = await supabaseServer();
  const { page } = await loadLandingPage(db, { id: pageId });
  const versionId = page.draft_version_id ?? page.published_version_id;
  if (!versionId) return { ok: false, error: "Save the page first." };
  const token = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const { error } = await db.from("preview_tokens").insert({
    token_hash: createHash("sha256").update(token).digest("hex"),
    page_id: pageId,
    version_id: versionId,
    expires_at: expires.toISOString(),
    created_by: staff.userId,
  });
  if (error) return { ok: false, error: error.message };
  await audit(staff, "page.preview_link", "page", pageId, { expires: expires.toISOString() });
  return { ok: true, path: `/preview/${token}`, expires: expires.toISOString() };
}

/** Rollback (R24): copy an older version into a new draft. */
export async function restoreVersion(pageId: string, versionId: string): Promise<Result<{ number: number }>> {
  const staff = await requireStaff();
  const db = await supabaseServer();
  const { data } = await db
    .from("page_versions")
    .select("content, number")
    .eq("id", versionId)
    .eq("page_id", pageId)
    .maybeSingle();
  const parsed = pageContentSchema.safeParse(data?.content);
  if (!parsed.success) return { ok: false, error: "That version can’t be restored (its content is no longer valid)." };
  const { page } = await loadLandingPage(db, { id: pageId });
  const saved = await saveDraft(db, pageId, parsed.data, {
    note: `Restored version ${data?.number}`,
    userId: staff.userId,
  });
  await audit(staff, "page.restore", "page", pageId, { from: data?.number, to: saved.number });
  refresh(page.slug);
  return { ok: true, number: saved.number };
}

/** R7: duplicate this page for another country. */
export async function duplicateForCountry(pageId: string, countryId: string): Promise<Result<{ id: string }>> {
  const staff = await requireStaff();
  const db = await supabaseServer();
  const loaded = await loadLandingPage(db, { id: pageId });
  if (!loaded.content) return { ok: false, error: "This page’s content is invalid; fix it first." };
  const all = await dimensionMap(db);
  const country = all.get(countryId);
  if (country?.type_key !== "country") return { ok: false, error: "Choose a country." };
  const target = { ...loaded.dims, country } as PageDims;
  const page = await createLandingPage(db, target, {
    content: contentForCountry(loaded.content, target),
    note: `Duplicated from /lp/${loaded.page.slug}`,
    userId: staff.userId,
  });
  await audit(staff, "page.duplicate", "page", page.id, { from: loaded.page.slug, to: page.slug });
  refresh(page.slug);
  return { ok: true, id: page.id };
}

/**
 * Delete a landing page for good (owner/developer): its versions, preview
 * links and tags go with it (database cascade); leads it brought in are kept.
 * Images and videos from any of its versions are removed from Cloudinary too,
 * unless another page or section still uses them.
 * The page leaves the site and the sitemap at once (cache tags), no redeploy.
 */
export async function deletePage(pageId: string, confirmSlug: string): Promise<Result> {
  const staff = await requireStaff({ manage: true });
  const db = await supabaseServer();
  const { page } = await loadLandingPage(db, { id: pageId });
  if (confirmSlug.trim() !== page.slug) return { ok: false, error: "Type the page URL exactly to confirm." };
  const { data: versions } = await db.from("page_versions").select("content").eq("page_id", pageId);
  const { data, error } = await db.from("pages").delete().eq("id", pageId).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "This page couldn’t be deleted (owner or developer only)." };
  const cleaned = await cleanupAfterEdit(versions?.map((v) => v.content) ?? [], null);
  await audit(staff, "page.delete", "page", pageId, { slug: page.slug, mediaCleanup: cleaned });
  refresh(page.slug);
  return { ok: true };
}
