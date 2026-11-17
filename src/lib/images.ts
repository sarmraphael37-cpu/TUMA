/**
 * Helpers for product images stored in Supabase Storage.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://uotagtyiwtbdaeteggap.supabase.co";

export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Public URL for a stored product image path. */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}

export type PreparedImage = {
  file: File;
  previewUrl: string;
};

/**
 * Downscales and re-encodes an image in the browser so uploads stay small
 * enough for a Server Action body while still looking sharp in the catalogue.
 */
export async function prepareProductImage(file: File): Promise<PreparedImage> {
  const MAX_EDGE = 1200;
  const QUALITY = 0.82;

  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not an image.");
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not process the image.");
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );

    if (!blob) {
      throw new Error("Could not process the image.");
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "product";
    const prepared = new File([blob], `${name}.webp`, {
      type: "image/webp",
    });

    return { file: prepared, previewUrl: URL.createObjectURL(prepared) };
  } catch {
    // Fall back to the original file when the browser cannot re-encode it.
    return { file, previewUrl: URL.createObjectURL(file) };
  }
}
