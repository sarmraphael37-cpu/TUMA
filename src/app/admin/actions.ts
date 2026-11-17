"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, requireSuperAdmin } from "@/lib/admin/auth";

function readForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function fail(message: string): never {
  throw new Error(message);
}

/* -------------------------------------------------------------------------- */
/*  Merchants                                                                 */
/* -------------------------------------------------------------------------- */

const setStatusSchema = z.object({
  businessId: z.string().uuid("Invalid business."),
  status: z.enum(["active", "suspended", "pending_review"]),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function setBusinessStatusAction(formData: FormData): Promise<void> {
  const parsed = setStatusSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    fail("Check the highlighted fields.");
  }

  await requireSuperAdmin("/admin/merchants");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("set_business_admin_status", {
    p_business_id: parsed.data.businessId,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason || null,
  });

  if (error) {
    fail(error.message);
  }

  revalidatePath("/admin/merchants");
  revalidatePath("/admin");
}

/* -------------------------------------------------------------------------- */
/*  Admin role management                                                     */
/* -------------------------------------------------------------------------- */

const grantAdminSchema = z.object({
  profileId: z.string().uuid("Invalid user."),
  role: z.enum(["super_admin", "support", "analyst"]),
});

export async function grantAdminRoleAction(formData: FormData): Promise<void> {
  const parsed = grantAdminSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    fail("Check the highlighted fields.");
  }

  await requireSuperAdmin("/admin/users");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("grant_platform_admin", {
    p_profile_id: parsed.data.profileId,
    p_role: parsed.data.role,
  });

  if (error) {
    fail(error.message);
  }

  revalidatePath("/admin/users");
}

const revokeAdminSchema = z.object({
  profileId: z.string().uuid("Invalid user."),
});

export async function revokeAdminRoleAction(formData: FormData): Promise<void> {
  const parsed = revokeAdminSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    fail("Check the highlighted fields.");
  }

  await requireSuperAdmin("/admin/users");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_platform_admin", {
    p_profile_id: parsed.data.profileId,
  });

  if (error) {
    fail(error.message);
  }

  revalidatePath("/admin/users");
}

/* -------------------------------------------------------------------------- */
/*  Subscriptions                                                             */
/* -------------------------------------------------------------------------- */

const updateSubscriptionSchema = z.object({
  businessId: z.string().uuid("Invalid business."),
  plan: z.enum(["starter", "growth", "scale"]),
  status: z.enum(["trialing", "active", "past_due", "cancelled", "expired"]),
  billingCycle: z.enum(["monthly", "annual"]),
  price: z.coerce.number().min(0),
  currency: z.string().trim().length(3),
  currentPeriodEnd: z.string().optional().or(z.literal("")),
});

export async function updateSubscriptionAction(formData: FormData): Promise<void> {
  const parsed = updateSubscriptionSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    fail("Check the highlighted fields.");
  }

  await requireSuperAdmin("/admin/subscriptions");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("business_subscriptions")
    .update({
      plan: parsed.data.plan,
      status: parsed.data.status,
      billing_cycle: parsed.data.billingCycle,
      price: parsed.data.price,
      currency: parsed.data.currency,
      current_period_end: parsed.data.currentPeriodEnd || null,
    })
    .eq("business_id", parsed.data.businessId);

  if (error) {
    fail(error.message);
  }

  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");
}

const setPlanPriceSchema = z.object({
  plan: z.enum(["starter", "growth", "scale"]),
  monthlyPrice: z.coerce.number().min(0),
  annualPrice: z.coerce.number().min(0),
  currency: z.string().trim().length(3),
});

export async function setPlanPriceAction(formData: FormData): Promise<void> {
  const parsed = setPlanPriceSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    fail("Check the highlighted fields.");
  }

  await requireSuperAdmin("/admin/settings");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("set_platform_plan_price", {
    p_plan: parsed.data.plan,
    p_monthly_price: parsed.data.monthlyPrice,
    p_annual_price: parsed.data.annualPrice,
    p_currency: parsed.data.currency,
  });

  if (error) {
    fail(error.message);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/subscriptions");
}

