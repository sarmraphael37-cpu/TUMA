import type { ReactNode } from "react";

import { cn } from "cn";

/**
 * Empty state for a card or a section.
 *
 * The icon is a node rather than a component reference on purpose: passing a
 * component across the server/client boundary makes the surrounding Suspense
 * boundary render as a permanent fallback in a partial-prerendered route.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-5 py-10 text-center",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-muted-foreground">
        {icon}
      </span>
      <p className="mt-3 text-[12.5px] font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
