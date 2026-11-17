import type { ReactNode } from "react";

import { cn } from "cn";

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-white/[0.02]",
        className,
      )}
    >
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-heading text-[13.5px] font-medium">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action ? (
            <div className="flex shrink-0 items-center gap-2">{action}</div>
          ) : null}
        </div>
      ) : null}

      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
