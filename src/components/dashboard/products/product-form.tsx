"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/auth/form-alert";
import {
  PRODUCT_CATEGORY_SUGGESTIONS,
  PRODUCT_IMAGE_MAX_BYTES,
} from "@/lib/validation";
import { prepareProductImage, productImageUrl } from "@/lib/images";
import { cn } from "cn";
import type { FormState } from "@/lib/auth/form-state";

export type ProductFormValues = {
  productId?: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: string;
  originalPrice: string;
  cost: string;
  stockQuantity: string;
  lowStockThreshold: string;
  status: "active" | "archived";
  images: string[];
};

export type ProductFormCapabilities = {
  images?: boolean;
  originalPrice?: boolean;
};

type ProductFormProps = {
  action: (
    state: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  values?: ProductFormValues;
  capabilities?: ProductFormCapabilities;
  submitLabel?: string;
  onDone?: () => void;
};

const EMPTY: ProductFormValues = {
  name: "",
  sku: "",
  description: "",
  category: "",
  price: "",
  originalPrice: "",
  cost: "",
  stockQuantity: "0",
  lowStockThreshold: "5",
  status: "active",
  images: [],
};

export function ProductForm({
  action,
  values,
  capabilities,
  submitLabel = "Save product",
  onDone,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle" as const,
  });
  const [uploads, setUploads] = useState<{ file: File; previewUrl: string }[]>(
    [],
  );
  const [existingImages, setExistingImages] = useState<string[]>(
    values?.images ?? [],
  );
  const [imageError, setImageError] = useState<string | null>(null);

  const canUploadImages = capabilities?.images !== false;
  const canSetOriginalPrice = capabilities?.originalPrice !== false;

  // The editor reuses the form for a different product, so the kept images
  // follow the new values during render instead of in an effect.
  const incomingImages = values?.images ?? [];
  const [syncedImages, setSyncedImages] = useState(incomingImages);

  if (syncedImages !== incomingImages) {
    setSyncedImages(incomingImages);
    setExistingImages(incomingImages);
  }

  useEffect(() => {
    return () => {
      uploads.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
    };
  }, [uploads]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setImageError(null);
    const room = 4 - existingImages.length - uploads.length;

    if (room <= 0) {
      setImageError("You can attach up to four images.");
      return;
    }

    const next: { file: File; previewUrl: string }[] = [];

    for (const file of Array.from(files).slice(0, room)) {
      if (file.size > PRODUCT_IMAGE_MAX_BYTES * 2) {
        setImageError(`"${file.name}" is too large. Keep images under 3 MB.`);
        continue;
      }

      try {
        const prepared = await prepareProductImage(file);
        next.push(prepared);
      } catch (error) {
        setImageError(
          error instanceof Error ? error.message : "Could not read that image.",
        );
      }
    }

    if (next.length > 0) {
      setUploads((current) => [...current, ...next]);
    }
  }

  function removeExisting(path: string) {
    setExistingImages((current) => current.filter((item) => item !== path));
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // The selected files live in state so previews can be edited before
        // they are attached to the payload.
        if (uploads.length === 0) {
          return;
        }

        event.preventDefault();
        const payload = new FormData(event.currentTarget);
        uploads.forEach((upload) => payload.append("images", upload.file));
        void formAction(payload);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="productId" value={values?.productId ?? ""} />
      {existingImages.map((path) => (
        <input key={path} type="hidden" name="keepImages" value={path} />
      ))}

      {state.message ? (
        <FormAlert tone={state.status === "error" ? "error" : "success"}>
          {state.message}
        </FormAlert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Product name"
          htmlFor="name"
          error={state.fieldErrors?.name?.[0]}
          className="sm:col-span-2"
        >
          <Input
            id="name"
            name="name"
            defaultValue={values?.name ?? EMPTY.name}
            placeholder="Ankara fabric — indigo"
            required
            maxLength={160}
          />
        </Field>

        <Field label="SKU" htmlFor="sku" error={state.fieldErrors?.sku?.[0]}>
          <Input
            id="sku"
            name="sku"
            defaultValue={values?.sku ?? EMPTY.sku}
            placeholder="ANK-001"
            required
            maxLength={64}
            className="uppercase"
          />
        </Field>

        <Field
          label="Category"
          htmlFor="category"
          error={state.fieldErrors?.category?.[0]}
        >
          <Input
            id="category"
            name="category"
            list="product-categories"
            defaultValue={values?.category ?? EMPTY.category}
            placeholder="Textiles"
            maxLength={60}
          />
          <datalist id="product-categories">
            {PRODUCT_CATEGORY_SUGGESTIONS.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>

        <Field
          label="Selling price"
          htmlFor="price"
          error={state.fieldErrors?.price?.[0]}
        >
          <Input
            id="price"
            name="price"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            defaultValue={values?.price ?? EMPTY.price}
            placeholder="12500"
            required
          />
        </Field>

        {canSetOriginalPrice ? (
          <Field
            label="Original price"
            hint="Optional — shows a discount"
            htmlFor="originalPrice"
            error={state.fieldErrors?.originalPrice?.[0]}
          >
            <Input
              id="originalPrice"
              name="originalPrice"
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              defaultValue={values?.originalPrice ?? EMPTY.originalPrice}
              placeholder="15000"
            />
          </Field>
        ) : null}

        <Field
          label="Unit cost"
          hint="Optional — used for margin"
          htmlFor="cost"
          error={state.fieldErrors?.cost?.[0]}
        >
          <Input
            id="cost"
            name="cost"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            defaultValue={values?.cost ?? EMPTY.cost}
            placeholder="8000"
          />
        </Field>

        <Field
          label="Stock quantity"
          htmlFor="stockQuantity"
          error={state.fieldErrors?.stockQuantity?.[0]}
        >
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            defaultValue={values?.stockQuantity ?? EMPTY.stockQuantity}
            required
          />
        </Field>

        <Field
          label="Low-stock alert at"
          hint="Warn me when stock reaches this number"
          htmlFor="lowStockThreshold"
          error={state.fieldErrors?.lowStockThreshold?.[0]}
        >
          <Input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            defaultValue={values?.lowStockThreshold ?? EMPTY.lowStockThreshold}
            required
          />
        </Field>

        <Field label="Availability" htmlFor="status">
          <select
            id="status"
            name="status"
            defaultValue={values?.status ?? EMPTY.status}
            className="h-9 w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="active">Available</option>
            <option value="archived">Archived</option>
          </select>
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={state.fieldErrors?.description?.[0]}
          className="sm:col-span-2"
        >
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values?.description ?? EMPTY.description}
            placeholder="What makes this product worth buying?"
            maxLength={2000}
            className="min-h-[88px] resize-y bg-white/[0.03] text-[13px]"
          />
        </Field>
      </div>

      {canUploadImages ? (
        <ImagePicker
          existingImages={existingImages}
          uploads={uploads}
          imageError={imageError}
          onAddFiles={handleFiles}
          onRemoveExisting={removeExisting}
          onRemoveUpload={(previewUrl) =>
            setUploads((current) =>
              current.filter((item) => item.previewUrl !== previewUrl),
            )
          }
        />
      ) : (
        <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          Product images become available once the product media migration is
          applied to your workspace database.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending} className="h-10 rounded-xl px-4 text-[13px]">
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          {pending ? "Saving…" : submitLabel}
        </Button>
        {onDone ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onDone}
            className="h-10 rounded-xl px-3 text-[13px] text-muted-foreground"
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[11.5px] font-medium text-foreground/85"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[10.5px] text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Image picker for a product.
 *
 * Files are resized in the browser before they are handed to the server, and
 * the previews can still be changed before the form is submitted.
 */
function ImagePicker({
  existingImages,
  uploads,
  imageError,
  onAddFiles,
  onRemoveExisting,
  onRemoveUpload,
}: {
  existingImages: string[];
  uploads: { file: File; previewUrl: string }[];
  imageError: string | null;
  onAddFiles: (files: FileList | null) => void;
  onRemoveExisting: (path: string) => void;
  onRemoveUpload: (previewUrl: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-medium text-foreground/85">Product images</p>
      <p className="text-[10.5px] text-muted-foreground">
        JPG, PNG, WebP or AVIF up to 3 MB. Images are resized in your browser
        before they are uploaded.
      </p>

      <div className="flex flex-wrap gap-2">
        {existingImages.map((path) => {
          const url = productImageUrl(path);
          return (
            <div
              key={path}
              className="group relative size-16 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]"
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="size-full object-cover" />
              ) : null}
              <button
                type="button"
                onClick={() => onRemoveExisting(path)}
                aria-label="Remove image"
                className="absolute inset-0 grid place-items-center bg-navy-950/70 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-4 text-rose-200" aria-hidden />
              </button>
            </div>
          );
        })}

        {uploads.map((upload) => (
          <div
            key={upload.previewUrl}
            className="relative size-16 overflow-hidden rounded-lg border border-white/[0.08]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={upload.previewUrl}
              alt=""
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemoveUpload(upload.previewUrl)}
              aria-label="Remove image"
              className="absolute inset-0 grid place-items-center bg-navy-950/70"
            >
              <X className="size-4 text-rose-200" aria-hidden />
            </button>
          </div>
        ))}

        {existingImages.length + uploads.length < 4 ? (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="grid size-16 place-items-center rounded-lg border border-dashed border-white/[0.12] text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
            aria-label="Add product image"
          >
            <ImagePlus className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(event) => {
          onAddFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {imageError ? <p className="text-[11px] text-rose-300">{imageError}</p> : null}
    </div>
  );
}



