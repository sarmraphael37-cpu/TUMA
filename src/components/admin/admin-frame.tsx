import { AdminChrome } from "@/components/admin/admin-chrome";
import { isAdminSchemaAvailable } from "@/lib/admin/auth";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { roleLabels } from "@/lib/admin/permissions";

export async function AdminFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const available = await isAdminSchemaAvailable();

  if (!available) {
    return (
      <div className="min-h-dvh bg-navy-950 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-glow/20 bg-amber-glow/[0.06] p-6">
          <h1 className="font-heading text-[1.25rem] font-semibold">
            Admin schema not installed
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            The platform administration tables are not present in this Supabase
            project yet. Apply the latest migration
            (<code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px]">
              supabase/migrations/20261116090000_tuma_platform_admin.sql
            </code>
            ) and reload this page.
          </p>
        </div>
      </div>
    );
  }

  const admin = await requirePlatformAdmin("/admin");

  return (
    <div className="relative min-h-dvh bg-navy-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[320px] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(46,124,255,0.10),transparent)]"
      />

      <AdminChrome
        user={{ name: admin.fullName, email: admin.email }}
        role={roleLabels[admin.role]}
      />

      <div className="lg:ml-[var(--tuma-admin-sidebar-width)]">
        <main className="px-4 pt-20 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
