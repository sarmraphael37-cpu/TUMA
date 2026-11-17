import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { heroContent, heroStats } from "@/content/marketing";
import { cn } from "cn";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.55] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(46,124,255,0.28),transparent_65%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-[8%] -z-10 size-[280px] rounded-full bg-[radial-gradient(circle,rgba(56,224,255,0.16),transparent_65%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-52 left-[4%] -z-10 size-[240px] rounded-full bg-[radial-gradient(circle,rgba(139,124,255,0.14),transparent_65%)] blur-2xl"
      />

      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] py-1.5 pr-4 pl-1.5 text-[12px] font-medium text-muted-foreground backdrop-blur">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-electric-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-electric-300">
              <Sparkles className="size-3" aria-hidden />
              New
            </span>
            {heroContent.badge}
          </span>

          <h1 className="animate-fade-up mt-6 font-heading text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.045em] text-balance text-foreground sm:text-6xl lg:text-[4.15rem]">
            Run your business with{" "}
            <span className="relative inline-block">
              <span className="text-gradient">{heroContent.titleAccent}</span>
              <svg
                aria-hidden
                viewBox="0 0 320 14"
                className="absolute -bottom-1.5 left-0 h-2.5 w-full text-electric-500/60"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 10C64 4 132 2 318 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>

          <p className="animate-fade-up mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground text-pretty [animation-delay:80ms] sm:text-[17px]">
            {heroContent.description}
          </p>

          <div className="animate-fade-up mt-8 flex w-full flex-col items-stretch gap-2.5 [animation-delay:160ms] sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={heroContent.primaryCta.href}
              className={cn(
                buttonVariants(),
                "group h-11 rounded-full px-6 text-[14px] shadow-[0_18px_50px_-16px_rgba(37,99,235,0.9)]",
              )}
            >
              {heroContent.primaryCta.label}
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href={heroContent.secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "group h-11 rounded-full border-white/[0.1] bg-white/[0.03] px-6 text-[14px] text-foreground backdrop-blur hover:bg-white/[0.07]",
              )}
            >
              <MonitorPlay className="size-4 text-cyan-glow" aria-hidden />
              {heroContent.secondaryCta.label}
            </Link>
          </div>

          <p className="animate-fade-up mt-4 flex items-center gap-2 text-[11.5px] text-muted-foreground [animation-delay:220ms]">
            <CheckCircle2 className="size-3.5 text-mint-glow" aria-hidden />
            {heroContent.reassurance}
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-6xl sm:mt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 -top-4 bottom-8 -z-10 rounded-[2rem] bg-gradient-to-b from-electric-500/25 via-cyan-glow/10 to-transparent blur-2xl"
          />

          <div className="animate-fade-up [animation-delay:260ms]">
            <DashboardShell>
              <OverviewPanel />
            </DashboardShell>
          </div>

          <div className="animate-float absolute -top-10 -left-5 hidden w-[188px] rounded-xl border border-white/[0.09] bg-navy-850/85 p-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl xl:block">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-mint-glow/15 text-mint-glow">
                <Wallet className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground">Payment received</p>
                <p className="truncate text-[11px] font-semibold">144,000 XAF</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[8px] text-muted-foreground">
              <BadgeCheck className="size-2.5 text-cyan-glow" aria-hidden />
              MTN MoMo · Boutique Kana
            </div>
          </div>

          <div className="animate-float absolute -right-2 -bottom-6 hidden w-[210px] rounded-xl border border-white/[0.09] bg-navy-850/85 p-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl [animation-delay:0.8s] lg:block">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-electric-500/15 text-electric-300">
                <ShieldCheck className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground">TUMA Intelligence</p>
                <p className="truncate text-[11px] font-semibold">Margin insight ready</p>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[8px] leading-relaxed text-muted-foreground">
              Cooking oil margin slipped 4.2%. A 300 XAF price adjustment restores
              it.
            </p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-y-8 border-t border-white/[0.06] pt-9 sm:mt-16 lg:grid-cols-4 lg:gap-x-8">
          {heroStats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "relative px-1 lg:px-6",
                index > 0 && "lg:border-l lg:border-white/[0.06]",
              )}
            >
              <p className="font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-[28px]">
                {stat.value}
              </p>
              <p className="mt-1 text-[12px] font-medium text-foreground/80">
                {stat.label}
              </p>
              <p className="mt-1 max-w-[190px] text-[11px] leading-relaxed text-muted-foreground">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
