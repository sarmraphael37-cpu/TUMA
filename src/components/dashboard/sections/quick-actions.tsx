import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Package,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type QuickAction = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "brand" | "info" | "success" | "warning";
};

const toneClasses: Record<QuickAction["tone"], string> = {
  brand: "bg-electric-500/12 text-electric-300 ring-electric-400/20",
  info: "bg-cyan-glow/12 text-cyan-glow ring-cyan-glow/20",
  success: "bg-mint-glow/12 text-mint-glow ring-mint-glow/20",
  warning: "bg-amber-glow/12 text-amber-glow ring-amber-glow/20",
};

export function QuickActions({
  lowStockCount,
  pendingOrders,
}: {
  lowStockCount: number;
  pendingOrders: number;
}) {
  const actions: QuickAction[] = [
    {
      href: "/dashboard/products#add-product",
      title: "Add a product",
      description: "Put a new item in your catalogue.",
      icon: Package,
      tone: "brand",
    },
    {
      href: "/dashboard#low-stock",
      title: "Review stock alerts",
      description:
        lowStockCount > 0
          ? `${lowStockCount} product${lowStockCount === 1 ? "" : "s"} at the alert level.`
          : "No product is below its alert level.",
      icon: Boxes,
      tone: "warning",
    },
    {
      href: "/dashboard#recent-orders",
      title: "See recent orders",
      description:
        pendingOrders > 0
          ? `${pendingOrders} order${pendingOrders === 1 ? "" : "s"} still in progress.`
          : "Every order in this period is settled.",
      icon: ShoppingBag,
      tone: "info",
    },
    {
      href: "/dashboard/ai",
      title: "Open TUMA AI",
      description: "Draft product or marketing copy from your real data.",
      icon: Sparkles,
      tone: "success",
    },
  ];

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <li key={action.href + action.title}>
            <Link
              href={action.href}
              className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ${toneClasses[action.tone]}`}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium">
                  {action.title}
                </span>
                <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted-foreground">
                  {action.description}
                </span>
              </span>
              <ArrowRight
                className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
