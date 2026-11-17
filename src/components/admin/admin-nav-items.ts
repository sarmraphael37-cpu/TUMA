import {
  CreditCard,
  Download,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Package,
  ReceiptText,
  ScrollText,
  Settings,
  Sparkles,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    description: "Platform health and growth",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/merchants",
    label: "Merchants",
    description: "Businesses and moderation",
    icon: Store,
  },
  {
    href: "/admin/users",
    label: "Users & roles",
    description: "Profiles and admin access",
    icon: Users,
  },
  {
    href: "/admin/products",
    label: "Products",
    description: "Catalogue across the platform",
    icon: Package,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "Every order placed",
    icon: ReceiptText,
  },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    description: "Plans and billing state",
    icon: CreditCard,
  },
  {
    href: "/admin/payments",
    label: "Payments",
    description: "Revenue and verification",
    icon: Wallet,
  },
  {
    href: "/admin/ai",
    label: "AI usage",
    description: "Generations and tokens",
    icon: Sparkles,
  },
  {
    href: "/admin/announcements",
    label: "Announcements",
    description: "Platform-wide messages",
    icon: Megaphone,
  },
  {
    href: "/admin/support",
    label: "Support",
    description: "Merchant tickets",
    icon: LifeBuoy,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Configuration and prices",
    icon: Settings,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    description: "Data exports",
    icon: Download,
  },
  {
    href: "/admin/audit",
    label: "Audit log",
    description: "Sensitive actions",
    icon: ScrollText,
  },
];
