import type { ReactNode } from "react";

import { cn } from "cn";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

/** A small brand label used above section titles. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-electric-300 uppercase",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-cyan-glow shadow-[0_0_10px_2px_rgba(56,224,255,0.45)]"
      />
      {children}
    </span>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

/** Consistent section header used across the marketing page. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "mt-5 font-heading text-[1.85rem] leading-[1.12] font-semibold tracking-[-0.035em] text-balance text-foreground sm:text-4xl lg:text-[2.7rem]",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base",
            align === "center" && "mx-auto",
            descriptionClassName,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
