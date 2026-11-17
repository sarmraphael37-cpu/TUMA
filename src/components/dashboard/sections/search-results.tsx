import Link from "next/link";
import { PackageSearch, Search } from "lucide-react";

import type { WorkspaceSearchResults } from "@/lib/db/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";

export function SearchResults({
  results,
  currency,
}: {
  results: WorkspaceSearchResults;
  currency: string;
}) {
  const total =
    results.products.length + results.orders.length + results.customers.length;

  return (
    <section
      id="search-results"
      className="rounded-2xl border border-electric-400/20 bg-gradient-to-br from-electric-600/10 to-transparent p-4"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-electric-500/15 text-electric-200">
          <Search className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-[13.5px] font-medium">
            Results for “{results.query}”
          </h2>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">
            {total} match{total === 1 ? "" : "es"} across your products, orders
            and customers.
          </p>
        </div>
      </div>

      {total === 0 ? (
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-6 text-center text-[11.5px] text-muted-foreground">
          Nothing matched “{results.query}”. Try a product name, a SKU, an order
          number or a customer.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {results.products.length > 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
              Products
            </p>
            <ul className="mt-2 space-y-1.5">
              {results.products.map((product) => (
                <li key={product.id}>
                  <Link
                    href="/dashboard/products"
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11.5px] font-medium">
                        {product.name}
                      </span>
                      <span className="block truncate font-mono text-[9.5px] text-muted-foreground">
                        {product.sku}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-foreground/85">
                      {formatCurrency(Number(product.price ?? 0), currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {results.orders.length > 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
              Orders
            </p>
            <ul className="mt-2 space-y-1.5">
              {results.orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href="/dashboard#recent-orders"
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[10.5px]">
                        {order.order_number}
                      </span>
                      <span className="block truncate text-[9.5px] text-muted-foreground">
                        {order.customers?.name ?? "Walk-in customer"} ·{" "}
                        {formatDate(order.placed_at)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-foreground/85">
                      {formatCurrency(Number(order.total ?? 0), currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {results.customers.length > 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
              Customers
            </p>
            <ul className="mt-2 space-y-1.5">
              {results.customers.map((customer) => (
                <li
                  key={customer.id}
                  className="rounded-lg px-2 py-1.5"
                >
                  <span className="block truncate text-[11.5px] font-medium">
                    {customer.name}
                  </span>
                  <span className="block truncate text-[9.5px] text-muted-foreground">
                    {customer.email ?? customer.phone ?? "No contact details"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {results.products.length === 0 &&
      results.orders.length === 0 &&
      results.customers.length === 0 ? null : (
        <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <PackageSearch className="size-3.5" aria-hidden />
          Results come straight from your Supabase records.
        </p>
      )}
    </section>
  );
}
