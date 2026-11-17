import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/auth/form-alert";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Sign in to the TUMA administration console.",
};

type SearchParams = Promise<{ next?: string; status?: string }>;

function LoginFallback() {
  return (
    <AuthShell
      title="Administration."
      description="Sign in with a platform staff account."
    >
      <LoginForm next="/admin" />
    </AuthShell>
  );
}

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "/admin");

  return (
    <AuthShell
      title="Administration."
      description="Sign in with a platform staff account."
      footer={
        <>
          Not a staff member?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-glow transition-colors hover:text-electric-300"
          >
            Merchant sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {params.status === "signed-out" ? (
          <FormAlert tone="info">You have been signed out.</FormAlert>
        ) : null}
        <LoginForm next={next} />
      </div>
    </AuthShell>
  );
}

export default function AdminLoginPage({
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
