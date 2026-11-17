"use client";

import { useActionState, useState } from "react";
import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react";

import { verifyPaymentAction } from "@/app/(app)/dashboard/orders/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/auth/form-state";
import { formatDateTime } from "@/lib/format";
import {
  nextPaymentStatuses,
  paymentStatusLabel,
  requiresVerification,
  type PaymentStatusValue,
} from "@/lib/orders";

/**
 * Records the merchant's decision about a payment.
 *
 * A payment is only stamped as verified when the merchant explicitly picks
 * paid or rejected *and* confirms they checked it. Until then the order keeps
 * saying "awaiting verification", whatever the customer claims.
 */
export function PaymentVerificationForm({
  orderId,
  paymentStatus,
  paymentVerifiedAt,
  verifiedByName,
  paymentNote,
  verificationSupported,
}: {
  orderId: string;
  paymentStatus: PaymentStatusValue;
  paymentVerifiedAt: string | null;
  verifiedByName: string | null;
  paymentNote: string | null;
  verificationSupported: boolean;
}) {
  const [state, formAction, pending] = useActionState(verifyPaymentAction, {
    status: "idle" as const,
  } satisfies FormState);
  const [decision, setDecision] = useState("");

  const options = nextPaymentStatuses(paymentStatus).filter(
    (option) => option !== "refunded",
  );

  const needsConfirmation = requiresVerification(
    decision as PaymentStatusValue,
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10.5px] font-medium tracking-wide text-muted-foreground uppercase">
            Current payment
          </p>
          <span className="text-[11px] font-medium text-foreground/85">
            {paymentStatusLabel(paymentStatus)}
          </span>
        </div>

        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {paymentVerifiedAt ? (
            <>
              <BadgeCheck
                className="mt-0.5 size-3.5 shrink-0 text-mint-glow"
                aria-hidden
              />
              <span>
                Verified by {verifiedByName ?? "a merchant"} on{" "}
                {formatDateTime(paymentVerifiedAt)}.
              </span>
            </>
          ) : (
            <>
              <ShieldCheck
                className="mt-0.5 size-3.5 shrink-0 text-amber-glow"
                aria-hidden
              />
              <span>
                Not verified by a merchant yet. The customer may say they paid,
                but TUMA only shows a payment as verified once you record it
                below.
              </span>
            </>
          )}
        </p>

        {paymentNote ? (
          <p className="mt-2 border-t border-white/[0.06] pt-2 text-[11px] leading-relaxed text-muted-foreground">
            Reference: <span className="text-foreground/80">{paymentNote}</span>
          </p>
        ) : null}
      </div>

      {!verificationSupported ? (
        <FormAlert tone="info">
          Payment verification is not enabled in the workspace database yet.
          Apply the latest TUMA migration to record verified, awaiting and
          rejected payments.
        </FormAlert>
      ) : options.length === 0 ? (
        <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">
          This payment is closed. Its record stays in the order history.
        </p>
      ) : (
        <form action={formAction} className="space-y-2.5">
          <input type="hidden" name="orderId" value={orderId} />

          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              What did you find?
            </span>
            <select
              name="decision"
              required
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
              className="h-9 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Choose a payment status…
              </option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {paymentStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Payment reference or note
            </span>
            <Textarea
              name="note"
              rows={2}
              defaultValue={paymentNote ?? ""}
              maxLength={500}
              placeholder="Mobile money id, transaction reference, cash receipt…"
              className="min-h-16 resize-y text-[12px]"
              aria-invalid={Boolean(state.fieldErrors?.note)}
            />
            {state.fieldErrors?.note ? (
              <span className="block text-[11px] text-rose-300">
                {state.fieldErrors.note[0]}
              </span>
            ) : null}
          </label>

          {needsConfirmation ? (
            <label className="flex items-start gap-2 rounded-xl border border-amber-glow/20 bg-amber-glow/[0.05] px-3 py-2.5 text-[11px] leading-relaxed text-amber-glow">
              <input
                type="checkbox"
                name="confirmed"
                value="on"
                className="mt-0.5 size-3.5 accent-amber-glow"
                aria-invalid={Boolean(state.fieldErrors?.confirmed)}
              />
              <span>
                I checked this payment myself and confirm that the decision
                above is accurate.
              </span>
            </label>
          ) : null}

          {state.fieldErrors?.confirmed ? (
            <p className="text-[11px] text-rose-300">
              {state.fieldErrors.confirmed[0]}
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
            disabled={pending || !decision}
            className="h-8 w-full rounded-lg text-[11.5px]"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ShieldCheck className="size-3.5" aria-hidden />
            )}
            {pending ? "Saving…" : "Save payment status"}
          </Button>

          <p className="text-[10.5px] leading-relaxed text-muted-foreground">
            Choosing paid or rejected stamps your account and the time on the
            order. Your decision is part of the order history.
          </p>
        </form>
      )}
    </div>
  );
}
