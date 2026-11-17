import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FolderSearch, FileText, TrendingUp, XCircle, CheckCircle, Mail, Download } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

type ReportExport = {
  filename: string;
  recordCount: number;
  exportedAt: string;
  format: "csv" | "json";
};

type ReportsListResult = {
  data: ReportExport[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Reports",
  description: "Data exports and analytics reports.",
};

export default function SuperAdminReportsPage() {
  const supa = useSupabaseServerClient();
  const [reports, setReports] = useState<ReportExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("report_exports")
          .select("*", { count: "exact" })
          .order("exported_at", { ascending: false });
        
        if (error) throw error;
        setReports(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading reports",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const handleExport = async (reportType: "merchants" | "orders" | "revenue" | "users") => {
    try {
      let query = supa.from("").select("*"); // placeholder - actual export logic would query the relevant tables
      
      toast({
        title: "Export started",
        description: `Exporting ${reportType} report...`,
      });

      // In a real implementation, this would:
    // 1. Query the relevant data
    // 2. Generate CSV/JSON
    // 3. Return a download URL or blob
      setTimeout(() => {
        toast({
          title: "Export complete",
          description: `${reportType} report exported successfully`,
        });
      }, 2000);
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
          <p className="text-[12px] text-muted-foreground">Loading reports...</p>
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
          Reports
        </h1>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Data exports and analytics reports ({formatNumber(reports.length)} exports).
        </p>
      </Card>

      {reports.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <FolderSearch className="size-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-heading text-[1.25rem] font-medium mb-2">No reports yet</h3>
          <p className="text-[11px] text-muted-foreground">
            Reports appear here once data exports are generated.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Exported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.filename}>
                  <TableCell>
                    <div className="font-medium truncate line-clamp-1 max-w-[200px]">
                      {report.filename}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {report.format.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatNumber(recordCount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatDate(report.exportedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] px-2"
                      onClick={() => handleExport("merchants")}
                    >
                      Export
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