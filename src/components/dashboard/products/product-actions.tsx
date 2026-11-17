"use client";

import { useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  archiveProductAction,
  deleteProductAction,
  restoreProductAction,
  unarchiveProductAction,
} from "@/app/(app)/dashboard/products/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActionKind = "delete" | "archive" | "restore" | "unarchive";

const COPY: Record<
  ActionKind,
  { title: string; description: string; confirm: string; tone: string }
> = {
  delete: {
    title: "Delete this product?",
    description:
      "The product leaves your catalogue and its images are removed. Orders that already reference it keep their history.",
    confirm: "Delete product",
    tone: "bg-rose-500 text-white hover:bg-rose-500/90",
  },
  archive: {
    title: "Archive this product?",
    description:
      "Archived products stay in your records but are hidden from the active catalogue. You can restore them at any time.",
    confirm: "Archive product",
    tone: "bg-white/10 text-foreground hover:bg-white/[0.16]",
  },
  restore: {
    title: "Restore this product?",
    description:
      "The product comes back to your catalogue with the details you set before.",
    confirm: "Restore product",
    tone: "bg-white/10 text-foreground hover:bg-white/[0.16]",
  },
  unarchive: {
    title: "Make this product available again?",
    description:
      "The product returns to your active catalogue and can be sold once more.",
    confirm: "Make available",
    tone: "bg-white/10 text-foreground hover:bg-white/[0.16]",
  },
};

export function ProductActions({
  productId,
  status,
  deleted,
  onEdit,
}: {
  productId: string;
  status: "active" | "archived";
  deleted?: boolean;
  onEdit?: () => void;
}) {
  const [dialog, setDialog] = useState<ActionKind | null>(null);
  const [pending, startTransition] = useTransition();

  function run(kind: ActionKind) {
    const payload = new FormData();
    payload.set("productId", productId);

    startTransition(async () => {
      if (kind === "delete") {
        await deleteProductAction(payload);
      } else if (kind === "archive") {
        await archiveProductAction(payload);
      } else if (kind === "restore") {
        await restoreProductAction(payload);
      } else {
        await unarchiveProductAction(payload);
      }
      setDialog(null);
    });
  }

  const copy = dialog ? COPY[dialog] : null;

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {onEdit && !deleted ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Edit product"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
        ) : null}

        {deleted ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDialog("restore")}
            aria-label="Restore product"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </Button>
        ) : status === "archived" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDialog("unarchive")}
            aria-label="Make product available"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <ArchiveRestore className="size-3.5" aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDialog("archive")}
            aria-label="Archive product"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Archive className="size-3.5" aria-hidden />
          </Button>
        )}

        {!deleted ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDialog("delete")}
            aria-label="Delete product"
            className="size-8 text-muted-foreground hover:text-rose-300"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
      >
        <DialogContent className="border-white/[0.08] bg-navy-850">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{copy?.title}</DialogTitle>
            <DialogDescription className="text-[12px] leading-relaxed text-muted-foreground">
              {copy?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialog(null)}
              className="h-9 rounded-lg px-3 text-[12.5px] text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => dialog && run(dialog)}
              disabled={pending}
              className={`h-9 rounded-lg px-3 text-[12.5px] ${copy?.tone ?? ""}`}
            >
              {pending ? "Working…" : copy?.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
