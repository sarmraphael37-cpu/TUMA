"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction } from "@/app/(auth)/actions";
import { AuthField } from "@/components/auth/auth-field";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { emptyFormState } from "@/lib/auth/form-state";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, emptyFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}

      <AuthField
        label="Email address"
        htmlFor="email"
        error={errors.email?.[0]}
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
          aria-describedby={errors.email ? "email-error" : undefined}
          className="h-11 bg-white/[0.02] text-[13.5px] placeholder:text-muted-foreground/50"
        />
      </AuthField>

      <AuthField
        label="Password"
        htmlFor="password"
        error={errors.password?.[0]}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          invalid={Boolean(errors.password)}
          describedBy={errors.password ? "password-error" : undefined}
        />
      </AuthField>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-[11.5px] font-medium text-cyan-glow transition-colors hover:text-electric-300"
        >
          Forgot password?
        </Link>
      </div>

      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
