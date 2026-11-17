import { ArrowUpRight, Check } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { featuresContent } from "@/content/marketing";
import { cn } from "cn";

export function Features() {
  const [lead, second, ...remaining] = featuresContent.features;
  const rest = remaining.filter((feature) => feature.title !== "AI insights");

  return (
    <section id="features" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(46,124,255,0.10),transparent)]"
      />

      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow={featuresContent.eyebrow}
              title={featuresContent.title}
              description={featuresContent.description}
              className="max-w-2xl"
            />
            <a
              href="#pricing"
              className="group inline-flex shrink-0 items-center gap-1.5 self-start text-[13px] font-medium text-cyan-glow transition-colors hover:text-electric-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:self-end"
            >
              Compare plans
              <ArrowUpRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[lead, second].map((feature, index) => {
            if (!feature) {
              return null;
            }

            const Icon = feature.icon;

            return (
              <Reveal key={feature.title} delay={index * 70} className="sm:col-span-1">
                <article className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-6 transition-colors duration-300 hover:border-electric-400/30">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(46,124,255,0.16),transparent_65%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <span className="grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-navy-800/80 text-cyan-glow shadow-inner">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-heading text-[17px] font-medium tracking-[-0.02em]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {(index === 0
                      ? ["Quotes", "Delivery", "Returns"]
                      : ["Live levels", "Alerts", "Suppliers"]
                    ).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Reveal>
            );
          })}

          <Reveal delay={140} className="sm:col-span-2 lg:col-span-1">
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-electric-400/20 bg-gradient-to-br from-electric-600/25 via-navy-850 to-navy-900 p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-grid opacity-30"
              />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-glow/25 bg-cyan-glow/10 px-2.5 py-1 text-[10px] font-medium tracking-wide text-cyan-glow uppercase">
                  AI included
                </span>
                <h3 className="mt-4 font-heading text-lg leading-snug font-medium tracking-[-0.02em]">
                  Ask your business a question. Get a real answer.
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  TUMA reads your orders, stock and payments — then explains what
                  changed and what to do next, in plain language.
                </p>
              </div>

              <div className="relative mt-5 rounded-xl border border-white/[0.08] bg-navy-950/60 p-3">
                <p className="text-[10px] text-muted-foreground">
                  “What should I restock before Friday?”
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/90">
                  Rice 25kg and POS rolls. Ordering today keeps both in stock
                  through month-end.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-mint-glow">
                  <Check className="size-3" aria-hidden />
                  Based on your last 90 days
                </div>
              </div>
            </div>
          </Reveal>

          {rest.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal key={feature.title} delay={index * 50}>
                <article
                  className={cn(
                    "group flex h-full items-start gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.035]",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-electric-300 transition-colors group-hover:text-cyan-glow">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-heading text-[13.5px] font-medium">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
