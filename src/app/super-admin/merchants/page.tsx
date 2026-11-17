import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminMerchants, resolveDashboardRange } from "@/lib/admin/queries";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useSearchParams, useNavigate } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

type Merchant = {
  id: string;
  name: string;
  slug: string;
  category: string;
  currency: string;
  is_public: boolean;
  admin_status: string | null;
  suspended_reason: string | null;
  suspended_at: string | null;
  created_at: string;
  owner: {
    id: string;
    email: string;
    full_name: string;
  };
  subscription: {
    plan: string;
    status: string;
    price: number;
    currency: string;
    current_period_end: string | null;
    trial_ends_at: string | null;
  } | null;
  stats: {
    products_count: number;
    orders_count: number;
  };
};

type MerchantListResult = {
  data: Merchant[];
  error: Error | null;
  count: number;
  total: number;
};

export const metadata: Metadata = {
  title: "Merchants",
  description: "Every business registered on TUMA, with its owner, plan and moderation state.",
};

export default function SuperAdminMerchantsPage() {
  const supa = useSupabaseServerClient();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [range, setRange] = useState<{ from: string; to: string }>({ from: "", to: "" });

  // Fetch merchants on mount
  useEffect(() => {
    async function loadMerchants() {
      try {
        setLoading(true);
        const data = await getAdminMerchants({});
        setMerchants(data.data);
        setError(data.error);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadMerchants();
  }, []);

  const handleSuspend = async (merchantId: string, action: "suspend" | "unsuspend") => {
    try {
      const { error } = await supa
        .from("businesses")
        .update({
          admin_status: action === "suspend" ? "suspended" : "active",
          suspended_reason: action === "suspend" ? "Suspended by super admin" : null,
          suspended_at: action === "suspend" ? new Date().toISOString() : null,
        })
        .eq("id", merchantId);

      if (error) throw error;

      toast({
        title: action === "suspend" ? "Merchant suspended" : "Merchant reactivated",
        description: `Merchant ${action === "suspend" ? "has been suspended" : "is now active again"}`,
      });

      loadMerchants();
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
          <p className="text-[12px] text-muted-foreground">Loading merchants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <ErrorState
          title="Could not load merchants"
          description={error?.message ?? "Unknown error"}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Card bodyClassName="p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
          <div>
            <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
              Merchants
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              Every business registered on TUMA, with its owner, plan and moderation state.
              {formatNumber(merchants.length)} total.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Search merchants..."
              className="w-64 sm:w-80"
            />
            <Button
              variant="outline"
              className="text-[10px] px-3"
              onClick={() => window.location.href = "/super-admin/merchants"}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {merchants.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <EmptyState
            icon={<Store className="size-6 mx-auto mb-4" />}
            title="No merchants yet"
            description="Merchants appear here once businesses register on TUMA."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {merchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/super-admin/merchants/${merchant.slug}`}
                      className="text-white hover:text-cyan-glow transition-colors"
                    >
                      {merchant.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-[9px] truncate">
                      {merchant.owner.full_name || merchant.owner.email?.split("@")[0] ?? "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {merchant.subscription?.plan || "No plan"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={merchant.admin_status || "active"}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">{merchant.stats.products_count}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">{merchant.stats.orders_count}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={false}
                      onOpenChange={undefined}
                      className="modal modal-sm"
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Merchant</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 space-y-4">
                          <p className="text-[11px] text-muted-foreground">
                            {merchant.name} ({" "}
                            <span className="font-medium"
                              >{merchant.owner.full_name || merchant.owner.email}</span>)
                            {merchant.admin_status === "suspended"
                              ? " - Suspended: " + (merchant.suspended_reason || "No reason")
                              : " - Active"}
                            </span>
                          </p>

                          <DialogFooter>
                            <Button
                              variant="outline"
                              className="w-full text-[10px]"
                              onClick={() => {
                                // Just close the dialog, action would need confirmation
                              }}
                            >
                              Close
                            </Button>
                            {merchant.admin_status !== "suspended" && (
                              <Button
                                variant="destructive"
                                width="100%"
                                className="w-full text-[10px]"
                                onClick={() => handleSuspend(merchant.id, "suspend")}
                              >
                                Suspend Merchant
                              </Button>
                            )}
                            {merchant.admin_status === "suspended" && (
                              <Button
                                variant="secondary"
                                width="100%"
                                className="w-full text-[10px]"
                                onClick={() => handleSuspend(merchant.id, "unsuspend")}
                              >
                                Reactivate Merchant
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {merchants.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Showing {merchants.length} of {merchants.length} merchants
              </p>
              <nav>
                <ul className="flex gap-2">
                  <li>
                    <Link
                      href="?page=1"
                      className="text-[10px] text-cyan-glow hover:underline"
                    >
                      First
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="?page={Math.max(Number(1) - 1, 1)}"
                      className="text-[10px] text-cyan-glow hover:underline"
                    >
                      Prev
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="?page={Math.min(Number(1) + 1, 2)}"
                      className="text-[10px] text-cyan-glow hover:underline"
                    >
                      Next
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="?page={Math.ceil(merchants.length / 10)}"
                      className="text-[10px] text-cyan-glow hover:underline"
                    >
                      Last
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}