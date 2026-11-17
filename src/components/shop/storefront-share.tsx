"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShop } from "@/components/shop/shop-provider";
import { QrCodeLink } from "@/components/qr-code";

type StorefrontShareProps = {
  slug: string;
  businessName: string;
};

export function StorefrontShare({ slug, businessName }: StorefrontShareProps) {
  const { entries } = useShop();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const storeUrl = `/shop/${slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
    } catch (err) {
      fallbackCopy(storeUrl);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      console.error("Fallback copy failed", e);
    }
    document.body.removeChild(textarea);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-6 space-y-4">

        <DialogHeader>
          <DialogTitle>Share TUMA Storefront</DialogTitle>
        </DialogHeader>

        <p className="text-[12px] text-muted-foreground">
          Share your shop with customers via link or QR code
        </p>

        <div className="flex gap-3 w-full">
          <input
            type="text"
            value={storeUrl}
            readOnly
            onCopy={() => setLink(storeUrl)}
            onPaste={(e) => {
              const text = e.clipboardData?.getData("text/plain") ?? "";
              if (text.includes("shop")) setLink(text);
            }}
            className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[11px] outline-none focus:border-white/[0.14]"
            placeholder="/shop/your-slug"
          />
          <button
            onClick={copyLink}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[11px] font-medium transition-colors hover:bg-white/[0.04]"
            aria-label="Copy shop link"
          >
            Copy Link
          </button>
        </div>

        {entries.length > 0 ? (
          <div className="mt-4">
            <QrCodeLink
              url={storeUrl}
              size={200}
              qrSize={160}
              className="mx-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-2"
            />
          </div>
        ) : null}

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-10 rounded-lg px-4 text-[11px]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}