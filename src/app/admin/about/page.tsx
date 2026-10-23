import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { parseAbout } from "@/content/about-schema";
import { requireStaff } from "@/lib/auth";
import { aboutJsonSchemas } from "@/lib/json-schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { AboutEditor } from "./about-editor";

export const metadata: Metadata = { title: "About page" };

async function AboutScreen() {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data } = await sb.from("page_content").select("data").eq("key", "about").maybeSingle();
  return (
    <AdminFrame staff={staff} current="/admin/about" title="About page">
      <AboutEditor initial={parseAbout(data?.data)} schemas={aboutJsonSchemas()} />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AboutScreen />
    </Suspense>
  );
}
