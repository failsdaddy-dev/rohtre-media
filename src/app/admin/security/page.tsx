import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { needsSecondFactor, requireStaff } from "@/lib/auth";
import { SecurityPanel } from "./security-panel";

export const metadata: Metadata = { title: "Security" };

// Two-factor sign-in with an authenticator app (R22) and password change.
// The owner and developer are sent here until they've confirmed a code.

async function SecurityScreen() {
  const staff = await requireStaff({ securityPage: true });
  return (
    <AdminFrame staff={staff} current="/admin/security" title="Security">
      <SecurityPanel required={needsSecondFactor(staff)} aal={staff.aal} />
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
