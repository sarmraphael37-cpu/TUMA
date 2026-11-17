"use server";

import { redirect } from "next/navigation";

import { describeAuthError } from "@/lib/auth/errors";
import { toFieldErrors, type FormState } from "@/lib/auth/form-state";
import { safeNextPath } from "@/lib/navigation";
import { getPublicPlatformSettings } from "@/lib/admin/settings";
import { getRequestOrigin } from "@/lib/url";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";

function readForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function signInAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signInSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: describeAuthError(error) };
  }

  redirect(safeNextPath(formData.get("next")?.toString()));
}

export async function signUpAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const settings = await getPublicPlatformSettings();
  if (!settings.registrationOpen) {
    return {
      status: "error",
      message: "Registration is currently closed. Contact the TUMA team.",
    };
  }

  const parsed = signUpSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { status: "error", message: describeAuthError(error) };
  }

  // With email confirmation disabled Supabase returns a session immediately.
  if (data.session) {
    redirect("/onboarding");
  }

  redirect(
    `/login?status=check-email&email=${encodeURIComponent(parsed.data.email)}`,
  );
}

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?status=signed-out");
}

export async function requestPasswordResetAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter the email address you registered with.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    return { status: "error", message: describeAuthError(error) };
  }

  return {
    status: "success",
    message: `If an account exists for ${parsed.data.email}, a reset link is on its way. The link expires in one hour.`,
  };
}

export async function resetPasswordAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message:
        "Your reset session has expired. Request a new link from the forgot password page.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: describeAuthError(error) };
  }

  // A password reset invalidates the recovery session; make the user sign in
  // with the new password so the change is explicit.
  await supabase.auth.signOut();
  redirect("/login?status=password-updated");
}
