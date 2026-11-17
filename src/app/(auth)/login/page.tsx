import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/auth/form-alert";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your TUMA workspace.",
};

type SearchParams = Promise<{
  status?: string;
  email?: string;
  next?: string;
}>;

function LoginFallback() {
  return (
    <AuthShell
      title="Welcome back."
      description="Sign in to pick up where your business left off."
    >
      <LoginForm next="/dashboard" />
    </AuthShell>
  );
}

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const status = params.status;

  return (
    <AuthShell
      title="Welcome back."
      description="Sign in to pick up where your business left off."
      footer={
        <>
          New to TUMA?{" "}
          <Link
            href="/register"
            className="font-medium text-cyan-glow transition-colors hover:text-electric-300"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {status === "check-email" ? (
          <FormAlert tone="success">
            Account created. Check{" "}
            <span className="font-medium">
              {params.email || "your inbox"}
            </span>{" "}
            for the confirmation link, then sign in here.
          </FormAlert>
        ) : null}

        {status === "password-updated" ? (
          <FormAlert tone="success">
            Password updated. Sign in with your new password.
          </FormAlert>
        ) : null}

        {status === "signed-out" ? (
          <FormAlert tone="info">
            You have been signed out safely.
          </FormAlert>
        ) : null}

        {status === "link-expired" || status === "link-invalid" ? (
          <FormAlert tone="error">
            That link has expired or was already used. Request a new password
            reset link below.
          </FormAlert>
        ) : null}

        <LoginForm next={next} />
      </div>
    </AuthShell>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
