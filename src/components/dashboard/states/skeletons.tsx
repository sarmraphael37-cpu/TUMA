import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-7 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-7 w-24" />
      <Skeleton className="mt-3 h-3 w-16" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full min-h-[200px] flex-col gap-3", className)}>
      <div className="flex flex-1 items-end gap-2">
        {[45, 70, 35, 85, 55, 75, 40, 62, 30, 58].map((height, index) => (
          <Skeleton
            key={index}
            className="flex-1 rounded-t-md"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border border-white/[0.05] px-3 py-2.5"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="relative min-h-dvh bg-navy-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-white/[0.06] bg-navy-950/70 p-4 lg:block">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="mt-5 h-14 w-full rounded-xl" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-40 h-14 border-b border-white/[0.06] bg-navy-950/85 px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl lg:hidden" />
            <Skeleton className="hidden h-3 w-40 lg:block" />
            <Skeleton className="ml-auto h-9 w-full max-w-xs rounded-xl sm:max-w-sm" />
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1320px]">
            <DashboardSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 h-[240px]">
            <ChartSkeleton />
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 h-[240px]">
            <ChartSkeleton />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <Skeleton className="h-4 w-36" />
          <div className="mt-4">
            <TableSkeleton rows={5} />
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <Skeleton className="h-4 w-36" />
          <div className="mt-4">
            <TableSkeleton rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
