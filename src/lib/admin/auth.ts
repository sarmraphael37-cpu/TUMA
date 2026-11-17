import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  isMissingSchemaError,
  reportMissingSchema,
} from "@/lib/db/schema-state";
import { hasCapability, type Capability } from "./permissions";

import type { PlatformRole } from "./permissions";
export type { PlatformRole };

export type PlatformAdmin = {
  id: string;
  profileId: string;
  role: PlatformRole;
  email: string;
  fullName: string;
};

export async function isAdminSchemaAvailable(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("platform_admins")
      .select("id")
      .limit(1);
    if (error) {
      if (isMissingSchemaError(error)) {
        reportMissingSchema("platform_admins");
        return false;
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getPlatformAdmin(): Promise<PlatformAdmin | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("platform_admins")
      .select("id, profile_id, role, profiles(email, full_name)")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) {
        reportMissingSchema("platform_admins");
      }
      return null;
    }

    if (!data) {
      return null;
    }

    const profile = (data as { profiles?: { email?: string; full_name?: string } | null })
      .profiles;

    return {
      id: data.id as string,
      profileId: data.profile_id as string,
      role: data.role as PlatformRole,
      email: profile?.email ?? user.email ?? "",
      fullName: profile?.full_name ?? user.email?.split("@")[0] ?? "Admin",
    };
  } catch {
    return null;
  }
}

export async function requirePlatformAdmin(nextPath = "/admin"): Promise<PlatformAdmin> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  const admin = await getPlatformAdmin();
  if (!admin) {
    redirect("/admin/denied");
  }

  return admin;
}

export async function requireSuperAdmin(nextPath = "/admin"): Promise<PlatformAdmin> {
  const admin = await requirePlatformAdmin(nextPath);
  if (admin.role !== "super_admin") {
    redirect("/admin/denied");
  }
  return admin;
}

export function can(admin: PlatformAdmin, capability: Capability): boolean {
  return hasCapability(admin.role, capability);
}

export function requireCapability(
  admin: PlatformAdmin,
  capability: Capability,
): void {
  if (!can(admin, capability)) {
    redirect("/admin/denied");
  }
}
