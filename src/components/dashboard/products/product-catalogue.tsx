"use client";

import { useState } from "react";
import { PackagePlus } from "lucide-react";

import {
  createProductAction,
  updateProductAction,
} from "@/app/(app)/dashboard/products/actions";
import { ProductCard } from "@/components/dashboard/products/product-card";
import {
  ProductForm,
  type ProductFormCapabilities,
} from "@/components/dashboard/products/product-form";
import { ProductRow } from "@/components/dashboard/products/product-row";
import type { CatalogueProduct } from "@/lib/db/catalogue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The button that opens the create-product dialog.
 *
 * It lives in the page header so a merchant can always add a product, even
 * when the catalogue is still empty.
 */
export function ProductCreateButton({
  capabilities,
}: {
  capabilities?: ProductFormCapabilities;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setCreating(true)}
        className="h-9 rounded-xl px-3.5 text-[12px]"
      >
        <PackagePlus className="size-3.5" aria-hidden />
        New product
      </Button>

      <Dialog open={creating} onOpenChange={(open) => setCreating(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/[0.08] bg-navy-850 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Add a product</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              It is saved straight to your catalogue and can be sold as soon as
              it is available.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ProductForm
              action={createProductAction}
              submitLabel="Create product"
              capabilities={capabilities}
              onDone={() => setCreating(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** The catalogue itself: cards or rows, plus the edit dialog. */
export function ProductCatalogue({
  products,
  currency,
  view,
  capabilities,
}: {
  products: CatalogueProduct[];
  currency: string;
  view: "grid" | "table";
  capabilities?: ProductFormCapabilities;
}) {
  const [editing, setEditing] = useState<CatalogueProduct | null>(null);

  return (
    <>
      {view === "table" ? (
        <div className="space-y-2">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              currency={currency}
              onEdit={() => setEditing(product)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              onEdit={() => setEditing(product)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/[0.08] bg-navy-850 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Edit product</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              Changes apply immediately to your catalogue and inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {editing ? (
              <ProductForm
                action={updateProductAction}
                submitLabel="Save changes"
                values={{
                  productId: editing.id,
                  name: editing.name,
                  sku: editing.sku,
                  description: editing.description ?? "",
                  category: editing.category ?? "",
                  price: String(editing.price ?? ""),
                  originalPrice:
                    editing.original_price === null || editing.original_price === undefined
                      ? ""
                      : String(editing.original_price),
                  cost:
                    editing.cost === null || editing.cost === undefined
                      ? ""
                      : String(editing.cost),
                  stockQuantity: String(editing.stock_quantity ?? "0"),
                  lowStockThreshold: String(editing.low_stock_threshold ?? "5"),
                  status: editing.status,
                  images: editing.images ?? [],
                }}
                onDone={() => setEditing(null)}
                capabilities={capabilities}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
