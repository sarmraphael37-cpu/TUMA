import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Access denied",
  description: "You do not have access to the administration console.",
};

export default function AdminDeniedPage() {
  return (
    <AuthShell
      title="Access denied."
      description="This account is not a platform administrator. If you believe this is a mistake, contact a super admin."
    >
      <div className="space-y-3">
        <Link
          href="/admin/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] text-[12.5px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
        >
          Sign in with a different account
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 w-full items-center justify-center text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to TUMA
        </Link>
      </div>
    </AuthShell>
  );
}
