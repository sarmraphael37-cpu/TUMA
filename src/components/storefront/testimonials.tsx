import { Quote, Star } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { testimonialsContent } from "@/content/marketing";

export function Testimonials() {
  return (
    <section id="customers" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={testimonialsContent.eyebrow}
            title={testimonialsContent.title}
            description={testimonialsContent.description}
          />
        </Reveal>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {testimonialsContent.testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.name} delay={index * 80}>
              <figure className="group relative flex h-full flex-col rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.015] p-6 transition-colors duration-300 hover:border-white/[0.14]">
                <Quote
                  className="absolute top-5 right-5 size-7 text-white/[0.07] transition-colors group-hover:text-electric-400/25"
                  aria-hidden
                />

                <div className="flex gap-0.5 text-amber-glow" aria-label="5 out of 5">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="size-3.5 fill-current"
                      aria-hidden
                    />
                  ))}
                </div>

                <blockquote className="mt-4 flex-1 text-[13.5px] leading-relaxed text-foreground/85">
                  “{testimonial.quote}”
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-4">
                  <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-electric-400 to-cyan-glow text-[11px] font-semibold text-navy-950">
                    {testimonial.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">
                      {testimonial.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {testimonial.role} · {testimonial.business}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240}>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["SM", "BT", "AN", "JK"].map((initials, index) => (
                  <span
                    key={initials}
                    className="grid size-8 place-items-center rounded-full border-2 border-navy-950 bg-gradient-to-br from-electric-400 to-cyan-glow text-[9px] font-semibold text-navy-950"
                    style={{ zIndex: 4 - index }}
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <p className="text-[12px] text-muted-foreground">
                <span className="font-medium text-foreground">1,200+ businesses</span>{" "}
                run their day on TUMA across 6 African markets.
              </p>
            </div>
            <a
              href="mailto:hello@tuma.africa?subject=Customer%20reference"
              className="text-[12px] font-medium text-cyan-glow transition-colors hover:text-electric-300"
            >
              Ask for a customer reference
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
