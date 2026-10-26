import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { DEFAULT_WORK } from "@/content/work-defaults";
import { blankBrand, brandSchema, parseSections, workSchema, type Brand } from "@/content/work-schema";
import { requireStaff } from "@/lib/auth";
import { toJson } from "@/lib/json-schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { rowToBrand, type BrandRow } from "@/lib/work-data";
import { WorkEditor } from "./work-editor";

export const metadata: Metadata = { title: "Work page" };

async function WorkScreen() {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const [{ data: page }, brandsRes] = await Promise.all([
    sb.from("page_content").select("data").eq("key", "work").maybeSingle(),
    sb.from("work_brands").select("id, slug, published, sort_order, data").order("sort_order").order("created_at"),
  ]);
  const initial = page?.data ? parseSections(workSchema, page.data, DEFAULT_WORK) : DEFAULT_WORK;
  // Rows whose data no longer passes the check still list (with empty fields) so they can be fixed or deleted.
  const brands: Brand[] | null = brandsRes.error
    ? null
    : (brandsRes.data as BrandRow[]).map(
        (r) =>
          rowToBrand(r) ?? {
            ...blankBrand(),
            ...(r.data as Partial<Brand>),
            id: r.id,
            slug: r.slug,
            published: r.published,
            sort: r.sort_order,
          },
      );
  const schemas = Object.fromEntries(Object.entries(workSchema.shape).map(([k, s]) => [k, toJson(s)]));
  return (
    <AdminFrame staff={staff} current="/admin/work" title="Work page">
      <WorkEditor initial={initial} schemas={schemas} brands={brands} brandSchema={toJson(brandSchema)} />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <WorkScreen />
    </Suspense>
  );
}
