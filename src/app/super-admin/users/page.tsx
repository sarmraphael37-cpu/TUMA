import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Folder,
  Trash2,
  Loader2,
  XCircle,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/format";

type UserRecord = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_verified: boolean;
};

type UsersListResult = {
  data: UserRecord[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Users",
  description: "User and role management for the TUMA platform.",
};

export default function SuperAdminUsersPage() {
  const supa = useSupabaseServerClient();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  // Fetch users on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("users")
          .select("id, email, full_name, role, created_at, last_sign_in_at, email_verified")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setUsers(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading users",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const handleRevokeRole = async (userId: string, currentRole: string) => {
    try {
      const { error } = await supa
        .from("platform_admins")
        .delete()
        .eq("profile_id", userId);

      if (error) throw error;

      toast({
        title: "Role revoked",
        description: `User ${currentRole} role has been removed`,
      });

      loadUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const assignSuperAdmin = async (userId: string) => {
    try {
      const { error } = await supa
        .from("platform_admins")
        .upsert(
          { profile_id: userId, role: "super_admin", created_by: userId },
          { onConflict: "profile_id" }
        );

      if (error) throw error;

      toast({
        title: "Super admin assigned",
        description: "User now has full platform control",
      });

      loadUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <Loader2 className="size-6 mx-auto mb-4 animate-spin text-electric-300" />
          <p className="text-[12px] text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="bg-red-500/10 border-l-4 border-red-500 rounded p-4 text-red-400">
          <strong>Error:</strong> {error?.message ?? "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Card bodyClassName="p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Users & Roles
          </h1>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            Platform users with their assigned roles.
          </p>
        </div>
      </Card>

      {users.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <div className="max-w-md mx-auto mb-6">
            <Users className="size-6 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-heading text-[1.25rem] font-medium mb-2">No users yet</h3>
            <p className="text-[11px] text-muted-foreground">
              Users appear here after registration or admin invitation.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <a href={`mailto:${user.email}`} className="text-white hover:text-cyan-glow transition-colors">
                      {user.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    {user.full_name || "No name"}
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {user.role === "super_admin"
                        ? "Super Admin"
                        : user.role === "support"
                          ? "Support"
                          : user.role === "analyst"
                            ? "Analyst"
                            : "User"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">{formatDate(user.created_at)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] px-2"
                      onClick={() => openRoleManagement(user.id, user.role)}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* Role management opened as a separate page/action */
function openRoleManagement(userId: string, currentRole: string) {
  // For now, just show a toast with options
  toast({
    title: "Role Management",
    description: `
      User: ${userId}
      Current role: ${currentRole}
      Options: Revoke role, Grant Super Admin
    `,
  });
  
  // In a full implementation, this would open a dialog or navigate to a role management page
}