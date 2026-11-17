import type { Metadata } from "next";
import { Users } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AdminFrame } from "@/components/admin/admin-frame";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminUsers } from "@/lib/admin/queries";
import { formatDateTime, formatNumber } from "@/lib/format";
import { roleLabels } from "@/lib/admin/permissions";
import { grantAdminRoleAction, revokeAdminRoleAction } from "../actions";

export const metadata: Metadata = {
  title: "Users & roles",
  description: "Profiles and platform staff.",
};

type SearchParams = Promise<{ q?: string; role?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const result = await getAdminUsers({ query: params.q, roleFilter: params.role });

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Users & roles
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Every profile on TUMA and the staff who administer it.{" "}
            {formatNumber(result.total)} shown.
          </p>
        </div>

        <Card bodyClassName="p-3">
          <form action="/admin/users" method="get" className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search by name or email"
              className="h-9 flex-1 min-w-[200px] rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <select
              name="role"
              defaultValue={params.role ?? "all"}
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
            >
              <option value="all">All users</option>
              <option value="admin">Admins only</option>
              <option value="non-admin">Non-admins</option>
              <option value="super_admin">Super admins</option>
              <option value="support">Support</option>
              <option value="analyst">Analysts</option>
            </select>
            <button
              type="submit"
              className="h-9 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
            >
              Filter
            </button>
          </form>
        </Card>

        {result.error ? (
          <ErrorState title="We could not load users" description={result.error} />
        ) : result.users.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="size-5" aria-hidden />}
              title="No users match"
              description="Try a different search or filter."
            />
          </Card>
        ) : (
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <Table className="text-[11.5px]">
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">User</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Phone</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Joined</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Admin role</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Grant / revoke</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.users.map((user) => (
                    <TableRow key={user.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                      <TableCell className="py-2.5 pl-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground/90">
                            {user.fullName}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-muted-foreground">
                        {user.phone ?? "—"}
                      </TableCell>
                      <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(user.createdAt)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {user.adminRole ? (
                          <StatusBadge tone="brand">
                            {roleLabels[user.adminRole as keyof typeof roleLabels] ?? user.adminRole}
                          </StatusBadge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <form action={grantAdminRoleAction} className="flex items-center gap-1.5">
                            <input type="hidden" name="profileId" value={user.id} />
                            <select
                              name="role"
                              defaultValue={user.adminRole ?? "support"}
                              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            >
                              <option value="super_admin">Super admin</option>
                              <option value="support">Support</option>
                              <option value="analyst">Analyst</option>
                            </select>
                            <button
                              type="submit"
                              className="h-7 rounded-md border border-white/[0.09] bg-white/[0.04] px-2 text-[10.5px] font-medium"
                            >
                              Grant
                            </button>
                          </form>
                          {user.adminRole ? (
                            <form action={revokeAdminRoleAction}>
                              <input type="hidden" name="profileId" value={user.id} />
                              <button
                                type="submit"
                                className="h-7 rounded-md border border-rose-400/20 bg-rose-400/[0.06] px-2 text-[10.5px] font-medium text-rose-300"
                              >
                                Revoke
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </AdminFrame>
  );
}
