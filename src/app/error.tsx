"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative overflow-hidden pt-32 pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,93,122,0.12),transparent_65%)] blur-2xl"
      />

      <Container>
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] text-rose-300">
            <TriangleAlert className="size-6" aria-hidden />
          </span>

          <h1 className="mt-6 font-heading text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">
            Something went wrong.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            An unexpected error interrupted this page. Nothing was lost — try
            again, or head back to the homepage.
          </p>

          {error.digest ? (
            <p className="mt-4 rounded-md border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Button
              onClick={reset}
              className="h-10 rounded-full px-5 text-[13px]"
            >
              <RefreshCw className="size-4" aria-hidden />
              Try again
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-white/[0.1] bg-white/[0.03] px-5 text-[13px]"
            >
              <Link href="/">
                <ArrowLeft className="size-4" aria-hidden />
                Back to homepage
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-[11.5px] text-muted-foreground">
            Still stuck? Email{" "}
            <a
              href="mailto:support@tuma.africa"
              className="text-cyan-glow underline-offset-4 hover:underline"
            >
              support@tuma.africa
            </a>
            .
          </p>
        </div>
      </Container>
    </div>
  );
}
