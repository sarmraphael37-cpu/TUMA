import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Loader2,
  XCircle,
  CheckCircle,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";

type PaymentRecord = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  order_id: string;
  business_id: string;
  business_name: string;
  customer_email: string | null;
  created_at: string;
  confirmed_at: string | null;
};

type PaymentsListResult = {
  data: PaymentRecord[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Payments",
  description: "Payment and revenue management across the platform.",
};

export default function SuperAdminPaymentsPage() {
  const supa = useSupabaseServerClient();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("payments")
          .select(
            "*,
            business:name(id, name, slug),
            order:orders(id, status, amount, currency)",
            { count: "exact" }
          )
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setPayments(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading payments",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <Loader2 className="size-6 mx-auto mb-4 animate-spin text-electric-300" />
          <p className="text-[12px] text-muted-foreground">Loading payments...</p>
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

  const totalRevenue = payments
    .filter((p) => p.status === "paid" || p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Card bodyClassName="p-3">
        <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
          Payments
        </h1>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Payment and revenue management across the platform ({formatNumber(payments.length)} transactions,
          {formatCurrency(totalRevenue, "XAF")} total revenue).
        </p>
      </Card>

      {payments.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <CreditCard className="size-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-heading text-[1.25rem] font-medium mb-2">No payments yet</h3>
          <p className="text-[11px] text-muted-foreground">
            Payments appear here once orders are processed and confirmed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Code className="text-[9px] truncate">{payment.transaction_id || payment.id.substring(0, 8)}...</Code>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] truncate">{payment.business_name}</span>
                  </TableCell>
                  <TableCell>
                    <a href={`mailto:${payment.customer_email}`} className="text-white hover:text-cyan-glow transition-colors">
                      {payment.customer_email || "Unknown"}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatCurrency(payment.amount, "XAF")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] {
                      payment.status === "paid" ? "text-green-400" : payment.status === "pending" ? "text-yellow-400" : "text-red-400"
                    }">
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">{payment.payment_method || "Unknown"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatDate(payment.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] px-2"
                    >
                      View
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

/* Code helper component */
function Code({ children }: { children: string }) {
  return (
    <div className="rounded-xs bg-white/[0.03] px-2 py-1 text-[9px] overflow-hidden break-all">
      {children}
    </div>
  );
}