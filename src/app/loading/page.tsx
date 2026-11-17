"use client";

import { Loader2 } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="space-y-8">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <Loader2 className="size-12 mx-auto mb-4 animate-spin text-electric-300" />
          <h2 className="font-heading text-[1.5rem] font-semibold text-white text-center">
            TUMA
          </h2>
          <p className="text-[12px] text-muted-foreground text-center">
            Loading your dashboard...
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          If you are redirected, please wait or <a href="/" className="text-cyan-glow hover:underline">go home</a>
        </p>
      </div>
    </div>
  );
}