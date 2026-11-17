import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { assuranceItems } from "@/content/marketing";

/** Trust strip: the operational promises behind the product. */
export function AssuranceStrip() {
  return (
    <section
      id="security"
      aria-label="Security and reliability"
      className="scroll-mt-24 border-y border-white/[0.06] bg-white/[0.015]"
    >
      <Container className="py-8 sm:py-9">
        <Reveal>
          <p className="text-center text-[10.5px] font-medium tracking-[0.2em] text-muted-foreground/70 uppercase">
            Built for trust from day one
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            {assuranceItems.map((item) => {
              const Icon = item.icon;

              return (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-[11px] leading-snug text-muted-foreground sm:text-[11.5px]"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md border border-white/[0.06] bg-white/[0.03] text-electric-300">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  {item.label}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
