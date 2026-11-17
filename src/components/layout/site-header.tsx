"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, MonitorPlay } from "lucide-react";

import { cn } from "cn";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { primaryNavLinks } from "@/content/marketing";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeHref, setActiveHref] = useState<string>("");

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;

      setScrolled(y > 10);

      if (y < 80) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      if (Math.abs(delta) > 8) {
        lastY = y;
      }
    };

    const schedule = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    const sections = primaryNavLinks
      .map((link) => document.querySelector<HTMLElement>(link.href))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHref(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <header
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled
          ? "border-white/[0.06] bg-navy-950/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
        hidden && "-translate-y-full",
      )}
    >
      <Container className="flex h-[68px] items-center justify-between gap-4">
        <Logo />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {primaryNavLinks.map((link) => {
            const isActive = activeHref === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isActive && "text-foreground",
                )}
              >
                {link.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-cyan-glow to-transparent transition-transform duration-300",
                    isActive && "scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            asChild
            variant="ghost"
            className="h-10 rounded-full px-4 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <Link href="#demo">
              <MonitorPlay className="size-4" aria-hidden />
              Explore demo
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-10 rounded-full px-4 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            className="group h-10 rounded-full px-5 text-[13px] shadow-[0_10px_34px_-12px_rgba(37,99,235,0.9)]"
          >
            <Link href="/register">
              Get started
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[88vw] max-w-sm border-white/[0.08] bg-navy-950/95 backdrop-blur-2xl"
          >
            <SheetHeader className="border-b border-white/[0.06] pb-5">
              <SheetTitle className="sr-only">TUMA navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Explore TUMA&apos;s features, how it works, pricing and FAQs.
              </SheetDescription>
              <Logo />
            </SheetHeader>

            <nav
              aria-label="Mobile navigation"
              className="flex flex-col gap-1 px-4"
            >
              {primaryNavLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-white/[0.04] hover:text-foreground"
                  >
                    {link.label}
                    <ArrowUpRight
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </SheetClose>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2 border-t border-white/[0.06] p-4">
              <SheetClose asChild>
                <Link
                  href="#demo"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 w-full rounded-xl text-sm",
                  )}
                >
                  <MonitorPlay className="size-4" aria-hidden />
                  Explore demo
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 w-full rounded-xl text-sm",
                  )}
                >
                  Sign in
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants(),
                    "h-11 w-full rounded-xl text-sm",
                  )}
                >
                  Get started
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </Container>

      <ScrollProgress />
    </header>
  );
}
