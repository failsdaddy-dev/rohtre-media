import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { canManage, requireStaff } from "@/lib/auth";
import { mediaInUse } from "@/lib/page-ops";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { MediaLibrary } from "./media-library";

export const metadata: Metadata = { title: "Media" };

async function MediaScreen() {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data } = await sb
    .from("media")
    .select("public_id, resource_type, width, height, bytes, format, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const admin = supabaseAdmin();
  const used = admin ? await mediaInUse(admin) : new Set<string>();
  return (
    <AdminFrame staff={staff} current="/admin/media" title="Media library">
      <MediaLibrary
        items={
          (data ?? []).map((m) => ({
            ...(m as Record<string, unknown>),
            inUse: used.has(m.public_id as string),
          })) as never
        }
        canDelete={canManage(staff.role)}
      />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <MediaScreen />
    </Suspense>
  );
}
