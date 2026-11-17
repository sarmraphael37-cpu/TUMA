"use client";

import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { AuthField } from "@/components/auth/auth-field";
import { FormAlert } from "@/components/auth/form-alert";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { emptyFormState } from "@/lib/auth/form-state";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    emptyFormState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "success" && state.message ? (
        <FormAlert tone="success">{state.message}</FormAlert>
      ) : null}

      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}

      <AuthField
        label="Email address"
        htmlFor="email"
        error={errors.email?.[0]}
        hint="Use the address you registered with."
      >
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@business.cm"
          required
          aria-invalid={Boolean(errors.email) || undefined}
          aria-describedby={errors.email ? "email-error" : "email-hint"}
          className="h-11 bg-white/[0.02] text-[13.5px] placeholder:text-muted-foreground/50"
        />
      </AuthField>

      <SubmitButton pendingLabel="Sending link…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
