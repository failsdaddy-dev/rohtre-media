import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { DEFAULT_RECOGNITION } from "@/content/work-defaults";
import { parseSections, recognitionSchema } from "@/content/work-schema";
import { requireStaff } from "@/lib/auth";
import { toJson } from "@/lib/json-schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { RecognitionEditor } from "./recognition-editor";

export const metadata: Metadata = { title: "Recognition page" };

async function RecognitionScreen() {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data } = await sb.from("page_content").select("data").eq("key", "recognition").maybeSingle();
  const initial = data?.data ? parseSections(recognitionSchema, data.data, DEFAULT_RECOGNITION) : DEFAULT_RECOGNITION;
  const schemas = Object.fromEntries(Object.entries(recognitionSchema.shape).map(([k, s]) => [k, toJson(s)]));
  return (
    <AdminFrame staff={staff} current="/admin/recognition" title="Recognition page">
      <RecognitionEditor initial={initial} schemas={schemas} />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <RecognitionScreen />
    </Suspense>
  );
}
