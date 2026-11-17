"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { toFieldErrors, type FormState } from "@/lib/auth/form-state";
import { isMissingColumnError } from "@/lib/db/catalogue";
import { getCatalogueBusiness } from "@/lib/db/products";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MIME_TYPES,
  productSchema,
} from "@/lib/validation";

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_IMAGES = 4;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Reads the plain form fields. Files are pulled out separately so a binary
 * value never reaches the Zod schema.
 */
function readForm(formData: FormData) {
  const raw: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      continue;
    }
    raw[key] = value;
  }

  delete raw.images;
  delete raw.image;
  delete raw.keepImages;

  return raw;
}

function readFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, MAX_IMAGES);
}

function readKeptImages(formData: FormData) {
  return formData
    .getAll("keepImages")
    .filter((value): value is string => typeof value === "string")
    .slice(0, MAX_IMAGES);
}

function isDuplicateSku(error: {
  code?: string;
  message: string;
  details?: string;
}) {
  return (
    error.code === "23505" ||
    /products_business_sku_key|duplicate key/i.test(
      `${error.message} ${error.details ?? ""}`,
    )
  );
}

/* -------------------------------------------------------------------------- */
/*  Storage                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Uploads an image to the product-images bucket.
 *
 * The file type and size are validated first, and the object path is built on
 * the server from the merchant's own slug, so a file can only ever be written
 * inside that merchant's folder.
 */
