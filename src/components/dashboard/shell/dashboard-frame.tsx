import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/dashboard/shell/dashboard-chrome";
import { getOwnedBusiness, requireUser } from "@/lib/auth/server";
import { getDashboardNotifications } from "@/lib/db/dashboard";
import type { BusinessSubscription } from "@/lib/db/types";
import {
  subscriptionPlanLabels,
  subscriptionStatusLabels,
} from "@/lib/db/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Renders the workspace chrome around the page content.
 *
 * The page content is rendered here as a server child, never passed through a
 * client component, so React never has to resolve it lazily.
 */
export async function DashboardFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");
  const business = await getOwnedBusiness();

  if (!business) {
    redirect("/onboarding");
  }

  const [notifications, subscriptionResult] = await Promise.all([
    getDashboardNotifications(),
    getSupabaseServerClient()
      .then((supabase) =>
        supabase
          .from("business_subscriptions")
          .select(
            "id, business_id, plan, status, billing_cycle, price, currency, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, created_at, updated_at",
          )
          .maybeSingle(),
      )
      .catch(() => ({ data: null, error: null })),
  ]);

  const subscription = (subscriptionResult.data ??
    null) as BusinessSubscription | null;

  const fullName =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0]) ?? "Merchant";

  return (
    <div className="relative min-h-dvh bg-navy-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[360px] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(46,124,255,0.13),transparent)]"
      />

      <DashboardChrome
        business={{
          name: business.name,
          slug: business.slug,
          category: business.category,
          currency: business.currency,
        }}
        user={{ name: fullName, email: user.email ?? "" }}
        plan={
          subscription
            ? {
                plan: subscriptionPlanLabels[subscription.plan],
                status: subscriptionStatusLabels[subscription.status],
                trialEndsAt: subscription.trial_ends_at,
              }
            : null
        }
        notifications={notifications}
      />

      <div className="lg:ml-[var(--tuma-sidebar-width)]">
        <main className="px-4 pt-20 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
