import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { BusinessForm } from "@/components/auth/business-form";
import { getOwnedBusiness, requireUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Set up your business",
  description: "Create your TUMA business workspace.",
};

function OnboardingFallback() {
  return (
    <AuthShell
      title="Set up your business."
      description="A few details and your workspace is ready."
    >
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your workspace setup…</span>
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-11 animate-pulse rounded-lg bg-white/[0.04]"
          />
        ))}
        <div className="h-11 animate-pulse rounded-xl bg-white/[0.07]" />
      </div>
    </AuthShell>
  );
}

async function OnboardingContent() {
  const user = await requireUser("/onboarding");
  const business = await getOwnedBusiness();

  if (business) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Set up your business."
      description="These details shape your workspace, invoices and reporting. You can refine them later."
      footer={
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          Signed in as {user.email}
          <span className="text-white/20" aria-hidden>
            ·
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="font-medium text-cyan-glow transition-colors hover:text-electric-300"
            >
              Sign out
            </button>
          </form>
        </span>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-electric-400/20 bg-electric-500/[0.08] px-3.5 py-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-electric-500 to-cyan-glow text-[11px] font-semibold text-navy-950">
          2
        </span>
        <div>
          <p className="text-[12px] font-medium">Almost there</p>
          <p className="text-[11px] text-muted-foreground">
            Step 2 of 2 — business profile
          </p>
        </div>
      </div>

      <BusinessForm />
    </AuthShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}


