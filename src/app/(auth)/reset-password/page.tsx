import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your TUMA account.",
};

function ResetFallback() {
  return (
    <AuthShell
      title="Choose a new password."
      description="Make it strong, memorable and different from your last one."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

async function ResetContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/forgot-password?status=link-expired");
  }

  return (
    <AuthShell
      title="Choose a new password."
      description={`Signed in as ${user.email}. This link is single-use and expires shortly.`}
      footer={
        <>
          Need a different link?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-cyan-glow transition-colors hover:text-electric-300"
          >
            Request another
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetContent />
    </Suspense>
  );
}


