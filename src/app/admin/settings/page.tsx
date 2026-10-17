import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { requireStaff } from "@/lib/auth";
import { parseSettings } from "@/lib/settings-schema";
import { supabaseServer } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

async function SettingsScreen() {
  const staff = await requireStaff({ manage: true });
  const sb = await supabaseServer();
  const { data } = await sb.from("site_settings").select("data").eq("id", true).maybeSingle();
  return (
    <AdminFrame staff={staff} current="/admin/settings" title="Global settings">
      <SettingsForm settings={parseSettings(data?.data)} isOwner={staff.role === "owner"} />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <SettingsScreen />
    </Suspense>
  );
}
