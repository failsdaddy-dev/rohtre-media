import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { canManage, requireStaff } from "@/lib/auth";
import { toJson } from "@/lib/json-schemas";
import { dimensionMap } from "@/lib/page-ops";
import { PROOF_TABLES, type ProofTable } from "@/lib/proof-schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { ProofManager } from "./proof-manager";

export const metadata: Metadata = { title: "Proof & badges" };

async function ProofScreen() {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const tables = Object.keys(PROOF_TABLES) as ProofTable[];
  const [rows, { data: tags }, all] = await Promise.all([
    Promise.all(tables.map(async (t) => [t, (await sb.from(t).select("*").order("sort")).data ?? []] as const)),
    sb.from("proof_tags").select("item_type, item_id, value_id"),
    dimensionMap(sb),
  ]);
  return (
    <AdminFrame staff={staff} current="/admin/proof" title="Proof & badges">
      <ProofManager
        tables={tables.map((t) => ({ key: t, label: PROOF_TABLES[t].label, tagType: PROOF_TABLES[t].tagType }))}
        schemas={Object.fromEntries(tables.map((t) => [t, toJson(PROOF_TABLES[t].schema)]))}
        rows={Object.fromEntries(rows) as unknown as Record<ProofTable, (Record<string, unknown> & { id: string })[]>}
        tags={(tags ?? []) as { item_type: string; item_id: string; value_id: string }[]}
        dimensions={[...all.values()].map((v) => ({
          id: v.id,
          type: v.type_key,
          label: v.parent_id ? `${v.label} (sub)` : v.label,
        }))}
        canDelete={canManage(staff.role)}
      />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProofScreen />
    </Suspense>
  );
}
