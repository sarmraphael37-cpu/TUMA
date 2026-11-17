import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Mail, Shield, XCircle, CheckCircle } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";

type AnnouncementRecord = {
  id: string;
  title: string;
  content: string;
  kind: "info" | "warning" | "success" | "error";
  target: "all" | "merchants" | "users";
  created_at: string;
  created_by: string | null;
  is_active: boolean;
};

type AnnouncementsListResult = {
  data: AnnouncementRecord[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Announcements",
  description: "Platform-wide notifications and communications.",
};

export default function SuperAdminAnnouncementsPage() {
  const supa = useSupabaseServerClient();
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("platform_announcements")
          .select(
            "*, profiles!created_by(id, full_name, email)",
            { count: "exact" }
          )
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setAnnouncements(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading announcements",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const handleToggleActive = async (announcementId: string, currentActive: boolean) => {
    try {
      const { error } = await supa
        .from("platform_announcements")
        .update({ is_active: !currentActive })
        .eq("id", announcementId);

      if (error) throw error;

      toast({
        title: "Announcement updated",
        description: `Announcement ${!currentActive ? "activated" : "deactivated"}`,
      });

      loadAnnouncements();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (announcementId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const { error } = await supa
        .from("platform_announcements")
        .delete()
        .eq("id", announcementId);

      if (error) throw error;

      toast({
        title: "Announcement deleted",
        description: "The announcement has been permanently removed.",
      });

      loadAnnouncements();
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
          <p className="text-[12px] text-muted-foreground">Loading announcements...</p>
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
          Announcements
        </h1>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Platform-wide notifications and communications ({formatNumber(announcements.length)} active).
        </p>
      </Card>

      {announcements.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <MessageCircle className="size-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-heading text-[1.25rem] font-medium mb-2">No announcements yet</h3>
          <p className="text-[11px] text-muted-foreground">
            Announcements appear here once the super admin creates platform-wide messages.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {announcements.map((ann) => (
                <TableRow key={ann.id}>
                  <TableCell>
                    <div className="truncate line-clamp-1 max-w-[200px]">
                      {ann.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {ann.target === "all"
                        ? "All users"
                        : ann.target === "merchants"
                          ? "Merchants only"
                          : "Users only"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] {
                      ann.kind === "info" ? "text-blue-400" : ann.kind === "warning" ? "text-yellow-400" : ann.kind === "success" ? "text-green-400" : "text-red-400"
                    }">
                      {ann.kind.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatDate(ann.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] {
                      ann.is_active ? "text-green-400" : "text-red-400"
                    }">
                      {ann.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={false}
                      onOpenChange={undefined}
                      className="modal modal-sm"
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Announcement</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 space-y-4">
                          <p className="text-[11px] text-muted-foreground">
                            {ann.title}
                          </p>

                          <div className="space-y-3">
                            <Button
                              variant="outline"
                              width="100%"
                              className="w-full text-[10px]"
                              onClick={() => handleToggleActive(ann.id, ann.is_active)}
                            >
                              {ann.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="destructive"
                              width="100%"
                              className="w-full text-[10px]"
                              onClick={() => handleDelete(ann.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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