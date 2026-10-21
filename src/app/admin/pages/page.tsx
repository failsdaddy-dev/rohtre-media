import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { Panel } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { headlineFor, type DimensionValue } from "@/lib/dimensions";
import { dimensionMap } from "@/lib/page-ops";
import { supabaseServer } from "@/lib/supabase/server";
import { NewPageForm } from "./new-page-form";

export const metadata: Metadata = { title: "Landing pages" };

type Row = { id: string; slug: string; status: string; visibility: string; updated_at: string };

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

async function PagesScreen() {
  const staff = await requireStaff();
  const db = await supabaseServer();
  const [{ data: pages }, { data: dims }, all] = await Promise.all([
    db.from("pages").select("id, slug, status, visibility, updated_at").order("updated_at", { ascending: false }),
    db.from("page_dimensions").select("page_id, type_key, value_id"),
    dimensionMap(db),
  ]);
  const valuesOf = (pageId: string) =>
    Object.fromEntries(
      (dims ?? []).filter((d) => d.page_id === pageId).map((d) => [d.type_key, all.get(d.value_id)]),
    ) as Record<string, DimensionValue | undefined>;
  const options = (type: string) =>
    [...all.values()]
      .filter((v) => v.type_key === type)
      .map((v) => ({ id: v.id, label: v.parent_id ? `— ${v.label}` : v.label }));

  return (
    <AdminFrame staff={staff} current="/admin/pages" title="Landing pages">
      <div className="flex flex-col gap-6">
        <Panel title="New landing page">
          <p className="-mt-2 mb-4 text-sm text-fg-2">
            Pick a service, niche and country. The page starts as an unlisted draft from the master template, with its
            URL and headline filled in.
          </p>
          <NewPageForm services={options("service")} niches={options("niche")} countries={options("country")} />
        </Panel>
        <Panel title={`All pages (${pages?.length ?? 0})`}>
          {!pages?.length ? (
            <p className="text-fg-2">No landing pages yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(pages as Row[]).map((p) => {
                const v = valuesOf(p.id);
                const headline = v.service && v.niche && v.country ? headlineFor(v as never) : p.slug;
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/pages/${p.id}`} className="font-semibold hover:text-brand">
                        {headline}
                      </Link>
                      <p className="truncate text-sm text-fg-2">/lp/{p.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <span
                        className={`rounded-full px-2.5 py-1 ${p.status === "published" ? "bg-[#1f7a3a] text-white" : "bg-chip"}`}
                      >
                        {p.status}
                      </span>
                      <span className="rounded-full bg-chip px-2.5 py-1">{p.visibility}</span>
                      <span className="font-normal normal-case tracking-normal text-fg-2">
                        {fmt.format(new Date(p.updated_at))}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <PagesScreen />
    </Suspense>
  );
}
