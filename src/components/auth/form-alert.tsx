import { AlertTriangle, CircleCheck, Info } from "lucide-react";

import { cn } from "cn";

const tones = {
  error: {
    icon: AlertTriangle,
    className: "border-rose-400/20 bg-rose-400/[0.07] text-rose-200",
  },
  success: {
    icon: CircleCheck,
    className: "border-mint-glow/20 bg-mint-glow/[0.07] text-mint-glow",
  },
  info: {
    icon: Info,
    className: "border-cyan-glow/20 bg-cyan-glow/[0.06] text-electric-200",
  },
} as const;

export function FormAlert({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClass } = tones[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[12px] leading-relaxed",
        toneClass,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
