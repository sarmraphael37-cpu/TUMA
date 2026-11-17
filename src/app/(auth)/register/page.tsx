import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create your TUMA account and set up your business workspace in minutes.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Start running on clarity."
      description="Create your account, then set up your business. It takes one afternoon — most merchants send their first invoice the same day."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-glow transition-colors hover:text-electric-300"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
