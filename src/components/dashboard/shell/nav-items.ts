import {
  Headphones,
  LayoutDashboard,
  Package,
  ReceiptText,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Revenue, orders and stock",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    description: "Orders, payments and delivery",
    icon: ReceiptText,
  },
  {
    href: "/dashboard/products",
    label: "Products",
    description: "Catalogue and stock levels",
    icon: Package,
  },
  {
    href: "/dashboard/ai",
    label: "TUMA AI",
    description: "Copywriting and insights",
    icon: Sparkles,
  },
  {
    href: "/dashboard/storefront",
    label: "Storefront",
    description: "Your public shop",
    icon: Store,
  },
  {
    href: "/dashboard/support",
    label: "Support",
    description: "Help from the TUMA team",
    icon: Headphones,
  },
];
