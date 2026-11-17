"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarRange, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DASHBOARD_RANGES } from "@/lib/db/ranges";
import { cn } from "cn";

/**
 * Date filter for the dashboard. It writes to the URL so the server can
 * re-query Supabase for exactly the selected window.
 */
export function DateRangeFilter({
  range,
  from,
  to,
  basePath = "/dashboard",
}: {
  range: string;
  from?: string;
  to?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");

  function apply(next: URLSearchParams) {
    startTransition(() => {
      router.push(`${basePath}?${next.toString()}`);
    });
  }

  function selectPreset(key: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("range", key);
    params.delete("from");
    params.delete("to");
    apply(params);
  }

  function applyCustom() {
    if (!customFrom || !customTo) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.delete("range");
    params.set("from", customFrom);
    params.set("to", customTo);
    apply(params);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Date range"
        className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1"
      >
        {DASHBOARD_RANGES.map((preset) => {
          const active = range === preset.key;

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => selectPreset(preset.key)}
              aria-pressed={active}
              disabled={pending}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-60",
                active
                  ? "bg-white/[0.09] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 rounded-xl border-white/[0.07] bg-white/[0.025] px-3 text-[11.5px] font-medium text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
              range === "custom" && "border-white/[0.14] text-foreground",
            )}
          >
            <CalendarRange className="size-3.5" aria-hidden />
            {range === "custom" ? "Custom range" : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-64 border border-white/[0.08] bg-navy-850 p-3"
        >
          <p className="text-[11px] font-medium">Custom date range</p>
          <div className="mt-2.5 grid gap-2">
            <label className="space-y-1">
              <span className="text-[10.5px] text-muted-foreground">From</span>
              <Input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="h-9 text-[12px]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10.5px] text-muted-foreground">To</span>
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
            className="mt-3 h-8 w-full rounded-lg text-[11.5px]"
          >
            <Check className="size-3.5" aria-hidden />
            Apply range
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
