"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CalendarRange,
  Check,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ORDER_RANGES,
  ORDER_STATUS_FILTERS,
  PAYMENT_STATUS_FILTERS,
} from "@/lib/orders";
import { cn } from "cn";

/**
 * Search and filters for the order list.
 *
 * Everything is written to the URL, so the server re-queries Supabase for
 * exactly the window and the filters the merchant sees, and a filtered view
 * can be bookmarked or shared.
 */
export function OrderToolbar({
  total,
  range,
  from,
  to,
}: {
  total: number;
  range: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(currentQuery);
  const [syncedQuery, setSyncedQuery] = useState(currentQuery);

  // Follow the URL when the filter changes (navigation, back button).
  if (currentQuery !== syncedQuery) {
    setSyncedQuery(currentQuery);
    setQuery(currentQuery);
  }

  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");

  const status = searchParams.get("status") ?? "all";
  const payment = searchParams.get("payment") ?? "all";

  function push(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    if (!("page" in changes)) {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`/dashboard/orders?${params.toString()}`);
    });
  }

  function selectRange(key: string) {
    push({
      range: key === "30d" ? null : key,
      from: key === "custom" ? customFrom || null : null,
      to: key === "custom" ? customTo || null : null,
    });
  }

  function applyCustom() {
    if (!customFrom || !customTo) {
      return;
    }

    push({ range: "custom", from: customFrom, to: customTo });
  }

  const activeRange = ORDER_RANGES.some((preset) => preset.key === range)
    ? range
    : "custom";

  const filtersActive =
    query !== "" || status !== "all" || payment !== "all" || range !== "30d";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex h-9 flex-1 items-center rounded-xl border border-white/[0.07] bg-white/[0.025] focus-within:border-white/[0.14]">
          {pending ? (
            <Loader2
              className="pointer-events-none absolute left-3 size-3.5 animate-spin text-cyan-glow"
              aria-hidden
            />
          ) : (
            <Search
              className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground"
              aria-hidden
            />
          )}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                push({ q: query.trim() || null });
              }
            }}
            placeholder="Search by order number…"
            aria-label="Search orders by number"
            className="h-full w-full bg-transparent pr-9 pl-9 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                push({ q: null });
              }}
              aria-label="Clear search"
              className="absolute right-2 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="order-payment-filter">
            Filter by payment status
          </label>
          <select
            id="order-payment-filter"
            value={payment}
            onChange={(event) => push({ payment: event.target.value })}
            className="h-9 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PAYMENT_STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 rounded-xl border-white/[0.07] bg-white/[0.025] px-3 text-[11.5px] font-medium text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
                  activeRange === "custom" && "border-white/[0.14] text-foreground",
                )}
              >
                <CalendarRange className="size-3.5" aria-hidden />
                {activeRange === "custom"
                  ? "Custom range"
                  : (ORDER_RANGES.find((preset) => preset.key === activeRange)
                      ?.label ?? "30 days")}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 border border-white/[0.08] bg-navy-850 p-3"
            >
              <p className="text-[11px] font-medium">Date range</p>
              <div className="mt-2 grid gap-1">
                {ORDER_RANGES.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => selectRange(preset.key)}
                    aria-pressed={activeRange === preset.key}
                    className={cn(
                      "flex h-7 items-center justify-between rounded-lg px-2 text-[11.5px] transition-colors",
                      activeRange === preset.key
                        ? "bg-white/[0.09] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    {preset.label}
                    {activeRange === preset.key ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="mt-2.5 border-t border-white/[0.06] pt-2.5">
                <p className="text-[10.5px] text-muted-foreground">
                  Custom range
                </p>
                <div className="mt-1.5 grid gap-2">
                  <label className="space-y-1">
                    <span className="text-[10.5px] text-muted-foreground">
                      From
                    </span>
                    <Input
                      type="date"
                      value={customFrom}
                      max={customTo || undefined}
                      onChange={(event) => setCustomFrom(event.target.value)}
                      className="h-9 text-[12px]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10.5px] text-muted-foreground">
                      To
                    </span>
                    <Input
                      type="date"
                      value={customTo}
                      min={customFrom || undefined}
                      onChange={(event) => setCustomTo(event.target.value)}
                      className="h-9 text-[12px]"
                    />
                  </label>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo || pending}
                  className="mt-2 h-8 w-full rounded-lg text-[11.5px]"
                >
                  <Check className="size-3.5" aria-hidden />
                  Apply range
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {filtersActive ? (
            <button
              type="button"
              onClick={() => startTransition(() => router.push("/dashboard/orders"))}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.07] px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3" aria-hidden />
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <SlidersHorizontal
          className="mr-0.5 size-3.5 text-muted-foreground"
          aria-hidden
        />
        {ORDER_STATUS_FILTERS.map((filter) => {
          const active = status === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => push({ status: filter.value })}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-white/[0.16] bg-white/[0.09] text-foreground"
                  : "border-white/[0.07] text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          );
        })}
        <span className="ml-auto text-[10.5px] text-muted-foreground">
          {total} order{total === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
