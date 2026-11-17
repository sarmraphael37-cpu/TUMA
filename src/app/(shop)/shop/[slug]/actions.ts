"use server";

import { redirect } from "next/navigation";

import { toFieldErrors, type FormState } from "@/lib/auth/form-state";
import { placeStorefrontOrder } from "@/lib/db/storefront";
import { cartSchema, checkoutSchema } from "@/lib/validation";

/**
 * Places an order for a storefront.
 *
 * The action only validates the form and forwards the cart: every price, the
 * availability check and the inventory update happen inside the database
 * function, so a tampered request cannot change what a customer pays.
 */
export async function placeOrderAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    deliveryLocation: formData.get("deliveryLocation"),
    notes: formData.get("notes") ?? "",
    cart: formData.get("cart"),
    clientToken: formData.get("clientToken"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  let rawCart: unknown;

  try {
    rawCart = JSON.parse(parsed.data.cart);
  } catch {
    return {
      status: "error",
      message: "We could not read your cart. Please try again.",
    };
  }

  const cart = cartSchema.safeParse(rawCart);

  if (!cart.success) {
    return {
      status: "error",
      message: "Your cart is empty. Add a product before checking out.",
    };
  }

  const slug = String(formData.get("slug") ?? "");

  if (!slug) {
    return { status: "error", message: "This shop is not available." };
  }

  let publicToken: string;

  try {
    const order = await placeStorefrontOrder({
      businessSlug: slug,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      deliveryLocation: parsed.data.deliveryLocation,
      notes: parsed.data.notes,
      items: cart.data,
      clientToken: parsed.data.clientToken,
    });

    publicToken = order.public_token;
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "We could not place your order. Please try again.",
    };
  }

  // `redirect` must stay outside the try/catch: it throws a control-flow
  // error that must not be swallowed.
  redirect(`/shop/${slug}/order/${publicToken}`);
}
