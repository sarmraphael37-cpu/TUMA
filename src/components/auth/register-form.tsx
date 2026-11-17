"use client";

import { useActionState } from "react";

import { signUpAction } from "@/app/(auth)/actions";
import { AuthField } from "@/components/auth/auth-field";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { emptyFormState } from "@/lib/auth/form-state";

export function RegisterForm() {
  const [state, formAction] = useActionState(signUpAction, emptyFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}

      <AuthField
        label="Your full name"
        htmlFor="fullName"
        error={errors.fullName?.[0]}
      >
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Sandrine Mbarga"
          required
          aria-invalid={Boolean(errors.fullName) || undefined}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          className="h-11 bg-white/[0.02] text-[13.5px] placeholder:text-muted-foreground/50"
        />
      </AuthField>

      <AuthField
        label="Work email"
        htmlFor="email"
        error={errors.email?.[0]}
        hint="We send your confirmation link here."
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

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="Password"
          htmlFor="password"
          error={errors.password?.[0]}
          hint="8+ characters, a letter and a number."
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            invalid={Boolean(errors.password)}
            describedBy={errors.password ? "password-error" : "password-hint"}
          />
        </AuthField>

        <AuthField
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.[0]}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat password"
            invalid={Boolean(errors.confirmPassword)}
            describedBy={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
          />
        </AuthField>
      </div>

      <SubmitButton pendingLabel="Creating account…">
        Create my account
      </SubmitButton>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        By creating an account you agree to use TUMA responsibly and keep your
        login details private.
      </p>
    </form>
  );
}