/* -------------------------------------------------------------------------- */
/*  Announcements                                                             */
/* -------------------------------------------------------------------------- */

const announcementSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(1).max(4000),
  tone: z.enum(["info", "success", "warning", "danger"]),
  audience: z.enum(["all", "merchants"]),
});

export async function createAnnouncementAction(formData: FormData): Promise<void> {
  const parsed = announcementSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    fail("Check the highlighted fields.");
  }

  const admin = await requirePlatformAdmin("/admin/announcements");
  if (admin.role === "analyst") {
    fail("Analysts cannot create announcements.");
  }

  const publish = formData.get("publish") === "on";
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("create_platform_announcement", {
    p_title: parsed.data.title,
    p_body: parsed.data.body,
    p_tone: parsed.data.tone,
    p_audience: parsed.data.audience,
    p_publish: publish,
  });

  if (error) {
    fail(error.message);
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function updateAnnouncementAction(formData: FormData): Promise<void> {
  const parsed = announcementSchema.safeParse(readForm(formData));
  if (!parsed.success || !parsed.data.id) {
    fail("Check the highlighted fields.");
  }

  const admin = await requirePlatformAdmin("/admin/announcements");
  if (admin.role === "analyst") {
    fail("Analysts cannot edit announcements.");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("update_platform_announcement", {
    p_id: parsed.data.id as string,
    p_title: parsed.data.title,
    p_body: parsed.data.body,
    p_tone: parsed.data.tone,
    p_audience: parsed.data.audience,
  });

  if (error) {
    fail(error.message);
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function toggleAnnouncementAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin("/admin/announcements");
  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "true";

  if (!id) {
    return;
  }

  const supabase = await getSupabaseServerClient();
  await supabase.rpc("set_platform_announcement_published", {
    p_id: id,
    p_published: !published,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function deleteAnnouncementAction(formData: FormData): Promise<void> {
  await requireSuperAdmin("/admin/announcements");
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const supabase = await getSupabaseServerClient();
  await supabase.rpc("delete_platform_announcement", { p_id: id });

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

/* -------------------------------------------------------------------------- */
/*  Settings                                                                  */
/* -------------------------------------------------------------------------- */

export async function setPlatformSettingAction(formData: FormData): Promise<void> {
  await requireSuperAdmin("/admin/settings");

  const key = String(formData.get("key") ?? "");
  const rawValue = String(formData.get("value") ?? "");

  let value: unknown = rawValue;
  if (rawValue === "true") value = true;
  else if (rawValue === "false") value = false;
  else if (/^-?\d+(\.\d+)?$/.test(rawValue)) value = Number(rawValue);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("set_platform_setting", {
    p_key: key,
    p_value: value,
  });

  if (error) {
    fail(error.message);
  }

  revalidatePath("/admin/settings");
}

/* -------------------------------------------------------------------------- */
/*  Support tickets                                                           */
/* -------------------------------------------------------------------------- */

export async function replyTicketAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin("/admin/support");

  const ticketId = String(formData.get("ticketId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!ticketId || !message) {
    fail("A reply message is required.");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("reply_support_ticket", {
    p_ticket_id: ticketId,
    p_message: message,
    p_status: status || null,
  });

  if (error) {
    fail(error.message);
  }

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
}

export async function setTicketStatusAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin("/admin/support");
  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!ticketId || !status) {
    return;
  }

  const supabase = await getSupabaseServerClient();
  await supabase.rpc("set_support_ticket_status", {
    p_ticket_id: ticketId,
    p_status: status,
  });

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
}

export async function deleteTicketAction(formData: FormData): Promise<void> {
  await requireSuperAdmin("/admin/support");
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) {
    return;
  }

  const supabase = await getSupabaseServerClient();
  await supabase.rpc("delete_support_ticket", { p_ticket_id: ticketId });

  revalidatePath("/admin/support");
  redirect("/admin/support");
}
