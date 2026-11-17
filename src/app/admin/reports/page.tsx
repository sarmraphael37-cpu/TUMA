import type { Metadata } from "next";
import { Download } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { AdminFrame } from "@/components/admin/admin-frame";

export const metadata: Metadata = {
  title: "Reports",
  description: "Export platform data as CSV.",
};

const EXPORTS = [
  { type: "merchants", label: "Merchants", description: "All businesses with owner and plan." },
  { type: "users", label: "Users", description: "All profiles and admin roles." },
  { type: "products", label: "Products", description: "Catalogue across the platform." },
  { type: "orders", label: "Orders", description: "All orders with status and payment." },
  { type: "subscriptions", label: "Subscriptions", description: "Plan and billing state." },
  { type: "ai", label: "AI generations", description: "AI requests, tokens and status." },
  { type: "tickets", label: "Support tickets", description: "Tickets and message counts." },
  { type: "audit", label: "Audit log", description: "Sensitive admin actions." },
];

export default async function AdminReportsPage() {
  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Reports & exports
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Download platform data as CSV. Exports respect your admin role.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORTS.map((entry) => (
            <Card key={entry.type} title={entry.label} description={entry.description}>
              <a
                href={`/admin/reports/export?type=${entry.type}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium transition-colors hover:bg-white/[0.07]"
              >
                <Download className="size-3.5" aria-hidden />
                Download CSV
              </a>
            </Card>
          ))}
        </div>
      </div>
    </AdminFrame>
  );
}
