import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck, Sparkles } from "lucide-react";

import { Logo } from "@/components/layout/logo";

const promises = [
  "Orders, stock, invoices and cash flow in one place",
  "AI insights that explain what changed and what to do",
  "Row-level security — your ledger is yours alone",
];

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-navy-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_70%_65%_at_40%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-24 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(46,124,255,0.22),transparent_65%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(56,224,255,0.12),transparent_65%)] blur-3xl"
      />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl lg:grid-cols-[1.02fr_1fr]">
        <aside className="hidden flex-col justify-between border-r border-white/[0.06] p-10 lg:flex xl:p-12">
          <Logo showTagline />

          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/20 bg-cyan-glow/[0.07] px-3 py-1.5 text-[11px] font-medium tracking-wide text-cyan-glow uppercase">
              <Sparkles className="size-3" aria-hidden />
              Your business, in one calm workspace
            </span>
            <h2 className="mt-6 font-heading text-[2.1rem] leading-[1.1] font-semibold tracking-[-0.04em] text-balance">
              Less chasing spreadsheets. More running the business.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              TUMA brings the numbers you check every day into a single,
              intelligent workspace built for how African businesses actually
              trade.
            </p>

            <ul className="mt-7 space-y-3.5">
              {promises.map((promise) => (
                <li key={promise} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-electric-500 to-cyan-glow text-navy-950">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-[13px] leading-snug text-foreground/85">
                    {promise}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium text-mint-glow">
              <ShieldCheck className="size-4" aria-hidden />
              Security by default
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              Sessions are validated on the server and every database row is
              protected by Supabase Row Level Security. Your service key never
              reaches the browser.
            </p>
          </div>
        </aside>

        <main className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Logo />
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Home
              </Link>
            </div>

            <h1 className="font-heading text-[1.9rem] leading-[1.1] font-semibold tracking-[-0.04em] text-balance sm:text-[2.15rem]">
              {title}
            </h1>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>

            <div className="mt-7">{children}</div>

            {footer ? (
              <div className="mt-6 text-center text-[12.5px] text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
