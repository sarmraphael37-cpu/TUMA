"use client";

import Link from "next/link";
import { useState } from "react";
import { Hashtag, Users, Building2, Mail, Folder, BarChart2,
  Layout, CreditCard, Zap, Music, Shield, FolderSearch,
  UsersOff, FileText, Home, LogOut,
} from "lucide-react";

import { useSupabaseServerClient } from "@/lib/supabase/server";
import { useSession } from "@supabase/ssr";
import { hasCapability, capabilitiesFor, PlatformRole } from "@/lib/admin/permissions";

interface NavItem {
  title: string;
  href: string;
  icon: typeof Hashtag;
  description?: string;
  badge?: string;
  divider?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/super-admin",
    icon: Home,
    description: "Platform-wide analytics and health",
  },
  {
    title: "Merchants",
    href: "/super-admin/merchants",
    icon: Building2,
    description: "View and manage all platform merchants",
    badge: null,
  },
  {
    title: "Users",
    href: "/super-admin/users",
    icon: Users,
    description: "User and role management",
    badge: null,
  },
  {
    title: "Products",
    href: "/super-admin/products",
    icon: Folder,
    description: "Product and inventory monitoring",
    badge: null,
  },
  {
    title: "Orders",
    href: "/super-admin/orders",
    icon: FolderSearch,
    description: "Order tracking and fulfillment",
    badge: null,
  },
  {
    title: "Subscriptions",
    href: "/super-admin/subscriptions",
    icon: Music,
    description: "Subscription and pricing management",
    badge: null,
  },
  {
    title: "Payments",
    href: "/super-admin/payments",
    icon: CreditCard,
    description: "Payment and revenue management",
    badge: null,
  },
  {
    title: "AI Usage",
    href: "/super-admin/ai",
    icon: Zap,
    description: "AI generation monitoring and limits",
    badge: null,
  },
  {
    title: "Announcements",
    href: "/super-admin/announcements",
    icon: Mail,
    description: "Platform-wide notifications",
    badge: null,
  },
  {
    title: "Support",
    href: "/super-admin/support",
    icon: FolderSearch,
    description: "Customer support ticket management",
    badge: null,
  },
  {
    title: "Settings",
    href: "/super-admin/settings",
    icon: Settings,
    description: "Platform configuration",
    badge: null,
  },
  {
    title: "Reports",
    href: "/super-admin/reports",
    icon: FileText,
    description: "Data exports and analytics",
    badge: null,
  },
  {
    title: "Audit Log",
    href: "/super-admin/audit",
    icon: Shield,
    description: "Administrative audit trail",
    badge: null,
  },
  { divider: true },
  {
    title: "Sign Out",
    href: "/",
    icon: LogOut,
    description: "End your super admin session",
  },
];

export function SuperAdminSidebar() {
  const [open, setOpen] = useState(false);
  const { session } = useSession();
  const supa = useSupabaseServerClient();

  // Count items badge if needed
  const capabilities = capabilitiesFor(session?.user?.user_metadata?.role as PlatformRole || "analyst");

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-navy-950 border-r border-white/[0.05] flex-shrink-0 shadow-2xl transform transition-transform duration-300 ease-in-out sm:translate-x-0">
      <div className="h-full flex flex-col">
        {/* Brand header */}
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <Shield className="size-4 opacity-100 text-cyan-glow" aria-hidden />
            <span className="font-heading font-medium text-sm">TUMA Super Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV_ITEMS.map((item, index) => {
            const isLast = index === NAV_ITEMS.length - 1;
            
            if (item.divider) {
              return (
                <div key={index} className="h-px w-full my-4 border-white/[0.05]"></div>
              );
            }

            // Check if user has capability to see this item
            const hasAccess = item.title !== "Sign Out" 
              ? true  // Most items are visible to super admins
              : true;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] data-[state=active]:bg-white/[0.1] data-[state=active]:text-foreground ${open || item.href === "/super-admin" ? "text-foreground" : "text-muted-foreground"}`}
                onClick={() => setOpen(false)}
                aria-current={item.href === "/super-admin" ? "page" : undefined}
                aria-label={item.title}
              >
                <item.icon className="size-4 me-2" aria-hidden />
                <span className="whitespace-nowrap">
                  {item.title}
                  {item.badge && <span className="ml-2 text-[9px] bg-cyan-glow text-white rounded px-1">{item.badge}</span>}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile toggle & footer */}
        <div className="p-2 border-t border-white/[0.05]">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between text-[10px] text-muted-foreground"
            aria-label="Toggle navigation"
          >
            {open ? (
              <LogOut className="size-3.5" aria-hidden />
            ) : (
              <Hashtag className="size-3.5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}