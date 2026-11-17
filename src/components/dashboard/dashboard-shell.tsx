import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  FileText,
  LayoutDashboard,
  Lock,
  Search,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "cn";

import { LogoMark } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Orders", icon: ShoppingBag, count: "38" },
  { label: "Inventory", icon: Boxes, count: "7" },
  { label: "Invoices", icon: FileText },
  { label: "Customers", icon: Users },
  { label: "Payments", icon: Wallet },
  { label: "Analytics", icon: BarChart3 },
] as const;

type DashboardShellProps = {
  children: ReactNode;
  activeItem?: (typeof navItems)[number]["label"];
  className?: string;
};

/**
 * A static, screenshot-quality representation of the TUMA workspace.
 * It is intentionally non-interactive; the demo tabs above it are the real
 * controls on the marketing page.
 */
export function DashboardShell({
  children,
  activeItem = "Overview",
  className,
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.09] bg-navy-900/80 shadow-[0_50px_140px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-400/70" />
          <span className="size-2.5 rounded-full bg-amber-glow/70" />
          <span className="size-2.5 rounded-full bg-mint-glow/70" />
        </div>
        <div className="mx-auto flex w-full max-w-[220px] items-center justify-center gap-1.5 rounded-md border border-white/[0.05] bg-navy-950/60 px-3 py-1 text-[10px] text-muted-foreground">
          <Lock className="size-2.5" aria-hidden />
          app.tuma.africa
        </div>
        <div aria-hidden className="hidden w-14 sm:block" />
      </div>

      <div className="flex min-h-0">
        <aside className="hidden w-[170px] shrink-0 flex-col border-r border-white/[0.06] bg-navy-950/40 p-3 sm:flex">
          <div className="flex items-center gap-2 px-2 pt-1 pb-4">
            <LogoMark className="size-6" />
            <span className="font-heading text-[13px] font-semibold tracking-tight">
              TUMA
            </span>
            <Badge
              variant="outline"
              className="ml-auto h-[16px] border-cyan-glow/20 bg-cyan-glow/5 px-1.5 text-[8px] tracking-wide text-cyan-glow"
            >
              PRO
            </Badge>
          </div>

          <nav aria-label="Workspace preview" className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === activeItem;

              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground",
                    isActive &&
                      "bg-white/[0.05] text-foreground ring-1 ring-white/[0.06]",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5",
                      isActive ? "text-cyan-glow" : "text-muted-foreground/70",
                    )}
                    aria-hidden
                  />
                  <span className="font-medium">{item.label}</span>
                  {"count" in item && item.count ? (
                    <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[8px] text-muted-foreground">
                      {item.count}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 pt-5">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
              <div className="flex items-center justify-between text-[9px]">
                <span className="font-medium">Growth plan</span>
                <span className="text-muted-foreground">14d</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-electric-500 to-cyan-glow" />
              </div>
              <p className="mt-1.5 text-[8px] text-muted-foreground">
                Trial ends 26 Nov
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <div className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-electric-400 to-cyan-glow text-[9px] font-semibold text-navy-950">
                SM
              </div>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-medium">Sandrine M.</p>
                <p className="truncate text-[8px] text-muted-foreground">
                  Owner
                </p>
              </div>
              <Settings
                className="ml-auto size-3 text-muted-foreground"
                aria-hidden
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-2 sm:hidden">
              <LogoMark className="size-5" />
              <span className="font-heading text-[12px] font-semibold">
                TUMA
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] text-muted-foreground">Workspace</p>
              <p className="font-heading text-[11px] font-medium">
                {activeItem}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="hidden h-7 items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 text-[9px] text-muted-foreground md:flex">
                <Search className="size-3" aria-hidden />
                Search anything
              </div>
              <div className="relative grid size-7 place-items-center rounded-md border border-white/[0.06] bg-white/[0.03]">
                <Bell
                  className="size-3.5 text-muted-foreground"
                  aria-hidden
                />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-cyan-glow" />
              </div>
              <div className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-electric-400 to-cyan-glow text-[9px] font-semibold text-navy-950">
                SM
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
