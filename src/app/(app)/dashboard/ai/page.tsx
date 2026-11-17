import type { Metadata } from "next";

import { AiWorkspace } from "@/components/dashboard/ai/ai-workspace";
import { DashboardFrame } from "@/components/dashboard/shell/dashboard-frame";
import { getAiPublicStatus } from "@/lib/ai/config";
import { listAiGenerations } from "@/lib/ai/history";
import {
  getAiProductOptions,
  getInsightsSnapshot,
} from "@/lib/ai/insights";
import { requireBusiness } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "TUMA AI",
  description:
    "Product copy, marketing content and real-data business insights in English and French.",
};

async function AiWorkspaceContent() {
  const { business } = await requireBusiness("/dashboard/ai");

  const status = getAiPublicStatus();
  const [snapshot, products, history] = await Promise.all([
    getInsightsSnapshot(business),
    getAiProductOptions(business.id),
    listAiGenerations(),
  ]);

  return (
    <DashboardFrame>
      <AiWorkspace
        status={status}
        snapshot={snapshot}
        products={products}
        initialHistory={history.items}
        historyError={history.error}
      />
    </DashboardFrame>
  );
}

export default function AiPage() {
  /*
   * Reads live workspace data, so it renders per request. Like the overview it
   * is not wrapped in a Suspense boundary, to avoid a partial-prerender
   * fallback being reused by the request-time render.
   */
  return <AiWorkspaceContent />;
}
