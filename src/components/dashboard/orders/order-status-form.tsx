"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2, Lock } from "lucide-react";

import { updateOrderStatusAction } from "@/app/(app)/dashboard/orders/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/auth/form-state";
import {
  nextOrderStatuses,
  orderStatusLabel,
  type OrderStatusValue,
} from "@/lib/orders";

/**
 * Changes the status of one order.
 *
 * Only the transitions the workflow allows are offered, and the server action
 * validates the same list again. The change lands in `order_events` through the
 * audit trigger, attributed to the signed-in merchant.
 */
export function OrderStatusForm({
  orderId,
  status,
  audited,
}: {
  orderId: string;
  status: OrderStatusValue;
  audited: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateOrderStatusAction, {
    status: "idle" as const,
  } satisfies FormState);

  // Historical `delivered` rows behave exactly like `completed`.
  const current = status === "delivered" ? "completed" : status;
  const options = nextOrderStatuses(current);

  if (options.length === 0) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          This order is {orderStatusLabel(current).toLowerCase()} and no longer
          changes status. Its history remains available below.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="orderId" value={orderId} />

      <label className="block space-y-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">
          Move this order to
        </span>
        <select
          name="status"
          required
          defaultValue=""
          aria-describedby={
            state.fieldErrors?.status ? "order-status-error" : undefined
          }
          className="h-9 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Choose the next status…
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {orderStatusLabel(option)}
            </option>
          ))}
        </select>
      </label>

      {state.fieldErrors?.status ? (
        <p id="order-status-error" className="text-[11px] text-rose-300">
          {state.fieldErrors.status[0]}
        </p>
      ) : null}

      {state.message ? (
        <FormAlert tone={state.status === "error" ? "error" : "success"}>
          {state.message}
        </FormAlert>
      ) : null}

      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="h-8 w-full rounded-lg text-[11.5px]"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <ArrowRight className="size-3.5" aria-hidden />
        )}
        {pending ? "Saving…" : "Update status"}
      </Button>

      <p className="text-[10.5px] leading-relaxed text-muted-foreground">
        {audited
          ? "The change is saved immediately and recorded in the order history with your name and the time."
          : "The change is saved immediately. Order history needs the latest TUMA migration before it can record who changed it."}
      </p>
    </form>
  );
}
