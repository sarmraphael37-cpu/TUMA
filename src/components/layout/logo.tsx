import Link from "next/link";

import { cn } from "cn";

type LogoMarkProps = {
  className?: string;
};

/**
 * The TUMA monogram: a midnight tile with an electric-blue to cyan gradient,
 * a white T and a cyan intelligence spark.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="TUMA"
      className={cn("size-9 shrink-0", className)}
    >
      <defs>
        <linearGradient
          id="tuma-mark-gradient"
          x1="4"
          y1="2"
          x2="45"
          y2="47"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2E7CFF" />
          <stop offset="0.55" stopColor="#1F63E6" />
          <stop offset="1" stopColor="#12B8D8" />
        </linearGradient>
        <linearGradient
          id="tuma-mark-sheen"
          x1="10"
          y1="4"
          x2="34"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="14" fill="url(#tuma-mark-gradient)" />
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="13"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.16"
      />
      <path
        d="M9 6c6-3 14-4 21-2"
        stroke="url(#tuma-mark-sheen)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M15 17.5h18"
        stroke="#ffffff"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M24 17.5v15"
        stroke="#ffffff"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <circle cx="35.5" cy="12.5" r="2.6" fill="#38E0FF" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
  href?: string;
};

export function Logo({
  className,
  markClassName,
  showTagline = false,
  href = "/",
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="TUMA — home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <LogoMark
        className={cn(
          "transition-transform duration-300 group-hover:-translate-y-0.5",
          markClassName,
        )}
      />
      <span className="flex flex-col">
        <span className="font-heading text-[1.35rem] leading-none font-semibold tracking-[-0.03em] text-foreground">
          TUMA
        </span>
        {showTagline ? (
          <span className="mt-1.5 text-[9px] leading-none font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Your Business. Your Orders. Your Growth.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
