import type { Metadata } from "next";
import { CreditCard } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AdminFrame } from "@/components/admin/admin-frame";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminSubscriptions } from "@/lib/admin/queries";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { updateSubscriptionAction } from "../actions";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Plan and billing state for every business.",
};

export default async function AdminSubscriptionsPage() {
  const result = await getAdminSubscriptions();

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Subscriptions
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Plan, status and period for every business. {formatNumber(result.total)} total.
          </p>
        </div>

        {result.error ? (
          <ErrorState title="We could not load subscriptions" description={result.error} />
        ) : result.subscriptions.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CreditCard className="size-5" aria-hidden />}
              title="No subscriptions yet"
              description="Subscriptions are created automatically when a business registers."
            />
          </Card>
        ) : (
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <Table className="text-[11.5px]">
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">Business</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Plan</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Status</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Cycle</TableHead>
                    <TableHead className="h-9 text-right text-[10px] text-muted-foreground">Price</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Period end</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.subscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                      <TableCell className="py-2.5 pl-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground/90">
                            {subscription.businessName}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            @{subscription.businessSlug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusBadge tone="info">{subscription.plan}</StatusBadge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusBadge
                          tone={
                            subscription.status === "active"
                              ? "success"
                              : subscription.status === "trialing"
                                ? "info"
                                : subscription.status === "past_due"
                                  ? "warning"
                                  : "neutral"
                          }
                        >
                          {subscription.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="py-2.5 text-muted-foreground">
                        {subscription.billingCycle}
                      </TableCell>
                      <TableCell className="py-2.5 text-right whitespace-nowrap text-foreground/85">
                        {formatCurrency(subscription.price, subscription.currency)}
                      </TableCell>
                      <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                        {subscription.currentPeriodEnd
                          ? formatDateTime(subscription.currentPeriodEnd)
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <details className="text-[10.5px]">
                          <summary className="cursor-pointer text-cyan-glow">Edit</summary>
                          <form
                            action={updateSubscriptionAction}
                            className="mt-2 grid gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] p-2"
                          >
                            <input type="hidden" name="businessId" value={subscription.businessId} />
                            <select
                              name="plan"
                              defaultValue={subscription.plan}
                              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            >
                              <option value="starter">Starter</option>
                              <option value="growth">Growth</option>
                              <option value="scale">Scale</option>
                            </select>
                            <select
                              name="status"
                              defaultValue={subscription.status}
                              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            >
                              <option value="trialing">Trial</option>
                              <option value="active">Active</option>
                              <option value="past_due">Past due</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="expired">Expired</option>
                            </select>
                            <select
                              name="billingCycle"
                              defaultValue={subscription.billingCycle}
                              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="annual">Annual</option>
                            </select>
                            <input
                              type="number"
                              name="price"
                              defaultValue={subscription.price}
                              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            />
                            <input
                              type="text"
                              name="currency"
                              defaultValue={subscription.currency}
                              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            />
                            <input
                              type="date"
                              name="currentPeriodEnd"
                              defaultValue={
                                subscription.currentPeriodEnd
                                  ? subscription.currentPeriodEnd.slice(0, 10)
                                  : ""
                              }
                              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            />
                            <button
                              type="submit"
                              className="h-7 rounded-md border border-white/[0.09] bg-white/[0.04] px-2 text-[10.5px] font-medium"
                            >
                              Save
                            </button>
                          </form>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </AdminFrame>
  );
}
