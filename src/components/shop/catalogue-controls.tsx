"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";

import { cn } from "cn";

/**
 * Search and category filters for the storefront catalogue.
 *
 * Both filters live in the URL so a category can be shared and the browser
 * back button works.
 */
export function CatalogueControls({
  slug,
  categories,
  total,
}: {
  slug: string;
  categories: string[];
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const currentQuery = searchParams.get("q") ?? "";
  const [syncedQuery, setSyncedQuery] = useState(currentQuery);

  // Follow the URL when the filter changes (navigation, back button).
  if (currentQuery !== syncedQuery) {
    setSyncedQuery(currentQuery);
    setQuery(currentQuery);
  }

  useEffect(() => {
    // Keep the address bar in sync while typing.
    const handle = window.setTimeout(() => {
      if (query === currentQuery) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }

      startTransition(() => {
        router.replace(`/shop/${slug}?${params.toString()}`);
      });
    }, 350);

    return () => window.clearTimeout(handle);
  }, [query, currentQuery, router, searchParams, slug]);

  const category = searchParams.get("category") ?? "all";

  function push(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      router.push(`/shop/${slug}?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex h-10 flex-1 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-white/[0.16]">
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
            placeholder="Search the catalogue…"
            aria-label="Search the catalogue"
            className="h-full w-full bg-transparent pr-9 pl-9 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        <p className="text-[11.5px] text-muted-foreground sm:whitespace-nowrap">
          {total} product{total === 1 ? "" : "s"}
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => push({ category: null })}
            aria-pressed={category === "all"}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              category === "all"
                ? "border-white/[0.16] bg-white/[0.09] text-foreground"
                : "border-white/[0.07] text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>

          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => push({ category: item })}
              aria-pressed={category === item}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                category === item
                  ? "border-white/[0.16] bg-white/[0.09] text-foreground"
                  : "border-white/[0.07] text-muted-foreground hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