async function uploadImage(
  supabase: Awaited<ReturnType<typeof getCatalogueBusiness>>["supabase"],
  file: File,
  businessSlug: string,
  productId: string,
) {
  if (!PRODUCT_IMAGE_MIME_TYPES.includes(file.type as never)) {
    throw new Error(`"${file.name}" is not a supported image format.`);
  }

  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error(`"${file.name}" is larger than 3 MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = /^[a-z0-9]{2,5}$/.test(extension) ? extension : "jpg";
  const path = `${businessSlug}/${productId}/${crypto.randomUUID()}.${safeExtension}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

async function removeImages(
  supabase: Awaited<ReturnType<typeof getCatalogueBusiness>>["supabase"],
  paths: string[],
) {
  if (paths.length === 0) {
    return;
  }

  await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
}

/* -------------------------------------------------------------------------- */
/*  Column fallbacks                                                            */
/* -------------------------------------------------------------------------- */

type ProductInsert = {
  business_id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  price: number;
  cost: number | null;
  original_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  status: "active" | "archived";
  images: string[];
};

/**
 * The media migration adds `original_price` and `images`. Until it is applied
 * the product is written with the legacy columns so the catalogue keeps
 * working; the extra fields switch on as soon as the migration lands.
 */
function withoutMediaColumns(payload: Partial<ProductInsert>) {
  const rest: Partial<ProductInsert> = { ...payload };
  delete rest.original_price;
  delete rest.images;
  return rest;
}

async function insertProduct(
  supabase: Awaited<ReturnType<typeof getCatalogueBusiness>>["supabase"],
  payload: ProductInsert,
) {
  const first = await supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single();

  if (!first.error || !isMissingColumnError(first.error.message)) {
    return first;
  }

  return supabase
    .from("products")
    .insert(withoutMediaColumns(payload))
    .select("id")
    .single();
}

async function updateProduct(
  supabase: Awaited<ReturnType<typeof getCatalogueBusiness>>["supabase"],
  productId: string,
  businessId: string,
  payload: Partial<ProductInsert>,
) {
  const first = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .eq("business_id", businessId)
    .select("id")
    .maybeSingle();

  if (!first.error || !isMissingColumnError(first.error.message)) {
    return first;
  }

  return supabase
    .from("products")
    .update(withoutMediaColumns(payload))
    .eq("id", productId)
    .eq("business_id", businessId)
    .select("id")
    .maybeSingle();
}

/* -------------------------------------------------------------------------- */
/*  Create                                                                      */
/* -------------------------------------------------------------------------- */

export async function createProductAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = productSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const { supabase, business, businessId } = await getCatalogueBusiness();

  if (!businessId || !business) {
    redirect("/login?next=%2Fdashboard%2Fproducts");
  }

  const description = parsed.data.description?.trim();
  const category = parsed.data.category?.trim();
  const cost = typeof parsed.data.cost === "number" ? parsed.data.cost : null;
  const originalPrice =
    typeof parsed.data.originalPrice === "number"
      ? parsed.data.originalPrice
      : null;

  const { data, error } = await insertProduct(supabase, {
    business_id: businessId,
    name: parsed.data.name,
    sku: parsed.data.sku.toUpperCase(),
    description: description ? description : null,
    category: category ? category : null,
    price: parsed.data.price,
    cost,
    original_price: originalPrice,
    stock_quantity: parsed.data.stockQuantity,
    low_stock_threshold: parsed.data.lowStockThreshold,
    status: parsed.data.status,
    images: [],
  });

  if (error || !data) {
    if (error && isDuplicateSku(error)) {
      return {
        status: "error",
        message: "A product with this SKU already exists.",
        fieldErrors: { sku: ["This SKU is already in use"] },
      };
    }

    return {
      status: "error",
      message:
        "We could not save this product. Nothing was changed — please try again.",
    };
  }

  const productId = data.id as string;
  const files = readFiles(formData);

  if (files.length > 0) {
    const { error: probeError } = await supabase
      .from("products")
      .select("images")
      .eq("id", productId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (probeError && isMissingColumnError(probeError.message)) {
      return {
        status: "error",
        message:
          "The product was created, but images are not available yet. Apply the product media migration to your workspace database to enable them.",
      };
    }

    const uploaded: string[] = [];

    try {
      for (const file of files) {
        uploaded.push(await uploadImage(supabase, file, business.slug, productId));
      }
    } catch (uploadError) {
      await removeImages(supabase, uploaded);

      return {
        status: "error",
        message: `The product was created, but the image could not be uploaded: ${
          uploadError instanceof Error ? uploadError.message : "unknown error"
        }`,
      };
    }

    const { error: attachError } = await supabase
      .from("products")
      .update({ images: uploaded })
      .eq("id", productId)
      .eq("business_id", businessId);

    if (attachError) {
      await removeImages(supabase, uploaded);

      return {
        status: "error",
        message:
          "The product was created, but the image could not be attached. Run the product media migration to enable images.",
      };
    }
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?created=1");
}

/* -------------------------------------------------------------------------- */
/*  Update                                                                      */
/* -------------------------------------------------------------------------- */

export async function updateProductAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = productSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const productId = formData.get("productId")?.toString() ?? "";

  if (!z.string().uuid().safeParse(productId).success) {
    return { status: "error", message: "That product could not be found." };
  }

  const { supabase, business, businessId } = await getCatalogueBusiness();

  if (!businessId || !business) {
    redirect("/login?next=%2Fdashboard%2Fproducts");
  }

  // The product must belong to this merchant before anything is changed.
  const { data: existing, error: readError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (readError || !existing) {
    return {
      status: "error",
      message: "That product could not be found in your catalogue.",
    };
  }

  const description = parsed.data.description?.trim();
  const category = parsed.data.category?.trim();
  const cost = typeof parsed.data.cost === "number" ? parsed.data.cost : null;
  const originalPrice =
    typeof parsed.data.originalPrice === "number"
      ? parsed.data.originalPrice
      : null;

  const { error } = await updateProduct(supabase, productId, businessId, {
    name: parsed.data.name,
    sku: parsed.data.sku.toUpperCase(),
    description: description ? description : null,
    category: category ? category : null,
    price: parsed.data.price,
    cost,
    original_price: originalPrice,
    stock_quantity: parsed.data.stockQuantity,
    low_stock_threshold: parsed.data.lowStockThreshold,
    status: parsed.data.status,
  });

  if (error) {
    if (isDuplicateSku(error)) {
      return {
        status: "error",
        message: "A product with this SKU already exists.",
        fieldErrors: { sku: ["This SKU is already in use"] },
      };
    }

    return {
      status: "error",
      message:
        "We could not save these changes. Nothing was modified — please try again.",
    };
  }

  // Images: keep what the merchant left in place, add the new uploads and drop
  // the ones that were removed in the editor.
  const { data: imageRow, error: imageError } = await supabase
    .from("products")
    .select("images")
    .eq("id", productId)
    .eq("business_id", businessId)
    .maybeSingle();

  const files = readFiles(formData);
  const imagesAvailable = !imageError;

  if (files.length > 0 && !imagesAvailable) {
    return {
      status: "error",
      message:
        "The changes were saved, but images are not available yet. Apply the product media migration to your workspace database to enable them.",
    };
  }

  if (imagesAvailable) {
    const currentImages = (imageRow?.images ?? []) as string[];
    const kept = readKeptImages(formData).filter((path) =>
      currentImages.includes(path),
    );
    const removed = currentImages.filter((path) => !kept.includes(path));

    const uploaded: string[] = [];

    try {
      for (const file of files) {
        uploaded.push(await uploadImage(supabase, file, business.slug, productId));
      }
    } catch (uploadError) {
      await removeImages(supabase, uploaded);

      return {
        status: "error",
        message: `The changes were saved, but the image could not be uploaded: ${
          uploadError instanceof Error ? uploadError.message : "unknown error"
        }`,
      };
    }

    const nextImages = [...kept, ...uploaded].slice(0, MAX_IMAGES);

    const { error: attachError } = await supabase
      .from("products")
      .update({ images: nextImages })
      .eq("id", productId)
      .eq("business_id", businessId);

    if (attachError) {
      await removeImages(supabase, uploaded);
    } else {
      await removeImages(supabase, removed);
    }
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?updated=1");
}

/* -------------------------------------------------------------------------- */
/*  Delete, restore, archive                                                    */
/* -------------------------------------------------------------------------- */

const productIdSchema = z.object({ productId: z.string().uuid() });

export async function deleteProductAction(formData: FormData): Promise<void> {
  const parsed = productIdSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    redirect("/dashboard/products?error=invalid");
  }

  const { supabase, businessId } = await getCatalogueBusiness();

  if (!businessId) {
    redirect("/login?next=%2Fdashboard%2Fproducts");
  }

  const { data: product } = await supabase
    .from("products")
    .select("images")
    .eq("id", parsed.data.productId)
    .eq("business_id", businessId)
    .maybeSingle();

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.productId)
    .eq("business_id", businessId);

  if (error) {
    if (isMissingColumnError(error.message)) {
      // Soft delete is not available yet, so the row is removed for good.
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", parsed.data.productId)
        .eq("business_id", businessId);

      if (deleteError) {
        redirect("/dashboard/products?error=delete");
      }
    } else {
      redirect("/dashboard/products?error=delete");
    }
  }

  await removeImages(supabase, (product?.images ?? []) as string[]);

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?deleted=1");
}

export async function restoreProductAction(formData: FormData): Promise<void> {
  const parsed = productIdSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    redirect("/dashboard/products?error=invalid");
  }

  const { supabase, businessId } = await getCatalogueBusiness();

  if (!businessId) {
    redirect("/login?next=%2Fdashboard%2Fproducts");
  }

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: null })
    .eq("id", parsed.data.productId)
    .eq("business_id", businessId);

  if (error) {
    redirect("/dashboard/products?error=restore");
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?restored=1");
}

export async function archiveProductAction(formData: FormData): Promise<void> {
  const parsed = productIdSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    redirect("/dashboard/products?error=invalid");
  }

  const { supabase, businessId } = await getCatalogueBusiness();

  if (!businessId) {
    redirect("/login?next=%2Fdashboard%2Fproducts");
  }

  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", parsed.data.productId)
    .eq("business_id", businessId);

  if (error) {
    redirect("/dashboard/products?error=archive");
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?archived=1");
}

export async function unarchiveProductAction(formData: FormData): Promise<void> {
  const parsed = productIdSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    redirect("/dashboard/products?error=invalid");
  }

  const { supabase, businessId } = await getCatalogueBusiness();

  if (!businessId) {
    redirect("/login?next=%2Fdashboard%2Fproducts");
  }

  const { error } = await supabase
    .from("products")
    .update({ status: "active" })
    .eq("id", parsed.data.productId)
    .eq("business_id", businessId);

  if (error) {
    redirect("/dashboard/products?error=archive");
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?restored=1");
}
