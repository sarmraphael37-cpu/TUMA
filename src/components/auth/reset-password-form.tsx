"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/app/(auth)/actions";
import { AuthField } from "@/components/auth/auth-field";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { emptyFormState } from "@/lib/auth/form-state";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    resetPasswordAction,
    emptyFormState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}

      <AuthField
        label="New password"
        htmlFor="password"
        error={errors.password?.[0]}
        hint="8+ characters, a letter and a number."
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="New password"
          invalid={Boolean(errors.password)}
          describedBy={errors.password ? "password-error" : "password-hint"}
        />
      </AuthField>

      <AuthField
        label="Confirm new password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.[0]}
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat new password"
          invalid={Boolean(errors.confirmPassword)}
          describedBy={
            errors.confirmPassword ? "confirmPassword-error" : undefined
          }
        />
      </AuthField>

      <SubmitButton pendingLabel="Updating password…">
        Update password
      </SubmitButton>
    </form>
  );
}
