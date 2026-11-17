import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function FinalCta() {
  return (
    <section id="get-started" className="scroll-mt-24 pb-20 sm:pb-24 lg:pb-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-navy-900 px-6 py-14 text-center shadow-[0_50px_140px_-60px_rgba(37,99,235,0.7)] sm:px-10 sm:py-16 lg:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_70%_80%_at_50%_50%,black,transparent)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(46,124,255,0.28),transparent_62%)] blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-[12%] -bottom-24 size-[280px] rounded-full bg-[radial-gradient(circle,rgba(56,224,255,0.18),transparent_65%)] blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-glow/40 to-transparent"
            />

            <div className="relative mx-auto flex max-w-2xl flex-col items-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/20 bg-cyan-glow/[0.06] px-3 py-1.5 text-[11px] font-medium text-cyan-glow">
                <Sparkles className="size-3" aria-hidden />
                Your Business. Your Orders. Your Growth.
              </span>

              <h2 className="mt-6 font-heading text-[2rem] leading-[1.08] font-semibold tracking-[-0.04em] text-balance sm:text-[2.7rem]">
                Stop running your business from memory.
              </h2>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Bring your orders, stock, invoices and cash flow into one calm
                workspace. Start free today, and see the difference in your first
                week.
              </p>

              <div className="mt-8 flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants(),
                    "group h-11 rounded-full px-6 text-[14px] shadow-[0_18px_50px_-16px_rgba(37,99,235,0.9)]",
                  )}
                >
                  Start your free trial
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="#demo"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "group h-11 rounded-full border-white/[0.12] bg-white/[0.04] px-6 text-[14px] text-foreground backdrop-blur hover:bg-white/[0.08]",
                  )}
                >
                  Explore the demo
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-mint-glow" aria-hidden />
                  14-day free trial
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-cyan-glow" aria-hidden />
                  No credit card required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-mint-glow" aria-hidden />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
