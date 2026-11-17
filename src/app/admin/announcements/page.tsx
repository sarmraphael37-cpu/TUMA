import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AdminFrame } from "@/components/admin/admin-frame";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import { getAdminAnnouncements } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/format";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementAction,
  updateAnnouncementAction,
} from "../actions";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Platform-wide messages shown to merchants.",
};

export default async function AdminAnnouncementsPage() {
  const result = await getAdminAnnouncements();

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Announcements
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Published announcements appear as a banner on the merchant dashboard.
          </p>
        </div>

        <Card title="Create announcement">
          <form action={createAnnouncementAction} className="grid gap-3">
            <input
              type="text"
              name="title"
              placeholder="Title"
              required
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <textarea
              name="body"
              placeholder="Message body"
              required
              rows={3}
              className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="tone"
                defaultValue="info"
                className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </select>
              <select
                name="audience"
                defaultValue="merchants"
                className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
              >
                <option value="merchants">Merchants</option>
                <option value="all">All users</option>
              </select>
              <label className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <input type="checkbox" name="publish" defaultChecked />
                Publish immediately
              </label>
              <button
                type="submit"
                className="ml-auto h-9 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
              >
                Create
              </button>
            </div>
          </form>
        </Card>

        {result.error ? (
          <ErrorState title="We could not load announcements" description={result.error} />
        ) : result.announcements.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Megaphone className="size-5" aria-hidden />}
              title="No announcements yet"
              description="Create one above to reach every merchant."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {result.announcements.map((announcement) => (
              <Card key={announcement.id} title={announcement.title}>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={announcement.published ? "success" : "neutral"}>
                      {announcement.published ? "Published" : "Draft"}
                    </StatusBadge>
                    <StatusBadge tone="info">{announcement.tone}</StatusBadge>
                    <StatusBadge tone="neutral">{announcement.audience}</StatusBadge>
                    <span className="text-[10.5px] text-muted-foreground">
                      {formatDateTime(announcement.createdAt)}
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-foreground/85">
                    {announcement.body}
                  </p>

                  <details className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                    <summary className="cursor-pointer text-[11.5px] font-medium text-cyan-glow">
                      Edit
                    </summary>
                    <form action={updateAnnouncementAction} className="mt-3 grid gap-2">
                      <input type="hidden" name="id" value={announcement.id} />
                      <input
                        type="text"
                        name="title"
                        defaultValue={announcement.title}
                        required
                        className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
                      />
                      <textarea
                        name="body"
                        defaultValue={announcement.body}
                        required
                        rows={3}
                        className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[12px]"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          name="tone"
                          defaultValue={announcement.tone}
                          className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
                        >
                          <option value="info">Info</option>
                          <option value="success">Success</option>
                          <option value="warning">Warning</option>
                          <option value="danger">Danger</option>
                        </select>
                        <select
                          name="audience"
                          defaultValue={announcement.audience}
                          className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
                        >
                          <option value="merchants">Merchants</option>
                          <option value="all">All users</option>
                        </select>
                        <button
                          type="submit"
                          className="ml-auto h-9 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </details>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={toggleAnnouncementAction}>
                      <input type="hidden" name="id" value={announcement.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={String(announcement.published)}
                      />
                      <button
                        type="submit"
                        className="h-8 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
                      >
                        {announcement.published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteAnnouncementAction}>
                      <input type="hidden" name="id" value={announcement.id} />
                      <button
                        type="submit"
                        className="h-8 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 text-[11.5px] font-medium text-rose-300"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminFrame>
  );
}
