import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Music,
  Loader2,
  XCircle,
  CheckCircle,
  Calendar,
  Settings,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";

type SubscriptionRecord = {
  id: string;
  plan: string;
  status: string;
  price: number;
  currency: string;
  current_period_start: string;
  current_period_end: string | null;
  trial_ends_at: string | null;
  cancel_at: string | null;
  cancelled_at: string | null;
  trial: boolean;
  business_id: string;
  business_name: string;
  created_at: string;
};

type SubscriptionsListResult = {
  data: SubscriptionRecord[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Subscription and pricing management across the platform.",
};

export default function SuperAdminSubscriptionsPage() {
  const supa = useSupabaseServerClient();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadSubscriptions() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("business_subscriptions")
          .select(
            "*, business(name, slug, owner:profiles(full_name, email))",
            { count: "exact" }
          )
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setSubscriptions(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading subscriptions",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadSubscriptions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <Loader2 className="size-6 mx-auto mb-4 animate-spin text-electric-300" />
          <p className="text-[12px] text-muted-foreground">Loading subscriptions...</p>
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
          Subscriptions
        </h1>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Subscription and pricing management across the platform ({formatNumber(subscriptions.length)} active).
        </p>
      </Card>

      {subscriptions.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <Music className="size-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-heading text-[1.25rem] font-medium mb-2">No subscriptions yet</h3>
          <p className="text-[11px] text-muted-foreground">
            Subscriptions appear here once merchants set up pricing plans.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <span className="font-medium">{sub.plan}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] truncate">{sub.business_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] {
                      sub.status === "active" ? "text-green-400" : sub.status === "canceled" ? "text-red-400" : "text-yellow-400"
                    }">
                      {sub.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatCurrency(sub.price, "XAF")} / month
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {sub.current_period_start && sub.current_period_end
                        ? `${formatDate(sub.current_period_start)} – ${formatDate(sub.current_period_end)}`
                        : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {sub.trial ? "Yes (" + (sub.trial_ends_at ? formatDate(sub.trial_ends_at) : "until canceled") + ")" : "No"}
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
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-[9px] px-2"
                      onClick={() => {
                        toast({
                          title: "Cancel subscription",
                          description: `Are you sure you want to cancel "${sub.plan}" for ${sub.business_name}?`,
                          variant: "destructive",
                        });
                      }}
                    >
                      Cancel
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