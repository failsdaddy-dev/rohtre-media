import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { canManage, requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { RoutingEditor, type Mapping, type Redirect } from "./routing-editor";

export const metadata: Metadata = { title: "Redirects & ads" };

async function RoutingScreen() {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const [redirects, mappings, pages] = await Promise.all([
    sb
      .from("redirects")
      .select("from_path, to_path, status, auto, created_at")
      .order("created_at", { ascending: false }),
    sb
      .from("ad_mappings")
      .select("id, platform, campaign, ad_group, keyword_theme, page_id, notes")
      .order("campaign")
      .order("ad_group"),
    sb.from("pages").select("id, slug").order("slug"),
  ]);
  return (
    <AdminFrame staff={staff} current="/admin/routing" title="Redirects & ads">
      <RoutingEditor
        canManage={canManage(staff.role)}
        redirects={(redirects.data ?? []) as Redirect[]}
        mappings={(mappings.data ?? []) as Mapping[]}
        pages={(pages.data ?? []) as { id: string; slug: string }[]}
      />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <RoutingScreen />
    </Suspense>
  );
}
