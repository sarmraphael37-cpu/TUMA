"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { useCurrentSearchQuery } from "@/components/dashboard/shell/use-current-search-query";
import { cn } from "cn";

/**
 * Workspace search. Submitting keeps the active date filters and adds the
 * query, so the dashboard can render real matches from Supabase.
 */
export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const currentQuery = useCurrentSearchQuery();

  const [query, setQuery] = useState(currentQuery);
  const [syncedQuery, setSyncedQuery] = useState(currentQuery);
  const [pending, startTransition] = useTransition();

  // Keep the field in sync when the URL changes (navigation, back button).
  if (currentQuery !== syncedQuery) {
    setSyncedQuery(currentQuery);
    setQuery(currentQuery);
  }

  function navigate(nextQuery: string) {
    const params = new URLSearchParams(window.location.search);

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    const search = params.toString();

    startTransition(() => {
      router.push(search ? `/dashboard?${search}` : "/dashboard");
    });
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        navigate(query.trim());
      }}
      className={cn(
        "relative flex h-9 w-full items-center rounded-xl border border-white/[0.07] bg-white/[0.025] transition-colors focus-within:border-white/[0.14] focus-within:bg-white/[0.05]",
        className,
      )}
    >
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
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products, orders, customers…"
        aria-label="Search your workspace"
        className="h-full w-full bg-transparent pr-9 pl-9 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden"
      />

      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            navigate("");
          }}
          aria-label="Clear search"
          className="absolute right-2 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </form>
  );
}
