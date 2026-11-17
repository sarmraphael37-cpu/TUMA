"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { toFieldErrors, type FormState } from "@/lib/auth/form-state";
import { getOwnedBusiness } from "@/lib/auth/server";
import { updateStorefrontSettings } from "@/lib/db/storefront-settings";

const storefrontSchema = z.object({
  isPublic: z
    .union([z.literal("on"), z.literal("true"), z.literal("false")])
    .transform((value) => value === "on" || value === "true"),
  logoUrl: z
    .string()
    .trim()
    .max(500, "That link is too long")
    .refine(
      (value) => value === "" || /^https:\/\/\S+$/i.test(value),
      "Use a full https:// link",
    )
    .optional()
    .or(z.literal("")),
  coverImageUrl: z
    .string()
    .trim()
    .max(500, "That link is too long")
    .refine(
      (value) => value === "" || /^https:\/\/\S+$/i.test(value),
      "Use a full https:// link",
    )
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .max(30, "That number is too long")
    .refine(
      (value) => value === "" || /^[+\d][\d\s().-]{6,29}$/.test(value),
      "Enter a valid phone number",
    )
    .optional()
    .or(z.literal("")),
});

/**
 * Updates the storefront of the signed-in merchant.
 *
 * The business is resolved from the session, so a merchant can only ever
 * change their own storefront.
 */
export async function updateStorefrontAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = storefrontSchema.safeParse({
    isPublic: formData.get("isPublic") ?? "false",
    logoUrl: formData.get("logoUrl") ?? "",
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const business = await getOwnedBusiness();

  if (!business) {
    redirect("/onboarding");
  }

  const error = await updateStorefrontSettings(business.id, business.owner_id, {
    isPublic: parsed.data.isPublic,
    logoUrl: parsed.data.logoUrl || null,
    coverImageUrl: parsed.data.coverImageUrl || null,
    whatsapp: parsed.data.whatsapp || null,
  });

  if (error) {
    return {
      status: "error",
      message:
        "We could not save your storefront. Nothing was changed — please try again.",
    };
  }

  revalidatePath("/dashboard/storefront");
  revalidatePath(`/shop/${business.slug}`);
  redirect("/dashboard/storefront?saved=1");
}
