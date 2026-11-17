"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  Sparkles,
  Store,
} from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export function UserMenu({
  name,
  email,
  plan,
  businessName,
}: {
  name: string;
  email: string;
  plan: string;
  businessName: string;
}) {
  const [pending, startTransition] = useTransition();

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] py-1.5 pr-2 pl-1.5 text-left transition-colors hover:border-white/[0.13] hover:bg-white/[0.045] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-electric-500 to-cyan-glow text-[10px] font-semibold text-navy-950">
            {initials || "T"}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-[140px] truncate text-[12px] font-medium leading-tight">
              {name}
            </span>
            <span className="block max-w-[140px] truncate text-[10px] leading-tight text-muted-foreground">
              {plan}
            </span>
          </span>
          <ChevronDown
            className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 border border-white/[0.08] bg-navy-850 p-1.5"
      >
        <DropdownMenuLabel className="px-2 py-1.5">
          <span className="block truncate text-[12px] font-medium text-foreground">
            {name}
          </span>
          <span className="mt-0.5 block truncate text-[10.5px] font-normal text-muted-foreground">
            {email}
          </span>
          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Store className="size-3" aria-hidden />
            {businessName}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/[0.07]" />

        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="gap-2 text-[12px]">
            <LayoutDashboard className="size-3.5" aria-hidden />
            Overview
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/products" className="gap-2 text-[12px]">
            <Package className="size-3.5" aria-hidden />
            Products
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/#pricing" className="gap-2 text-[12px]">
            <Sparkles className="size-3.5" aria-hidden />
            Plans & pricing
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.07]" />

        {/*
          The menu unmounts itself on pointer-up, so the sign-out runs as a
          direct server action call instead of a form submit.
        */}
        <DropdownMenuItem
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => {
              void signOutAction();
            });
          }}
          className={cn(
            "gap-2 text-[12px] text-rose-300 focus:bg-rose-400/10 focus:text-rose-200",
            pending && "opacity-60",
          )}
        >
          <LogOut className="size-3.5" aria-hidden />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
