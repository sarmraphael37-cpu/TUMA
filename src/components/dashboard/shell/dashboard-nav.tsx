"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavItems } from "@/components/dashboard/shell/nav-items";
import { cn } from "cn";

export function DashboardNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace" className="space-y-1">
      {dashboardNavItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group flex items-center rounded-xl text-[13px] font-medium transition-colors",
              collapsed
                ? "h-10 justify-center px-0"
                : "gap-3 px-3 py-2.5",
              active
                ? "bg-white/[0.07] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                active ? "text-cyan-glow" : "text-muted-foreground",
              )}
              aria-hidden
            />

            {collapsed ? (
              <span className="sr-only">{item.label}</span>
            ) : (
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-tight">{item.label}</span>
                <span className="mt-0.5 block truncate text-[10.5px] leading-tight font-normal text-muted-foreground/80">
                  {item.description}
                </span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
