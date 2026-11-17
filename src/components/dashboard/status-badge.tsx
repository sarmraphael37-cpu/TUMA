import type { ReactNode } from "react";

import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

export type StatusTone =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "brand"
  | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "border-mint-glow/25 bg-mint-glow/10 text-mint-glow",
  info: "border-cyan-glow/25 bg-cyan-glow/10 text-cyan-glow",
  warning: "border-amber-glow/25 bg-amber-glow/10 text-amber-glow",
  danger: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  brand: "border-electric-400/25 bg-electric-400/10 text-electric-300",
  neutral: "border-white/10 bg-white/[0.04] text-muted-foreground",
};

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
};

/** Compact status pill used in dashboard tables and previews. */
export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-[18px] rounded-full px-1.5 text-[9px] font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </Badge>
  );
}
