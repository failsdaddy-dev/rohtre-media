import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { canManage, requireStaff } from "@/lib/auth";
import { headlineFor } from "@/lib/dimensions";
import { sectionJsonSchemas } from "@/lib/json-schemas";
import { dimensionMap, loadLandingPage, publishIssues } from "@/lib/page-ops";
import { getSettings } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";
import { masterTemplate } from "@/sections/master-template";
import { PageEditor } from "./page-editor";

export const metadata: Metadata = { title: "Edit landing page" };

async function EditorScreen({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const db = await supabaseServer();
  let loaded;
  try {
    loaded = await loadLandingPage(db, { id });
  } catch {
    notFound();
  }
  const template = masterTemplate(loaded.dims);
  const content = loaded.content ?? template; // invalid stored content: start again from the template
  const [issues, all, settings, { data: versions }, { data: badges }] = await Promise.all([
    publishIssues(db, loaded),
    dimensionMap(db),
    getSettings(),
    db
      .from("page_versions")
      .select("id, number, note, created_at")
      .eq("page_id", id)
      .order("number", { ascending: false })
      .limit(30),
    db.from("badges").select("id, label, enabled").order("sort"),
  ]);
  const canPublish = staff.role === "developer" || (staff.role === "owner" && settings.founderCanPublish);
  const defaults = Object.fromEntries(template.sections.map((s) => [s.type, s]));
  defaults.customHtml = {
    id: "custom",
    type: "customHtml",
    variant: "contained",
    enabled: true,
    props: { html: "", mode: "sanitized" },
  };

  return (
    <AdminFrame staff={staff} current="/admin/pages" title={headlineFor(loaded.dims)}>
      <PageEditor
        key={versions?.[0]?.id ?? "new"}
        page={{
          id: loaded.page.id,
          slug: loaded.page.slug,
          status: loaded.page.status,
          visibility: loaded.page.visibility,
          isDraftNewer: loaded.page.draft_version_id !== loaded.page.published_version_id,
        }}
        initial={content}
        invalidStored={!loaded.content}
        schemas={sectionJsonSchemas()}
        defaults={defaults}
        initialIssues={issues}
        versions={(versions ?? []) as { id: string; number: number; note: string | null; created_at: string }[]}
        badgeOptions={(badges ?? []).map((b) => ({
          value: b.id as string,
          label: `${b.label}${b.enabled ? "" : " (switched off)"}`,
        }))}
        countries={[...all.values()].filter((v) => v.type_key === "country").map((v) => ({ id: v.id, label: v.label }))}
        canManage={canManage(staff.role)}
        canPublish={canPublish}
      />
    </AdminFrame>
  );
}

export default function Page({ params }: PageProps<"/admin/pages/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditorScreen params={params} />
    </Suspense>
  );
}
