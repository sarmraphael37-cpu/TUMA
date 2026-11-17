"use client";

import { Minus, Plus } from "lucide-react";

/**
 * Quantity control.
 *
 * The stepper never goes below one unit and never above what the shop still
 * has in stock.
 */
export function QuantityStepper({
  value,
  onChange,
  max = 999,
  min = 1,
  label = "Quantity",
  size = "sm",
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const button =
    size === "md"
      ? "size-8 rounded-lg"
      : "size-7 rounded-md";
  const readout = size === "md" ? "min-w-9 text-[13px]" : "min-w-7 text-[12px]";

  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`grid ${button} place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground disabled:pointer-events-none disabled:opacity-40`}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>

      <span className={`${readout} text-center font-medium tabular-nums`}>
        {value}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`grid ${button} place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground disabled:pointer-events-none disabled:opacity-40`}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
