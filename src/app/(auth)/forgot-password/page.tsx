import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FormAlert } from "@/components/auth/form-alert";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a TUMA password reset link.",
};

type SearchParams = Promise<{ status?: string }>;

function ForgotFallback() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter the email you registered with and we will send a secure reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

async function ForgotContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter the email you registered with and we will send a secure reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-glow transition-colors hover:text-electric-300"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {params.status === "link-expired" ? (
          <FormAlert tone="error">
            That reset link expired. Request a fresh one below.
          </FormAlert>
        ) : null}
        <ForgotPasswordForm />
      </div>
    </AuthShell>
  );
}

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<ForgotFallback />}>
      <ForgotContent searchParams={searchParams} />
    </Suspense>
  );
}
