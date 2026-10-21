import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { parseHome } from "@/content/home-schema";
import { requireStaff } from "@/lib/auth";
import { homeJsonSchemas } from "@/lib/json-schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { HomeEditor } from "./home-editor";

export const metadata: Metadata = { title: "Home page" };

async function HomeScreen() {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data } = await sb.from("page_content").select("data").eq("key", "home").maybeSingle();
  return (
    <AdminFrame staff={staff} current="/admin/home" title="Home page">
      <HomeEditor initial={parseHome(data?.data)} schemas={homeJsonSchemas()} />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <HomeScreen />
    </Suspense>
  );
}
