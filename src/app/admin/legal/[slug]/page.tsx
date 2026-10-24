import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { LEGAL_DEFAULTS } from "@/content/legal-defaults";
import { isLegalSlug, LEGAL_PAGES, legalKey, parseLegal } from "@/content/legal-schema";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { LegalEditor } from "./legal-editor";

export const metadata: Metadata = { title: "Legal page" };

async function LegalScreen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data } = await sb.from("page_content").select("data").eq("key", legalKey(slug)).maybeSingle();
  const label = LEGAL_PAGES.find((p) => p.slug === slug)!.label;
  return (
    <AdminFrame staff={staff} current={`/admin/legal/${slug}`} title={label}>
      <LegalEditor
        key={slug}
        slug={slug}
        initial={parseLegal(data?.data, LEGAL_DEFAULTS[slug])}
        saved={Boolean(data)}
      />
    </AdminFrame>
  );
}

export default function Page(props: PageProps<"/admin/legal/[slug]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <LegalScreen params={props.params} />
    </Suspense>
  );
}
