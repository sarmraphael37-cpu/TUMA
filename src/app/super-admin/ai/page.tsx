import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Bot,
  Activity,
  TrendingUp,
  XCircle,
  CheckCircle,
  Music,
  Zap,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatNumber, formatDate } from "@/lib/format";

type AiGenerationRecord = {
  id: string;
  business_id: string;
  kind: string;
  status: string;
  model: string | null;
  tokens_used: number;
  captured_at: string;
  business_name: string;
};

type AiUsageListResult = {
  data: AiGenerationRecord[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "AI Usage",
  description: "AI generation monitoring and limits across the platform.",
};

export default function SuperAdminAiPage() {
  const supa = useSupabaseServerClient();
  const [generations, setGenerations] = useState<AiGenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadAiUsage() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("ai_generations")
          .select(
            "*, business(name, slug), kind(input_tokens, output_tokens, captured_at)",
            { count: "exact" }
          )
          .order("captured_at", { ascending: false });
        
        if (error) throw error;
        setGenerations(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading AI usage",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadAiUsage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <Loader2 className="size-6 mx-auto mb-4 animate-spin text-electric-300" />
          <p className="text-[12px] text-muted-foreground">Loading AI usage...</p>
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

  const totalTokens = generations.reduce((sum, g) => sum + g.tokens_used, 0);
  const totalGenerations = generations.length;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Card bodyClassName="p-3">
        <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
          AI Usage
        </h1>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          AI generation monitoring and limits across the platform ({totalGenerations} generations,
          {formatNumber(totalTokens)} tokens).
        </p>
      </Card>

      {generations.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <Bot className="size-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-heading text-[1.25rem] font-medium mb-2">No AI generations yet</h3>
          <p className="text-[11px] text-muted-foreground">
            AI generations appear here once the AI workspace is used by merchants.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {generations.map((gen) => (
                <TableRow key={gen.id}>
                  <TableCell>
                    <span className="text-[9px] truncate">{gen.business_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {gen.kind.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] font-medium">
                      {formatNumber(gen.tokens_used)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] {
                      gen.status === "completed" ? "text-green-400" : gen.status === "failed" ? "text-red-400" : "text-yellow-400"
                    }">
                      {gen.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {gen.model || "gpt-4o-mini"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatDate(gen.captured_at)}
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