"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { useSession } from "@supabase/ssr";
import { hasCapability, capabilitiesFor, PlatformRole } from "@/lib/admin/permissions";

import { SuperAdminSidebar } from "./sidebar";
import { MetricCard } from "@/components/dashboard/cards/metric-card";

type AdminFrameProps = {
  children: React.ReactNode;
  pageTitle?: string;
};

export function SuperAdminFrame({ children, pageTitle }: AdminFrameProps) {
  const { session } = useSession();
  const supa = useSupabaseServerClient();

  // Determine user role and capabilities
  const role = session?.user?.user_metadata?.role as PlatformRole | undefined;
  const caps = role ? capabilitiesFor(role) : [];

  // Check if super admin
  const isSuperAdmin = role === "super_admin";

  // Compute visible capabilities
  const visibleCaps = isSuperAdmin
    ? ["platform.read", "merchants.read", "merchants.suspend", "users.read", 
       "users.manageAdmins", "products.read", "orders.read", "subscriptions.read",
       "subscriptions.manage", "payments.read", "ai.read", "announcements.read",
       "announcements.manage", "support.read", "support.reply", "support.delete",
       "settings.read", "settings.manage", "reports.export", "audit.read"]
    : caps;

  return (
    <div className="relative min-h-screen">
      {/* Sidebar */}
      <SuperAdminSidebar />

      <main className="ml-64 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/[0.05] bg-navy-950/80 backdrop-blur-sm py-3 px-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="size-4 opacity-100 text-cyan-glow" aria-hidden />
              <span className="font-heading font-medium text-lg">TUMA Super Admin</span>
            </div>

            <div className="flex items-center gap-4">
              {/* User menu */}
              {session && session.user && (
                <div className="relative">
                  <a
                    href="#"
                    className="relative flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    aria-haspopup="menu"
                    aria-label="User menu"
                  >
                    <span className="avatar avatar-sm">
                      <span
                        className="avatar-item"
                        style={{ background: "radial-gradient(120% 120% at 20% 0%, rgba(59, 130, 246, 0.18), transparent 55%)" }}
                      />
                      <span className="avatar-label text-[9px]" style={{ color: "white" }}>
                        {session.user.email?.split("@")[0]?.charAt(0) ?? "S"}
                      </span>
                    </span>
                  </a>

                  <ul
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 mt-2 w-44 rounded-lg bg-navy-900 p-3 shadow-xl border border-white/[0.05] mt-0 z-50"
                    style={{ display: "block" }}
                  >
                    <li>
                      <Link
                        href="/super-admin/settings"
                        className="block text-[10px] text-white hover:text-cyan-glow transition-colors pb-1"
                      >
                        Settings
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/"
                        className="block text-[10px] text-white hover:text-cyan-glow transition-colors pb-1"
                      >
                        Storefront
                      </Link>
                    </li>
                    <hr className="my-2 border-white/[0.05]" />
                    <li>
                      <button
                        onClick =()=> session?.supabase?.auth?.signOut?.()
                        className="block text-[10px] text-white hover:text-red-500 transition-colors pb-1"
                      >
                        Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              )}

              {/* Capability indicator for non-super-admins */}
              {!isSuperAdmin && (
                <span className="text-[9px] bg-indigo-glow text-indigo-600 rounded px-2 uppercase">
                  {role?.toUpperCase()} role
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-8 overflow-auto">
          {pageTitle && (
            <h1 className="font-heading text-[1.5rem] leading-tight font-semibold tracking-[-0.035em] mb-6">
              {pageTitle}
            </h1>
          )}

          {children}
        </main>
      </main>
    </div>
  );
}