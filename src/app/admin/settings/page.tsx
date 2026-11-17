import type { Metadata } from "next";
import { Card } from "@/components/dashboard/cards/card";
import { AdminFrame } from "@/components/admin/admin-frame";
import { ErrorState } from "@/components/dashboard/states/error-state";
import { getAdminPlatformSettings, getPlatformPlanPrices } from "@/lib/admin/settings";
import { setPlatformSettingAction, setPlanPriceAction } from "../actions";

export const metadata: Metadata = {
  title: "Settings",
  description: "Platform configuration and plan prices.",
};

export default async function AdminSettingsPage() {
  const settings = await getAdminPlatformSettings();
  const prices = await getPlatformPlanPrices();

  const publicKeys = [
    "platform_name",
    "support_email",
    "registration_open",
    "ai_hourly_limit",
    "default_currency",
    "maintenance_message",
  ];

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Settings
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Configuration consumed by the application. Changes are audited.
          </p>
        </div>

        <Card title="Platform settings">
          <div className="space-y-3">
            {publicKeys.map((key) => (
              <form
                key={key}
                action={setPlatformSettingAction}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
              >
                <input type="hidden" name="key" value={key} />
                <span className="min-w-[180px] text-[12px] font-medium text-foreground/90">
                  {key}
                </span>
                <input
                  type="text"
                  name="value"
                  defaultValue={String(settings[key] ?? "")}
                  className="h-8 flex-1 min-w-[160px] rounded-md border border-white/[0.07] bg-white/[0.025] px-2 text-[11.5px]"
                />
                <button
                  type="submit"
                  className="h-8 rounded-md border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
                >
                  Save
                </button>
              </form>
            ))}
          </div>
        </Card>

        <Card title="Plan prices">
          <div className="space-y-3">
            {prices.length === 0 ? (
              <ErrorState title="No plan prices found" description="Apply the admin migration to seed plan prices." />
            ) : (
              prices.map((price) => (
                <form
                  key={price.plan}
                  action={setPlanPriceAction}
                  className="grid gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 sm:grid-cols-5"
                >
                  <input type="hidden" name="plan" value={price.plan} />
                  <div className="flex items-center">
                    <span className="text-[12px] font-medium capitalize text-foreground/90">
                      {price.plan}
                    </span>
                  </div>
                  <input
                    type="number"
                    name="monthlyPrice"
                    defaultValue={price.monthlyPrice}
                    placeholder="Monthly"
                    className="h-8 rounded-md border border-white/[0.07] bg-white/[0.025] px-2 text-[11.5px]"
                  />
                  <input
                    type="number"
                    name="annualPrice"
                    defaultValue={price.annualPrice}
                    placeholder="Annual (monthly equiv.)"
                    className="h-8 rounded-md border border-white/[0.07] bg-white/[0.025] px-2 text-[11.5px]"
                  />
                  <input
                    type="text"
                    name="currency"
                    defaultValue={price.currency}
                    className="h-8 rounded-md border border-white/[0.07] bg-white/[0.025] px-2 text-[11.5px]"
                  />
                  <button
                    type="submit"
                    className="h-8 rounded-md border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
                  >
                    Save
                  </button>
                </form>
              ))
            )}
          </div>
        </Card>
      </div>
    </AdminFrame>
  );
}
