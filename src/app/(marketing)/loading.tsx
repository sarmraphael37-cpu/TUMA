import { Container } from "@/components/layout/container";

export default function Loading() {
  return (
    <div className="pt-28 pb-20 sm:pt-32" aria-busy="true" aria-live="polite">
      <Container>
        <div className="mx-auto flex max-w-2xl animate-pulse flex-col items-center gap-5">
          <span className="sr-only">Loading TUMA…</span>
          <div className="h-6 w-52 rounded-full bg-white/[0.06]" />
          <div className="h-12 w-full max-w-xl rounded-xl bg-white/[0.05]" />
          <div className="h-12 w-4/5 max-w-md rounded-xl bg-white/[0.04]" />
          <div className="h-4 w-3/5 max-w-sm rounded-full bg-white/[0.04]" />
          <div className="mt-3 flex gap-3">
            <div className="h-11 w-36 rounded-full bg-white/[0.07]" />
            <div className="h-11 w-36 rounded-full bg-white/[0.04]" />
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl animate-pulse overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015]">
          <div className="h-10 border-b border-white/[0.05] bg-white/[0.02]" />
          <div className="grid grid-cols-[170px_1fr]">
            <div className="hidden border-r border-white/[0.05] p-4 sm:block">
              <div className="mb-6 h-6 w-24 rounded-md bg-white/[0.06]" />
              <div className="space-y-2.5">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-5 rounded-md bg-white/[0.04]"
                    style={{ width: `${88 - index * 5}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded-lg bg-white/[0.04]"
                  />
                ))}
              </div>
              <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.55fr_1fr]">
                <div className="h-40 rounded-lg bg-white/[0.035]" />
                <div className="h-40 rounded-lg bg-white/[0.03]" />
              </div>
              <div className="mt-2.5 h-28 rounded-lg bg-white/[0.03]" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
