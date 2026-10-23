import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { parseCareers } from "@/content/careers-schema";
import { canManage, requireStaff } from "@/lib/auth";
import { mailConfigured } from "@/lib/careers.server";
import { careersJsonSchemas } from "@/lib/json-schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { CareersEditor } from "./careers-editor";
import { HrEmails } from "./hr-emails";

export const metadata: Metadata = { title: "Careers page" };

async function CareersScreen() {
  const staff = await requireStaff();
  const manager = canManage(staff.role);
  const sb = await supabaseServer();
  const [{ data }, priv] = await Promise.all([
    sb.from("page_content").select("data").eq("key", "careers").maybeSingle(),
    manager ? sb.from("careers_private").select("notify_emails").eq("id", true).maybeSingle() : null,
  ]);
  return (
    <AdminFrame staff={staff} current="/admin/careers" title="Careers page">
      <div className="flex flex-col gap-6">
        <CareersEditor initial={parseCareers(data?.data)} schemas={careersJsonSchemas()} />
        {manager && (
          <HrEmails initial={(priv?.data?.notify_emails as string[] | null) ?? []} mailReady={mailConfigured()} />
        )}
      </div>
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <CareersScreen />
    </Suspense>
  );
}
