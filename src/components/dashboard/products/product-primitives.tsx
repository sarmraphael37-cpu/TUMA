import type { ReactNode } from "react";

import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { cn } from "cn";

export type StockState = "out" | "low" | "ok";

export function stockState(
  stock: number,
  threshold: number,
): { state: StockState; label: string; tone: StatusTone } {
  if (stock === 0) {
    return { state: "out", label: "Out of stock", tone: "danger" };
  }

  if (stock <= threshold) {
    return { state: "low", label: "Low stock", tone: "warning" };
  }

  return { state: "ok", label: "In stock", tone: "success" };
}

/** Small bar that visualises how much stock is left. */
export function StockMeter({
  stock,
  stockThreshold,
  className,
}: {
  stock: number;
  stockThreshold: number;
  className?: string;
}) {
  const ceiling = Math.max(stockThreshold * 2, 1);
  const ratio = Math.min(Math.round((stock / ceiling) * 100), 100);
  const { state } = stockState(stock, stockThreshold);

  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      role="presentation"
    >
      <div
        className={cn(
          "h-full rounded-full",
          state === "out"
            ? "bg-rose-400"
            : state === "low"
              ? "bg-amber-glow"
              : "bg-mint-glow",
        )}
        style={{ width: `${Math.max(ratio, stock > 0 ? 6 : 0)}%` }}
      />
    </div>
  );
}

export function AvailabilityBadge({
  status,
  deleted,
  tone,
}: {
  status: "active" | "archived";
  deleted?: boolean;
  tone?: StatusTone;
}) {
  if (deleted) {
    return <StatusBadge tone="neutral">Deleted</StatusBadge>;
  }

  if (status === "archived") {
    return <StatusBadge tone="neutral">Archived</StatusBadge>;
  }

  return <StatusBadge tone={tone ?? "success"}>Available</StatusBadge>;
}

export function DiscountBadge({
  price,
  originalPrice,
}: {
  price: number;
  originalPrice: number | null;
}) {
  if (!originalPrice || originalPrice <= price) {
    return null;
  }

  const off = Math.round(((originalPrice - price) / originalPrice) * 100);

  return (
    <StatusBadge tone="brand">
      {off}% off
    </StatusBadge>
  );
}

export function ProductPrice({
  price,
  originalPrice,
  currency,
}: {
  price: number;
  originalPrice: number | null;
  currency: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[12.5px] font-medium text-foreground">
        {new Intl.NumberFormat("fr-CM", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(Number(price))}
      </span>
      {originalPrice && originalPrice > price ? (
        <span className="text-[10.5px] text-muted-foreground line-through">
          {new Intl.NumberFormat("fr-CM", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          }).format(Number(originalPrice))}
        </span>
      ) : null}
    </span>
  );
}

export function ProductThumb({
  url,
  name,
  size = "md",
}: {
  url: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimension =
    size === "lg" ? "size-16" : size === "sm" ? "size-9" : "size-11";

  if (!url) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-[11px] font-medium text-muted-foreground",
          dimension,
        )}
        aria-hidden
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      loading="lazy"
      className={cn(
        "shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.03] object-cover",
        dimension,
      )}
    />
  );
}

export function ProductMetaRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/85">{value}</span>
    </div>
  );
}



