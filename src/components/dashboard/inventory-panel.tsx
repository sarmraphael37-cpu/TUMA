import { AlertTriangle, ArrowDownRight, Boxes, Truck } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const products = [
  {
    sku: "FAB-ANK-12",
    name: "Ankara fabric · 12 yards",
    stock: 42,
    reorder: 30,
    status: "Healthy",
    tone: "success" as const,
  },
  {
    sku: "RCE-25KG",
    name: "Rice 25kg bag",
    stock: 18,
    reorder: 40,
    status: "Low stock",
    tone: "warning" as const,
  },
  {
    sku: "OIL-5L",
    name: "Cooking oil 5L",
    stock: 64,
    reorder: 50,
    status: "Healthy",
    tone: "success" as const,
  },
  {
    sku: "POS-ROLL",
    name: "POS thermal rolls",
    stock: 9,
    reorder: 25,
    status: "Reorder now",
    tone: "danger" as const,
  },
  {
    sku: "VIT-C200",
    name: "Vitamin C · 200 units",
    stock: 86,
    reorder: 60,
    status: "Healthy",
    tone: "success" as const,
  },
];

/** Static inventory snapshot used inside the product demo. */
export function InventoryPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[9px] text-muted-foreground">Stock control</p>
          <h3 className="font-heading text-sm font-semibold tracking-tight sm:text-[15px]">
            Inventory
          </h3>
        </div>
        <StatusBadge tone="warning">
          <AlertTriangle className="mr-1 size-2.5" aria-hidden />7 items need action
        </StatusBadge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Inventory value", value: "12.4M", detail: "XAF at cost" },
          { label: "Products", value: "248", detail: "across 3 locations" },
          { label: "Turnover", value: "6.8×", detail: "annualised" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
          >
            <p className="truncate text-[8px] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-0.5 font-heading text-[11px] font-semibold tracking-tight sm:text-xs">
              {item.value}
            </p>
            <p className="mt-0.5 truncate text-[8px] text-muted-foreground">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-medium">Stock levels</p>
          <span className="inline-flex items-center gap-1 text-[8px] text-muted-foreground">
            <Boxes className="size-2.5" aria-hidden />
            Douala · Buea · Yaoundé
          </span>
        </div>

        <Table className="mt-1.5 text-[9px]">
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              {["Product", "On hand", "Level", "Status"].map((heading) => (
                <TableHead
                  key={heading}
                  className="h-6 px-1 text-[8px] font-medium text-muted-foreground first:px-0 last:px-0"
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const ratio = Math.min(
                Math.round((product.stock / (product.reorder * 1.6)) * 100),
                100,
              );

              return (
                <TableRow
                  key={product.sku}
                  className="border-white/[0.05] hover:bg-transparent"
                >
                  <TableCell className="px-0 py-1.5">
                    <p className="max-w-[120px] truncate text-[8px] font-medium">
                      {product.name}
                    </p>
                    <p className="font-mono text-[8px] text-muted-foreground">
                      {product.sku}
                    </p>
                  </TableCell>
                  <TableCell className="px-1 py-1.5 text-[8px] whitespace-nowrap text-foreground/80">
                    {product.stock} units
                  </TableCell>
                  <TableCell className="w-[72px] px-1 py-1.5">
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={
                          product.tone === "danger"
                            ? "h-full rounded-full bg-rose-400"
                            : product.tone === "warning"
                              ? "h-full rounded-full bg-amber-glow"
                              : "h-full rounded-full bg-gradient-to-r from-electric-500 to-cyan-glow"
                        }
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-0 py-1.5 text-right">
                    <StatusBadge tone={product.tone}>
                      {product.status}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-amber-glow/15 bg-amber-glow/[0.05] p-2.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-amber-glow/10 text-amber-glow">
          <Truck className="size-3" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-medium text-amber-glow">
            Suggested purchase order
          </p>
          <p className="truncate text-[8px] text-muted-foreground">
            Rice 25kg · 60 bags from Ets. Fokou — arrives in 3 days
          </p>
        </div>
        <span className="inline-flex items-center gap-0.5 text-[8px] text-muted-foreground">
          <ArrowDownRight className="size-2.5" aria-hidden />
          8% cheaper
        </span>
      </div>
    </div>
  );
}
