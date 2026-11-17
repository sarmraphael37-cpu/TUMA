"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { pricingContent } from "@/content/marketing";
import { formatNumber } from "@/lib/format";
import { cn } from "cn";

type Billing = "monthly" | "annual";

export function PricingPreview() {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <section id="pricing" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-[520px] bg-[radial-gradient(ellipse_55%_60%_at_50%_40%,rgba(46,124,255,0.14),transparent)]"
      />

      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={pricingContent.eyebrow}
            title={pricingContent.title}
            description={pricingContent.description}
            align="center"
            className="max-w-2xl"
          />
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-8 flex flex-col items-center gap-2.5">
            <div
              role="group"
              aria-label="Billing period"
              className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur"
            >
              {(
                [
                  { value: "monthly", label: "Monthly" },
                  { value: "annual", label: "Annual" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={billing === option.value}
                  onClick={() => setBilling(option.value)}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    billing === option.value
                      ? "bg-gradient-to-r from-electric-500 to-electric-600 text-white shadow-[0_6px_20px_-8px_rgba(37,99,235,0.9)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Annual billing saves up to{" "}
              <span className="font-medium text-mint-glow">20%</span> · prices in
              XAF
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 lg:grid-cols-3 lg:items-stretch">
          {pricingContent.tiers.map((tier, index) => {
            const price =
              billing === "annual" ? tier.annualPrice : tier.monthlyPrice;

            return (
              <Reveal key={tier.name} delay={index * 80}>
                <article
                  className={cn(
                    "relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 transition-colors duration-300",
                    tier.highlighted
                      ? "border-electric-400/35 bg-gradient-to-b from-electric-600/20 via-navy-850/90 to-navy-900 shadow-[0_30px_90px_-40px_rgba(37,99,235,0.65)]"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.13]",
                  )}
                >
                  {tier.highlighted ? (
                    <>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,224,255,0.16),transparent_65%)] blur-2xl"
                      />
                      <span className="absolute top-0 right-0 rounded-bl-xl border-b border-l border-electric-400/25 bg-electric-500/15 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-cyan-glow uppercase">
                        Most popular
                      </span>
                    </>
                  ) : null}

                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-[15px] font-medium tracking-[-0.01em]">
                        {tier.name}
                      </h3>
                      {tier.highlighted ? (
                        <Sparkles className="size-3.5 text-cyan-glow" aria-hidden />
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {tier.description}
                    </p>

                    <div className="mt-5 flex items-end gap-1.5">
                      <span className="font-heading text-[2.35rem] leading-none font-semibold tracking-[-0.04em]">
                        {formatNumber(price)}
                      </span>
                      <span className="pb-1 text-[12px] text-muted-foreground">
                        XAF
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      per month
                      {billing === "annual" ? ", billed annually" : ", billed monthly"}
                    </p>

                    <ul className="mt-6 space-y-2.5">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground/80"
                        >
                          <Check
                            className={cn(
                              "mt-0.5 size-3.5 shrink-0",
                              tier.highlighted ? "text-cyan-glow" : "text-mint-glow",
                            )}
                            aria-hidden
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative mt-7 pt-1">
                    <Link
                      href="/register"
                      className={cn(
                        buttonVariants({
                          variant: tier.highlighted ? "default" : "outline",
                        }),
                        "h-10 w-full rounded-xl text-[13px]",
                      )}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={220}>
          <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:flex-row">
            <p className="text-center text-[12px] text-muted-foreground sm:text-left">
              Every plan includes a 14-day free trial, free data export and no
              setup fees.
            </p>
            <a
              href="mailto:hello@tuma.africa?subject=Custom%20TUMA%20plan"
              className="shrink-0 text-[12px] font-medium text-cyan-glow transition-colors hover:text-electric-300"
            >
              Need a custom plan? Talk to us
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
