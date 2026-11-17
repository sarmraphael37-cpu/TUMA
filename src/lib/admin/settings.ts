import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  isMissingSchemaError,
  reportMissingSchema,
} from "@/lib/db/schema-state";

export type PublicPlatformSettings = {
  platformName: string;
  supportEmail: string;
  registrationOpen: boolean;
  aiHourlyLimit: number;
  defaultCurrency: string;
  maintenanceMessage: string;
};

export type AdminPlatformSettings = PublicPlatformSettings & {
  all: Record<string, unknown>;
};

const DEFAULTS: PublicPlatformSettings = {
  platformName: "TUMA",
  supportEmail: "",
  registrationOpen: true,
  aiHourlyLimit: 20,
  defaultCurrency: "XAF",
  maintenanceMessage: "",
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function getPublicPlatformSettings(): Promise<PublicPlatformSettings> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_public_platform_settings");

    if (error || !data || typeof data !== "object") {
      if (error && isMissingSchemaError(error)) {
        reportMissingSchema("platform_settings");
      }
      return DEFAULTS;
    }

    const record = data as Record<string, unknown>;

    return {
      platformName: asString(record.platform_name, DEFAULTS.platformName),
      supportEmail: asString(record.support_email, DEFAULTS.supportEmail),
      registrationOpen: asBoolean(
        record.registration_open,
        DEFAULTS.registrationOpen,
      ),
      aiHourlyLimit: asNumber(record.ai_hourly_limit, DEFAULTS.aiHourlyLimit),
      defaultCurrency: asString(
        record.default_currency,
        DEFAULTS.defaultCurrency,
      ),
      maintenanceMessage: asString(
        record.maintenance_message,
        DEFAULTS.maintenanceMessage,
      ),
    };
  } catch {
    return DEFAULTS;
  }
}

export async function getAdminPlatformSettings(): Promise<Record<string, unknown>> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_platform_settings");

    if (error || !data || typeof data !== "object") {
      if (error && isMissingSchemaError(error)) {
        reportMissingSchema("platform_settings");
      }
      return {};
    }

    return data as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function getEffectiveAiHourlyLimit(envDefault: number): Promise<number> {
  const settings = await getPublicPlatformSettings();
  return settings.aiHourlyLimit > 0 ? settings.aiHourlyLimit : envDefault;
}

export async function getPlatformPlanPrices(): Promise<
  Array<{ plan: string; monthlyPrice: number; annualPrice: number; currency: string }>
> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_platform_plan_prices");

    if (error || !Array.isArray(data)) {
      if (error && isMissingSchemaError(error)) {
        reportMissingSchema("platform_plan_prices");
      }
      return [];
    }

    return data.map((entry) => {
      const record = entry as Record<string, unknown>;
      return {
        plan: String(record.plan ?? ""),
        monthlyPrice: Number(record.monthlyPrice ?? 0),
        annualPrice: Number(record.annualPrice ?? 0),
        currency: String(record.currency ?? "XAF"),
      };
    });
  } catch {
    return [];
  }
}
