"use client";

import { useState } from "react";

export function QrCodeLink({
  url,
  size = 256,
  qrSize = 200,
  className,
}: {
  url: string;
  size?: number;
  qrSize?: number;
  className?: string;
}) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQr = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/qr-code?url=${encodeURIComponent(url)}&size=${qrSize}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("QR generation failed");
      const data = await response.json();
      setQrData(data.image);
    } catch (error) {
      console.error("QR code generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate on mount
  useState(() => {
    if (url) generateQr();
  });

  if (!qrData) {
    return (
      <div className="relative inline-block">
        <button
          onClick={generateQr}
          className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[11px] font-medium transition-colors hover:bg-white/[0.04] disabled:opacity-50 disabled:pointer-events-none"
          disabled={isGenerating}
          aria-label="Generate QR code"
        >
          {isGenerating ? (
            <span className="align-middle">Generating...</span>
          ) : (
            <span>QR Code</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <img
        src={qrData}
        alt="QR code for TUMA storefront"
        width={qrSize}
        height={qrSize}
        className="rounded-lg border border-white/[0.07] bg-white/[0.02]"
        loading="lazy"
      />
      <button
        onClick={() => navigator.clipboard.writeText(qrData)}
        className="absolute top-2 right-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Copy QR code"
        title="Copy QR code"
      >
        Copy
      </button>
    </div>
  );
}