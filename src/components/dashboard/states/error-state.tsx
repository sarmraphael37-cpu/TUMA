"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, TriangleAlert } from "lucide-react";

import { cn } from "cn";

export function ErrorState({
  title = "We could not load this section",
  description = "Nothing was changed. Retry in a moment — if it keeps failing, check your connection.",
  className,
  compact = false,
}: {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-xl border border-rose-400/20 bg-rose-400/[0.05] px-5 text-center",
        compact ? "py-6" : "py-10",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-xl border border-rose-400/25 bg-rose-400/10 text-rose-300">
        <TriangleAlert className="size-4.5" aria-hidden />
      </span>
      <p className="mt-3 text-[12.5px] font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-[11.5px] font-medium transition-colors hover:bg-white/[0.07]"
      >
        <RefreshCw className="size-3.5" aria-hidden />
        Try again
      </button>
    </div>
  );
}
