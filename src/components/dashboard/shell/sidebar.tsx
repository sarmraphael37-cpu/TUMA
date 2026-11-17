"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Store,
} from "lucide-react";

import { DashboardNav } from "@/components/dashboard/shell/dashboard-nav";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Logo } from "@/components/layout/logo";
import { cn } from "cn";

export type SidebarBusiness = {
  name: string;
  slug: string;
  category: string;
  currency: string;
};

export type SidebarPlan = {
  plan: string;
  status: string;
  trialEndsAt: string | null;
};

export function DashboardSidebar({
  business,
  plan,
  collapsed = false,
  variant = "desktop",
  onToggle,
  onNavigate,
}: {
  business: SidebarBusiness;
  plan: SidebarPlan | null;
  collapsed?: boolean;
  variant?: "desktop" | "mobile";
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const isDesktop = variant === "desktop";

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-4",
          collapsed ? "justify-center px-0" : "justify-between",
        )}
      >
        {collapsed ? (
          <Logo href="/dashboard" className="px-1" markClassName="size-8" />
        ) : (
          <Logo href="/dashboard" />
        )}

        {isDesktop ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className={cn(
              "hidden size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:grid",
              collapsed ? "absolute right-2 top-4 z-10" : "",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <div className={cn("px-3", collapsed ? "px-2" : "")}>
        <div
          className={cn(
            "rounded-xl border border-white/[0.07] bg-white/[0.025]",
            collapsed ? "grid place-items-center p-2" : "p-3",
          )}
        >
          {collapsed ? (
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-electric-500/25 to-cyan-glow/15 text-[11px] font-semibold text-electric-200">
              {business.name.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-electric-500/25 to-cyan-glow/15 text-[11px] font-semibold text-electric-200">
                  {business.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium leading-tight">
                    {business.name}
                  </p>
                  <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                    {business.category}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  @{business.slug}
                </span>
                <StatusBadge
                  tone={plan?.status === "active" ? "success" : "brand"}
                >
                  {plan ? plan.status : "Setup"}
                </StatusBadge>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto px-3">
        {!collapsed ? (
          <p className="px-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">
            Workspace
          </p>
        ) : null}

        <div className={cn("mt-2", collapsed && "mt-0")}>
          <DashboardNav collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      </div>

      <div className={cn("space-y-2 px-3 pb-4", collapsed && "px-2")}>
        {collapsed ? null : (
          <div className="rounded-xl border border-electric-400/20 bg-gradient-to-br from-electric-600/15 to-cyan-glow/[0.04] p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium">
              <Store className="size-3.5 text-cyan-glow" aria-hidden />
              {plan?.plan ?? "Starter"} plan
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
              {plan?.trialEndsAt
                ? "Trial ends soon. Upgrade to keep every insight."
                : "Manage your plan, seats and billing details."}
            </p>
            <Link
              href="/#pricing"
              className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-cyan-glow transition-colors hover:text-electric-300"
            >
              View plans
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>
        )}

        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-[11.5px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Marketing website" : undefined}
        >
          {collapsed ? (
            <Sparkles className="size-4" aria-hidden />
          ) : (
            <>
              Marketing website
              <ArrowUpRight className="size-3" aria-hidden />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
