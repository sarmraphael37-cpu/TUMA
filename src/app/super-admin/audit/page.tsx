import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Shield, Clock, Users, Mail, TrendingUp, XCircle, CheckCircle } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatDate, formatCompactNumber } from "@/lib/format";

type AuditLogRecord = {
  id: string;
  action: "create" | "update" | "delete" | "suspend" | "unsuspend" | "login" | "assign_role" | "revoke_role";
  target_type: "merchant" | "user" | "product" | "order" | "subscription" | "setting" | "announcement";
  target_id: string;
  target_title: string;
  performed_by: string;
  performed_by_email: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
};

type AuditLogListResult = {
  data: AuditLogRecord[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Audit Log",
  description: "Administrative audit trail of all platform actions.",
};

export default function SuperAdminAuditLogPage() {
  const supa = useSupabaseServerClient();
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("audit_log")
          .select(
            "*,
            admin_profiles!performed_by(email, full_name)"
          )
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setAuditLogs(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading audit log",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadAuditLogs();
  }, []);

  const filterAction = searchParams.get("action");
  const filterTarget = searchParams.get("target");

  const filteredLogs = auditLogs.filter((log) => {
    const actionMatch = !filterAction || log.action === filterAction;
    const targetMatch = !filterTarget || log.target_type === filterTarget;
    return actionMatch && targetMatch;
  });

  const actionCounts: Record<string, number> = {};
  auditLogs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <Loader2 className="size-6 mx-auto mb-4 animate-spin text-electric-300" />
          <p className="text-[12px] text-muted-foreground">Loading audit log...</p>
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
        <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
          Audit Log
        </h1>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Filter by action</p>
            <select
              onChange={(e) => {
                const url = new URLSearchParams(searchParams.toString());
                url.set("action", e.target.value);
                window.history.pushState({}, "", `/super-admin/audit?${url.toString()}`);
                // Would need to refetch with new filters
              }}
              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-1 text-[10px] focus:outline-none focus:bg-white/[0.05]"
            >
              <option value="">All actions</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="delete">delete</option>
              <option value="suspend">suspend</option>
              <option value="unsuspend">unsuspend</option>
              <option value="assign_role">assign_role</option>
              <option value="revoke_role">revoke_role</option>
              <option value="login">login</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Filter by target</p>
            <select
              onChange={(e) => {
                const url = new URLSearchParams(searchParams.toString());
                url.set("target", e.target.value);
                window.history.pushState({}, "", `/super-admin/audit?${url.toString()}`);
              }}
              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-1 text-[10px] focus:outline-none focus:bg-white/[0.05]"
            >
              <option value="">All targets</option>
              <option value="merchant">merchant</option>
              <option value="user">user</option>
              <option value="product">product</option>
              <option value="order">order</option>
              <option value="subscription">subscription</option>
              <option value="setting">setting</option>
              <option value="announcement">announcement</option>
            </select>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(actionCounts).slice(0, 6).map(([action, count]) => (
            <div key={action} className="p-3 rounded-lg bg-white/[0.03] text-center">
              <p className="text-[11px] text-muted-foreground mb-1">{action.replace(/_/g, " ")}</p>
              <p className="font-heading font-medium text-cyan-glow">{formatCompactNumber(count)}</p>
            </div>
          ))}
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Target Title</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredLogs.map((log) => {
                const detailsPreview = log.details
                  ? JSON.stringify(log.details).substring(0, 100) + "..."
                  : "—";

                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="text-[9px] {
                        log.action === "create" ? "text-green-400" : log.action === "delete" ? "text-red-400" : log.action === "suspend" ? "text-yellow-400" : "text-blue-400"
                      }">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[9px] {
                        log.target_type === "merchant" ? "text-cyan-400" : log.target_type === "user" ? "text-blue-400" : "text-emerald-400"
                      }">
                        {log.target_type.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="truncate line-clamp-1 max-w-[200px]">
                        {log.target_title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[9px] truncate">{log.ip_address || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[9px]">
                        {formatDate(log.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[9px] truncate line-clamp-1 max-w-[150px]">
                        {detailsPreview}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}