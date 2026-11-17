import { Megaphone } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/db/schema-state";
import { formatDateTime } from "@/lib/format";

type Announcement = {
  id: string;
  title: string;
  body: string;
  tone: string;
  published_at: string | null;
  created_at: string;
};

const TONE_CLASSES: Record<string, string> = {
  info: "border-cyan-glow/20 bg-cyan-glow/[0.05] text-cyan-glow",
  success: "border-mint-glow/20 bg-mint-glow/[0.05] text-mint-glow",
  warning: "border-amber-glow/20 bg-amber-glow/[0.05] text-amber-glow",
  danger: "border-rose-400/20 bg-rose-400/[0.05] text-rose-300",
};

export async function AnnouncementsBanner() {
  let announcements: Announcement[] = [];

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("platform_announcements")
      .select("id, title, body, tone, published_at, created_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(3);

    if (error) {
      if (!isMissingSchemaError(error)) {
        return null;
      }
      return null;
    }

    announcements = (data ?? []) as Announcement[];
  } catch {
    return null;
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-[12px] ${TONE_CLASSES[announcement.tone] ?? TONE_CLASSES.info}`}
        >
          <Megaphone className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium">{announcement.title}</p>
            <p className="mt-0.5 leading-relaxed text-foreground/80">
              {announcement.body}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {formatDateTime(announcement.published_at ?? announcement.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
