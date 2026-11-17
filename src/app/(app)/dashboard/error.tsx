"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error", error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] px-6 py-10 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-rose-400/25 bg-rose-400/10 text-rose-300">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 font-heading text-[1.1rem] font-semibold">
          We could not open your dashboard
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Your data is safe — nothing was changed. Try again, and if it keeps
          happening check that your Supabase migrations are applied.
        </p>
        <Button onClick={reset} className="mt-5 h-9 rounded-xl text-[12.5px]">
          Try again
        </Button>
      </div>
    </div>
  );
}
