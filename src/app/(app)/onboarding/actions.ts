"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Business } from "@/lib/db/types";
import { toFieldErrors, type FormState } from "@/lib/auth/form-state";
import {
  isMissingSchemaError,
  reportMissingSchema,
} from "@/lib/db/schema-state";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { slugifyBusinessName } from "@/lib/slug";
import { businessSchema } from "@/lib/validation";

function readForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createBusinessAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = businessSchema.safeParse(readForm(formData));

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
    redirect("/login?next=%2Fonboarding");
  }

  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect("/dashboard");
  }

  // Normally created by the auth.users trigger. Repairing it here also covers
  // accounts created before the trigger was installed.
  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Merchant";

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const baseSlug = slugifyBusinessName(parsed.data.name);
  const description = parsed.data.description?.trim();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${randomUUID().slice(0, 4)}`;

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: parsed.data.name,
        slug,
        category: parsed.data.category,
        description: description ? description : null,
        phone: parsed.data.phone,
        location: parsed.data.location,
      })
      .select(
        "id, owner_id, name, slug, category, description, phone, location, currency, created_at, updated_at",
      )
      .single();

    if (!error) {
      const business = data as Business;
      revalidatePath("/dashboard");
      redirect(`/dashboard?welcome=1&business=${business.slug}`);
    }

    // A slug collision is the only error worth retrying with a suffix.
    if (error.code === "23505" && /slug/i.test(`${error.message} ${error.details}`)) {
      continue;
    }

    if (
      error.code === "23505" &&
      /owner_id|businesses_owner_id_key/i.test(`${error.message} ${error.details}`)
    ) {
      redirect("/dashboard");
    }

    if (isMissingSchemaError(error)) {
      reportMissingSchema("businesses");

      return {
        status: "error",
        message:
          "Your workspace database is not ready yet. Nothing was saved — please try again in a moment.",
      };
    }

    return {
      status: "error",
      message:
        "We could not create your business. Nothing was saved — check your details and try again.",
    };
  }

  return {
    status: "error",
    message:
      "That storefront name is very popular. Try a slightly different business name.",
    fieldErrors: {
      name: ["Try a slightly different business name"],
    },
  };
}
