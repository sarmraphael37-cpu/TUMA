"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { LayoutGrid, List, Loader2, Search, X } from "lucide-react";

import {
  CATALOGUE_SORTS,
  type CatalogueSort,
  type CatalogueStatus,
} from "@/lib/db/catalogue";
import { cn } from "cn";

export type CatalogueView = "grid" | "table";

const STATUS_FILTERS: { value: CatalogueStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Available" },
  { value: "archived", label: "Archived" },
  { value: "low", label: "Low stock" },
  { value: "deleted", label: "Deleted" },
];

export function CatalogueToolbar({
  categories,
  total,
  view,
  allowDeleted = true,
}: {
  categories: string[];
  total: number;
  view: CatalogueView;
  allowDeleted?: boolean;
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
      router.push(`/dashboard/products?${params.toString()}`);
    });
  }

  const status = (searchParams.get("status") ?? "all") as CatalogueStatus;
  const category = searchParams.get("category") ?? "all";
  const sort = (searchParams.get("sort") ?? "recent") as CatalogueSort;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
            placeholder="Search products, SKU or description…"
            aria-label="Search the catalogue"
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

        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(event) => push({ category: event.target.value })}
            aria-label="Filter by category"
            className="h-9 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => push({ sort: event.target.value })}
            aria-label="Sort products"
            className="h-9 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATALOGUE_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
            {(
              [
                { value: "grid", icon: LayoutGrid, label: "Card view" },
                { value: "table", icon: List, label: "Table view" },
              ] as const
            ).map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => push({ view: option.value })}
                  aria-pressed={view === option.value}
                  aria-label={option.label}
                  className={cn(
                    "grid size-7 place-items-center rounded-lg transition-colors",
                    view === option.value
                      ? "bg-white/[0.09] text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.filter(
          (filter) => allowDeleted || filter.value !== "deleted",
        ).map((filter) => {
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
          {total} product{total === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}


