import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Loader2,
  XCircle,
  CheckCircle,
  Clock,
  BarChart2,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";

type OrderRecord = {
  id: string;
  status: string;
  payment_status: string;
  amount: number;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  business_id: string;
  business_name: string;
  created_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  items: Array<{ name: string; quantity: number; price: number }>;
};

type OrdersListResult = {
  data: OrderRecord[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Orders",
  description: "Order tracking and fulfillment monitoring across the platform.",
};

export default function SuperAdminOrdersPage() {
  const supa = useSupabaseServerClient();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("orders")
          .select(
            "*,
            business:name(
              id,
              name,
              slug
            ),"
          )
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setOrders(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading orders",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <Loader2 className="size-6 mx-auto mb-4 animate-spin text-electric-300" />
          <p className="text-[12px] text-muted-foreground">Loading orders...</p>
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
          Orders
        </h1>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Order tracking and fulfillment monitoring across the platform ({formatNumber(orders.length)} total).
        </p>
      </Card>

      {orders.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <Package className="size-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-heading text-[1.25rem] font-medium mb-2">No orders yet</h3>
          <p className="text-[11px] text-muted-foreground">
            Orders appear here once customers place orders through merchant storefronts.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <CopyToClipboard text={order.id}>
                      {order.id.substring(0, 8)}...
                    </CopyToClipboard>
                  </TableCell>
                  <TableCell>
                    <a href={`mailto:${order.customer_email}`} className="text-white hover:text-cyan-glow transition-colors">
                      {order.customer_name || order.customer_email || "Anonymous"}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] truncate">{order.business_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatCurrency(order.amount, "XAF")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] {
                      order.status === "delivered" ? "text-green-400" : order.status === "cancelled" ? "text-red-400" : "text-yellow-400"
                    }">
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] {
                      order.payment_status === "paid" ? "text-green-400" : order.payment_status === "pending" ? "text-yellow-400" : "text-red-400"
                    }">
                      {order.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatDate(order.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] px-2"
                    >
                      Details
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

/* CopyToClipboard helper component */
function CopyToClipboard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-1 text-[9px] transition-colors hover:text-foreground focus:outline-none focus:bg-white/[0.05]"
      aria-label="Copy order ID"
      title="Copy order ID"
    >
      {copied ? ("Copied") : ("Copy")}
      <CheckCircle className="size-3.5 ml-1 opacity-0 transition-opacity" />
    </button>
  );
}