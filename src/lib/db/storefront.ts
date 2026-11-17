import "server-only";

import { getPublicSupabaseClient } from "@/lib/supabase/public";

/**
 * Public storefront reads.
 *
 * Every query runs through the anonymous client, so the row level security
 * policies in the database are the only thing that decides what a visitor can
 * see: a published business, its active products and nothing else. The
 * selected columns are listed explicitly because `anon` only holds column
 * level grants — it cannot read `owner_id`, `cost` or any order.
 */

export type StorefrontBusiness = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  phone: string;
  whatsapp: string | null;
  location: string;
  currency: string;
  logo_url: string | null;
  cover_image_url: string | null;
  is_public: boolean;
};

export type StorefrontProduct = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  original_price: number | null;
  images: string[];
  stock_quantity: number;
  status: "active" | "archived";
};

const BUSINESS_COLUMNS = [
  "id",
  "name",
  "slug",
  "category",
  "description",
  "phone",
  "whatsapp",
  "location",
  "currency",
  "logo_url",
  "cover_image_url",
  "is_public",
].join(", ");

const PRODUCT_COLUMNS = [
  "id",
  "business_id",
  "name",
  "description",
  "category",
  "price",
  "original_price",
  "images",
  "stock_quantity",
  "status",
].join(", ");

/** Loads the published business behind a storefront slug. */
export async function getStorefrontBusiness(
  slug: string,
): Promise<StorefrontBusiness | null> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data as unknown as StorefrontBusiness | null) ?? null;
}

/** Loads the active products of a storefront. */
export async function getStorefrontProducts(
  businessId: string,
): Promise<StorefrontProduct[]> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("business_id", businessId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  const rows = (data ?? []) as unknown as Array<
    Omit<StorefrontProduct, "images"> & { images?: string[] | null }
  >;

  return rows.map((row) => ({
    ...row,
    price: Number(row.price),
    original_price:
      row.original_price === null || row.original_price === undefined
        ? null
        : Number(row.original_price),
    images: row.images ?? [],
  }));
}

/** Loads one active product of a storefront. */
export async function getStorefrontProduct(
  businessId: string,
  productId: string,
): Promise<StorefrontProduct | null> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", productId)
    .eq("business_id", businessId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as Omit<StorefrontProduct, "images"> & {
    images?: string[] | null;
  };

  return {
    ...row,
    price: Number(row.price),
    original_price:
      row.original_price === null || row.original_price === undefined
        ? null
        : Number(row.original_price),
    images: row.images ?? [],
  };
}

/** The categories a storefront actually sells. */
export function getStorefrontCategories(
  products: StorefrontProduct[],
): string[] {
  return Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export type OrderConfirmation = {
  order_id: string;
  order_number: string;
  public_token: string;
  status: string;
  payment_status: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_location: string | null;
  created_at: string;
  business: {
    name: string;
    slug: string;
    phone: string;
    whatsapp: string | null;
    location: string;
  };
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
};

/**
 * Reads an order confirmation.
 *
 * The order is addressed by its unguessable public token, so a visitor can
 * only ever read the order they just placed.
 */
export async function getOrderConfirmation(
  token: string,
): Promise<OrderConfirmation | null> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase.rpc("get_order_confirmation", {
    p_public_token: token,
  });

  if (error || !data) {
    return null;
  }

  const payload = data as unknown as OrderConfirmation;

  return {
    ...payload,
    subtotal: Number(payload.subtotal),
    discount: Number(payload.discount),
    tax: Number(payload.tax),
    total: Number(payload.total),
    items: (payload.items ?? []).map((item) => ({
      ...item,
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
    })),
  };
}

/**
 * Places an order.
 *
 * The database function does the real work: it prices the cart, checks the
 * stock, writes the order and the order items and updates the inventory in
 * one transaction. The browser never sends a price.
 */
export async function placeStorefrontOrder(input: {
  businessSlug: string;
  customerName: string;
  customerPhone: string;
  deliveryLocation: string;
  notes?: string;
  items: { product_id: string; quantity: number }[];
  clientToken: string;
}): Promise<OrderConfirmation> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase.rpc("place_order", {
    p_business_slug: input.businessSlug,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_delivery_location: input.deliveryLocation,
    p_items: input.items,
    p_notes: input.notes ?? null,
    p_client_token: input.clientToken,
  });

  if (error || !data) {
    throw new Error(mapStorefrontError(error?.message ?? "unknown"));
  }

  const payload = data as unknown as OrderConfirmation;

  return {
    ...payload,
    subtotal: Number(payload.subtotal),
    discount: Number(payload.discount),
    tax: Number(payload.tax),
    total: Number(payload.total),
    items: (payload.items ?? []).map((item) => ({
      ...item,
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
    })),
  };
}

/** Turns a database error into copy a customer can act on. */
function mapStorefrontError(message: string): string {
  if (message.includes("insufficient_stock")) {
    return "One of the products just went out of stock. Please adjust the quantity and try again.";
  }

  if (message.includes("product_unavailable")) {
    return "One of the products is no longer available. Please review your cart.";
  }

  if (message.includes("storefront_not_found")) {
    return "This shop is not available.";
  }

  if (message.includes("empty_cart")) {
    return "Your cart is empty.";
  }

  return "We could not place your order. Please try again.";
}
