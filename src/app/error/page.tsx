"use client";

import { X } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-navy-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
          <X className="size-6 text-mint-glow mx-auto mb-4" />
          <h2 className="font-heading text-[2rem] font-semibold text-white mb-4">
            Something went wrong
          </h2>
          <p className="text-[12px] text-muted-foreground mb-6">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[11px] font-medium transition-colors hover:bg-white/[0.04]"
          >
            Try Again
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {process.env.NODE_ENV === "development" ? `Error: ${error.message}` : ""}
        </p>
      </div>
    </div>
  );
}