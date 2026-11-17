import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CircleX,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/section-heading";
import { Reveal } from "@/components/layout/reveal";
import { painPoints, solutionContent } from "@/content/marketing";

const painIcons = [ShoppingBag, Boxes, Wallet, BarChart3] as const;

export function ProblemSolution() {
  return (
    <section id="solution" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
          <Reveal>
            <Eyebrow>The reality</Eyebrow>
            <h2 className="mt-5 font-heading text-[1.85rem] leading-[1.12] font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
              Running a business shouldn&apos;t feel like guessing.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Most small businesses don&apos;t lose money because the team is
              weak. They lose it because the right information is scattered
              across five places at once.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {painPoints.map((point, index) => {
                const Icon = painIcons[index] ?? CircleX;

                return (
                  <li
                    key={point.title}
                    className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.035]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-8 place-items-center rounded-lg border border-rose-400/15 bg-rose-400/[0.07] text-rose-300">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/60">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-3 font-heading text-[13.5px] leading-snug font-medium">
                      {point.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                      {point.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={100} className="lg:sticky lg:top-28">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-px rounded-2xl bg-gradient-to-br from-electric-500/40 via-white/[0.06] to-cyan-glow/25"
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-navy-900/90 p-6 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(56,224,255,0.14),transparent_65%)] blur-2xl"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-mint-glow/20 bg-mint-glow/[0.07] px-3 py-1 text-[11px] font-medium text-mint-glow">
                    <span className="size-1.5 rounded-full bg-mint-glow shadow-[0_0_10px_2px_rgba(52,224,176,0.4)]" />
                    With TUMA
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    one live ledger
                  </span>
                </div>

                <h3 className="mt-5 font-heading text-xl leading-tight font-semibold tracking-[-0.03em] sm:text-2xl">
                  {solutionContent.title}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                  {solutionContent.description}
                </p>

                <ul className="mt-6 space-y-4">
                  {solutionContent.bullets.map((bullet) => (
                    <li key={bullet.title} className="flex gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-electric-500 to-cyan-glow text-navy-950">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      <div>
                        <p className="text-[13px] font-medium">{bullet.title}</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                          {bullet.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 grid grid-cols-3 divide-x divide-white/[0.07] rounded-xl border border-white/[0.07] bg-white/[0.02] py-3.5">
                  {[
                    { value: "1", label: "system" },
                    { value: "0", label: "re-typing" },
                    { value: "24/7", label: "visibility" },
                  ].map((item) => (
                    <div key={item.label} className="px-3 text-center">
                      <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
                        {item.value}
                      </p>
                      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href="#demo"
                  className="group mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-cyan-glow transition-colors hover:text-electric-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  See it in the product
                  <ArrowRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
