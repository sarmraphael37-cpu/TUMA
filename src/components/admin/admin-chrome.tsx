"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/actions";
import { cn } from "cn";

export function AdminChrome({
  user,
  role,
}: {
  user: { name: string; email: string };
  role: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--tuma-admin-sidebar-width",
      collapsed ? "76px" : "248px",
    );
  }, [collapsed]);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/[0.06] bg-navy-950/70 backdrop-blur-xl transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-[248px]",
        )}
      >
        <AdminSidebar
          collapsed={collapsed}
          onNavigate={() => {}}
          role={role}
        />
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute right-2 top-3 grid size-7 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="size-3.5" aria-hidden />
        </button>
      </aside>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="w-[17rem] border-white/[0.08] bg-navy-950/95 p-0 backdrop-blur-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Administration navigation</SheetTitle>
            <SheetDescription>Move between admin modules.</SheetDescription>
          </SheetHeader>
          <AdminSidebar
            role={role}
            onNavigate={() => setNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-navy-950/85 backdrop-blur-xl lg:left-[var(--tuma-admin-sidebar-width)]">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" aria-hidden />
            </Button>
            <div className="hidden sm:block">
              <p className="text-[12px] font-medium text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-white/[0.08] bg-white/[0.03] text-[11.5px]"
            onClick={() => {
              void signOutAction();
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
    </>
  );
}
