import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Settings, Shield, Activity, Mail, Users, Folder, CheckCircle, XCircle } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

type PlatformSetting = {
  key: string;
  value: string | number | boolean;
  type: "string" | "number" | "boolean" | "json";
  description: string;
  updated_at: string;
  updated_by: string | null;
};

type SettingsListResult = {
  data: PlatformSetting[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Settings",
  description: "Platform configuration and settings.",
};

export default function SuperAdminSettingsPage() {
  const supa = useSupabaseServerClient();
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("platform_settings")
          .select("*", { count: "exact" })
          .order("key", { ascending: true });
        
        if (error) throw error;
        setSettings(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading settings",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleUpdateSetting = async (key: string, newValue: string | number | boolean) => {
    try {
      const { error } = await supa
        .from("platform_settings")
        .upsert(
          { key, value: String(newValue), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      toast({
        title: "Setting updated",
        description: `Platform setting "${key}" has been updated`,
      });

      loadSettings();
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
          <p className="text-[12px] text-muted-foreground">Loading settings...</p>
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
          Platform Settings
        </h1>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Platform configuration and settings ({formatNumber(settings.length)} settings).
        </p>
      </Card>

      {settings.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <Settings className="size-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-heading text-[1.25rem] font-medium mb-2">No settings yet</h3>
          <p className="text-[11px] text-muted-foreground">
            Settings appear here once the platform is configured.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setting</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.key}>
                  <TableCell>
                    <div className="font-medium truncate line-clamp-1 max-w-[300px]">
                      {setting.key}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={String(setting.value)}
                      placeholder="Enter value"
                      className="w-full text-[10px] py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {setting.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] truncate line-clamp-1 max-w[200px]">
                      {setting.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatDate(setting.updated_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] px-2"
                      onClick={() => handleUpdateSetting(setting.key, setting.value)}
                    >
                      Update
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