import { Mail, MessageCircleQuestion } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqContent } from "@/content/marketing";

export function FaqSection() {
  return (
    <section id="faq" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow={faqContent.eyebrow}
              title={faqContent.title}
              description={faqContent.description}
            />

            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-electric-500/10 text-electric-300">
                  <MessageCircleQuestion className="size-4" aria-hidden />
                </span>
                <p className="text-[13px] font-medium">Still deciding?</p>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                Send us the question you actually have. A real person on the team
                replies — usually within one working day.
              </p>
              <a
                href="mailto:hello@tuma.africa?subject=Question%20about%20TUMA"
                className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-cyan-glow transition-colors hover:text-electric-300"
              >
                <Mail className="size-3.5" aria-hidden />
                hello@tuma.africa
              </a>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <Accordion
              type="single"
              collapsible
              defaultValue="faq-0"
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 sm:px-6"
            >
              {faqContent.faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${index}`}
                  className="border-white/[0.06] not-last:border-b"
                >
                  <AccordionTrigger className="py-4 text-left font-heading text-[13.5px] leading-snug font-medium hover:no-underline sm:text-[14.5px]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
