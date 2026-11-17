import Link from "next/link";
import { ArrowRight, CircleCheckBig, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { howItWorksContent } from "@/content/marketing";
import { cn } from "cn";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 -z-10 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(139,124,255,0.12),transparent_65%)] blur-3xl"
      />

      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow={howItWorksContent.eyebrow}
              title={howItWorksContent.title}
              description={howItWorksContent.description}
            />

            <div className="mt-7 flex flex-wrap gap-2">
              {["No consultants", "No long migration", "No credit card"].map(
                (item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] text-muted-foreground"
                  >
                    <CircleCheckBig className="size-3 text-mint-glow" aria-hidden />
                    {item}
                  </span>
                ),
              )}
            </div>

            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "group mt-7 h-10 rounded-full border-white/[0.1] bg-white/[0.03] px-5 text-[13px] backdrop-blur hover:bg-white/[0.07]",
              )}
            >
              Start your free trial
              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Reveal>

          <div className="relative">
            <div
              aria-hidden
              className="absolute top-4 bottom-4 left-[27px] w-px bg-gradient-to-b from-electric-500/60 via-white/10 to-transparent sm:left-[31px]"
            />

            <ol className="space-y-3">
              {howItWorksContent.steps.map((step, index) => (
                <Reveal key={step.step} delay={index * 90}>
                  <li className="group relative flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-electric-400/25 hover:bg-white/[0.04] sm:gap-5 sm:p-6">
                    <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-navy-850 font-heading text-lg font-semibold tracking-tight text-electric-300 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] sm:size-16">
                      {step.step}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="font-heading text-[16px] font-medium tracking-[-0.02em] sm:text-[17px]">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(index === 0
                          ? ["CSV import", "Team invites", "Guided setup"]
                          : index === 1
                            ? ["Quotes", "Invoices", "Delivery"]
                            : ["Dashboards", "AI insights", "Exports"]
                        ).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={280}>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-glow/15 bg-gradient-to-r from-cyan-glow/[0.07] via-transparent to-electric-500/[0.07] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-cyan-glow/10 text-cyan-glow">
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium">
                      Average setup time: 1 afternoon
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      Most teams send their first invoice the same day.
                    </p>
                  </div>
                </div>
                <a
                  href="mailto:hello@tuma.africa?subject=TUMA%20walkthrough"
                  className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-cyan-glow transition-colors hover:text-electric-300"
                >
                  Book a walkthrough
                  <ArrowRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
