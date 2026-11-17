"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { toFieldErrors, type FormState } from "@/lib/auth/form-state";
import { getOwnedBusiness } from "@/lib/auth/server";
import { isMissingColumnError } from "@/lib/db/catalogue";
import {
  canTransitionOrder,
  nextPaymentStatuses,
  orderStatusLabel,
  paymentStatusLabel,
  requiresVerification,
  type OrderStatusValue,
  type PaymentStatusValue,
} from "@/lib/orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Order changes.
 *
 * Every action resolves the merchant and the business from the session, then
 * scopes the update by `id` *and* `business_id`. A business id posted by the
 * browser is never trusted, so one merchant can never touch another merchant's
 * orders. Status changes are validated against the same transition table the
 * UI renders, and the audit trigger records who made the change.
 */

const orderId = z
  .string()
  .uuid("Choose a valid order")
  .describe("The order id");

const note = z
  .string()
  .trim()
  .max(500, "Keep the note under 500 characters")
  .optional()
  .or(z.literal(""));

const statusUpdateSchema = z.object({
  orderId,
  status: z.enum(
    ["pending", "confirmed", "processing", "completed", "cancelled"],
    { message: "Choose a valid status" },
  ),
});

const paymentUpdateSchema = z
  .object({
    orderId,
    decision: z.enum(
      ["unpaid", "awaiting_verification", "paid", "rejected"],
      { message: "Choose a valid payment status" },
    ),
    note,
    confirmed: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (requiresVerification(value.decision) && value.confirmed !== "on") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmed"],
        message: "Confirm that you checked the payment first",
      });
    }

    if (value.decision === "rejected" && !value.note) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "Write why the payment could not be verified",
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function isEnumValueError(message: string | undefined): boolean {
  return /invalid input value for enum/i.test(message ?? "");
}

/** The detail page the action returns to. */
function detailPath(orderId: string, query: string) {
  return `/dashboard/orders/${orderId}?${query}`;
}

function refreshOrderViews(orderId: string) {
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard");
}

async function loadOwnedOrder(orderId: string) {
  const supabase = await getSupabaseServerClient();
  const business = await getOwnedBusiness();

  if (!business) {
    return { supabase, business: null, order: null } as const;
  }

  let result = await supabase
    .from("orders")
    .select("id, status, payment_status, payment_verified_at")
    .eq("id", orderId)
    .eq("business_id", business.id)
    .maybeSingle();

  // Before the order management migration there is no verification column.
  // Falling back keeps the status workflow (and its migration message) usable.
  if (result.error && isMissingColumnError(result.error.message)) {
    result = await supabase
      .from("orders")
      .select("id, status, payment_status")
      .eq("id", orderId)
      .eq("business_id", business.id)
      .maybeSingle();
  }

  const { data, error } = result;

  if (error || !data) {
    return { supabase, business, order: null } as const;
  }

  return {
    supabase,
    business,
    order: {
      id: data.id,
      status: data.status,
      payment_status: data.payment_status,
      payment_verified_at:
        "payment_verified_at" in data ? data.payment_verified_at : null,
    } as {
      id: string;
      status: OrderStatusValue;
      payment_status: PaymentStatusValue;
      payment_verified_at: string | null;
    },
  } as const;
}

/* -------------------------------------------------------------------------- */
/*  Order status                                                                */
/* -------------------------------------------------------------------------- */

export async function updateOrderStatusAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = statusUpdateSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Choose a valid status and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const { supabase, business, order } = await loadOwnedOrder(parsed.data.orderId);

  if (!business) {
    redirect("/login?next=%2Fdashboard%2Forders");
  }

  if (!order) {
    return {
      status: "error",
      message: "That order is not in your workspace.",
    };
  }

  // `delivered` is the historical spelling of `completed`. They are the same
  // state to a merchant, so the transition table sees one of them.
  const current =
    order.status === "delivered"
      ? ("completed" as OrderStatusValue)
      : order.status;
  const next = parsed.data.status;

  if (current === next) {
    return {
      status: "error",
      message: `This order is already ${orderStatusLabel(next).toLowerCase()}.`,
    };
  }

  if (!canTransitionOrder(current, next)) {
    return {
      status: "error",
      message: `An order that is ${orderStatusLabel(
        current,
      ).toLowerCase()} cannot move to ${orderStatusLabel(next).toLowerCase()}. Reload the page to see the current state.`,
    };
  }

  let update = await supabase
    .from("orders")
    .update({ status: next })
    .eq("id", order.id)
    .eq("business_id", business.id)
    .select("id")
    .maybeSingle();

  // Before the order management migration the enum only knows `delivered`.
  // Writing the historical value keeps the workflow usable; the UI still
  // presents it as completed.
  if (
    update.error &&
    next === "completed" &&
    isEnumValueError(update.error.message)
  ) {
    update = await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", order.id)
      .eq("business_id", business.id)
      .select("id")
      .maybeSingle();
  }

  if (update.error || !update.data) {
    if (update.error && isEnumValueError(update.error.message)) {
      return {
        status: "error",
        message:
          "This status is not enabled in the workspace database yet. Apply the latest TUMA migration, then try again.",
      };
    }

    return {
      status: "error",
      message:
        "We could not save the new status. Nothing was changed — please try again.",
    };
  }

  refreshOrderViews(order.id);
  redirect(detailPath(order.id, "updated=1"));
}

/* -------------------------------------------------------------------------- */
/*  Payment verification                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Records what the merchant decided about a payment.
 *
 * `payment_verified_at` and `payment_verified_by` are only stamped when the
 * merchant chooses paid or rejected. Moving back to unpaid or awaiting
 * verification clears the stamp, so the workspace never presents an unchecked
 * payment as verified.
 */
export async function verifyPaymentAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawNote = formData.get("note");

  const parsed = paymentUpdateSchema.safeParse({
    orderId: formData.get("orderId"),
    decision: formData.get("decision"),
    note: typeof rawNote === "string" ? rawNote : "",
    confirmed: formData.get("confirmed") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the payment details and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const { supabase, business, order } = await loadOwnedOrder(parsed.data.orderId);

  if (!business) {
    redirect("/login?next=%2Fdashboard%2Forders");
  }

  if (!order) {
    return {
      status: "error",
      message: "That order is not in your workspace.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard%2Forders");
  }

  const current = order.payment_status;
  const decision = parsed.data.decision;

  if (current === decision) {
    return {
      status: "error",
      message: `The payment is already ${paymentStatusLabel(
        decision,
      ).toLowerCase()}.`,
    };
  }

  if (!nextPaymentStatuses(current).includes(decision)) {
    return {
      status: "error",
      message: `A payment that is ${paymentStatusLabel(
        current,
      ).toLowerCase()} cannot move to ${paymentStatusLabel(
        decision,
      ).toLowerCase()}. Reload the page to see the current state.`,
    };
  }

  const verified = requiresVerification(decision);
  const note = parsed.data.note ? parsed.data.note : null;

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: decision,
      payment_verified_at: verified ? new Date().toISOString() : null,
      payment_verified_by: verified ? user.id : null,
      payment_note: note,
    })
    .eq("id", order.id)
    .eq("business_id", business.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (
      isMissingColumnError(error.message) ||
      isEnumValueError(error.message)
    ) {
      return {
        status: "error",
        message:
          "Payment verification is not enabled in the workspace database yet. Apply the latest TUMA migration, then try again. Nothing was changed.",
      };
    }

    return {
      status: "error",
      message:
        "We could not save the payment change. Nothing was changed — please try again.",
    };
  }

  refreshOrderViews(order.id);
  redirect(detailPath(order.id, `payment=${decision}`));
}
