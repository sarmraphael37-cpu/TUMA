import Link from "next/link";
import { ArrowRight, Compass, Home } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

const suggestions = [
  { label: "Explore the product", href: "/#demo" },
  { label: "See pricing", href: "/#pricing" },
  { label: "Read the FAQ", href: "/#faq" },
  { label: "Talk to the team", href: "mailto:hello@tuma.africa" },
];

export default function NotFound() {
  return (
    <div className="relative overflow-hidden pt-32 pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(46,124,255,0.16),transparent_65%)] blur-2xl"
      />

      <Container>
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <p className="font-mono text-[11px] tracking-[0.3em] text-cyan-glow uppercase">
            Error 404
          </p>
          <h1 className="mt-4 font-heading text-4xl leading-none font-semibold tracking-[-0.045em] sm:text-6xl">
            This page isn&apos;t in the ledger.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
            The link may be out of date, or the page has moved. Everything you
            need is a click away.
          </p>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/"
              className={cn(
                buttonVariants(),
                "h-10 rounded-full px-5 text-[13px]",
              )}
            >
              <Home className="size-4" aria-hidden />
              Back to homepage
            </Link>
            <Link
              href="/#demo"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 rounded-full border-white/[0.1] bg-white/[0.03] px-5 text-[13px]",
              )}
            >
              <Compass className="size-4" aria-hidden />
              Explore the product
            </Link>
          </div>

          <div className="mt-10 w-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-2">
            <ul className="divide-y divide-white/[0.05]">
              {suggestions.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-[13px] text-foreground/80 transition-colors hover:bg-white/[0.04] hover:text-foreground"
                  >
                    {item.label}
                    <ArrowRight
                      className="size-3.5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
}
