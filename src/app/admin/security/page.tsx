import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { requireStaff } from "@/lib/auth";
import { SecurityPanel } from "./security-panel";

export const metadata: Metadata = { title: "Password" };

// Change your own password.

async function SecurityScreen() {
  const staff = await requireStaff();
  return (
    <AdminFrame staff={staff} current="/admin/security" title="Password">
      <SecurityPanel />
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <SecurityScreen />
    </Suspense>
  );
}
