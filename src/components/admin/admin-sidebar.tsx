"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { adminNavItems } from "@/components/admin/admin-nav-items";
import { cn } from "cn";

export function AdminSidebar({
  collapsed = false,
  onNavigate,
  role,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-electric-500 to-cyan-glow text-navy-950">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="font-heading text-[13px] font-semibold tracking-tight">
              TUMA Admin
            </p>
            <p className="text-[10px] text-muted-foreground">{role}</p>
          </div>
        ) : null}
      </div>

      <nav aria-label="Administration" className="flex-1 space-y-1 px-2 pb-4">
        {adminNavItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] font-medium transition-colors",
                active
                  ? "bg-white/[0.09] text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
