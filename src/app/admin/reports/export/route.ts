/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getPlatformAdmin } from "@/lib/admin/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/admin/csv";

export async function GET(request: Request) {
  const admin = await getPlatformAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";

  const supabase = await getSupabaseServerClient();

  let csv = "";
  const filename = `tuma-${type}.csv`;

  switch (type) {
    case "merchants": {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, slug, category, currency, is_public, admin_status, created_at, owner:profiles!owner_id(email, full_name)")
        .order("created_at", { ascending: false });
      csv = toCsv(
        ["id", "name", "slug", "category", "currency", "is_public", "admin_status", "created_at", "owner_email", "owner_name"],
        (data ?? []).map((row: any) => [
          row.id,
          row.name,
          row.slug,
          row.category,
          row.currency,
          row.is_public,
          row.admin_status,
          row.created_at,
          row.owner?.email,
          row.owner?.full_name,
        ]),
      );
      break;
    }
    case "users": {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, created_at, platform_admin:platform_admins(role)")
        .order("created_at", { ascending: false });
      csv = toCsv(
        ["id", "email", "full_name", "phone", "created_at", "admin_role"],
        (data ?? []).map((row: any) => [
          row.id,
          row.email,
          row.full_name,
          row.phone,
          row.created_at,
          row.platform_admin?.[0]?.role ?? row.platform_admin?.role ?? "",
        ]),
      );
      break;
    }
    case "products": {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, price, stock_quantity, status, deleted_at, created_at, business:businesses(name, slug)")
        .order("created_at", { ascending: false });
      csv = toCsv(
        ["id", "name", "sku", "price", "stock_quantity", "status", "deleted_at", "created_at", "business", "business_slug"],
        (data ?? []).map((row: any) => [
          row.id,
          row.name,
          row.sku,
          row.price,
          row.stock_quantity,
          row.status,
          row.deleted_at,
          row.created_at,
          row.business?.name,
          row.business?.slug,
        ]),
      );
      break;
    }
    case "orders": {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, currency, subtotal, total, placed_at, business:businesses(name, slug), customer:customers(name)")
        .order("placed_at", { ascending: false });
      csv = toCsv(
        ["id", "order_number", "status", "payment_status", "currency", "subtotal", "total", "placed_at", "business", "customer"],
        (data ?? []).map((row: any) => [
          row.id,
          row.order_number,
          row.status,
          row.payment_status,
          row.currency,
          row.subtotal,
          row.total,
          row.placed_at,
          row.business?.name,
          row.customer?.name,
        ]),
      );
      break;
    }
    case "subscriptions": {
      const { data } = await supabase
        .from("business_subscriptions")
        .select("id, business_id, plan, status, billing_cycle, price, currency, trial_ends_at, current_period_start, current_period_end, created_at, business:businesses(name, slug)")
        .order("created_at", { ascending: false });
      csv = toCsv(
        ["id", "business", "business_slug", "plan", "status", "billing_cycle", "price", "currency", "trial_ends_at", "current_period_start", "current_period_end", "created_at"],
        (data ?? []).map((row: any) => [
          row.id,
          row.business?.name,
          row.business?.slug,
          row.plan,
          row.status,
          row.billing_cycle,
          row.price,
          row.currency,
          row.trial_ends_at,
          row.current_period_start,
          row.current_period_end,
          row.created_at,
        ]),
      );
      break;
    }
    case "ai": {
      const { data } = await supabase
        .from("ai_generations")
        .select("id, kind, status, tokens_used, model, created_at, business:businesses(name, slug), user:profiles(email)")
        .order("created_at", { ascending: false });
      csv = toCsv(
        ["id", "kind", "status", "tokens_used", "model", "created_at", "business", "user_email"],
        (data ?? []).map((row: any) => [
          row.id,
          row.kind,
          row.status,
          row.tokens_used,
          row.model,
          row.created_at,
          row.business?.name,
          row.user?.email,
        ]),
      );
      break;
    }
    case "tickets": {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, subject, category, priority, status, created_at, last_message_at, business:businesses(name, slug), profile:profiles(email, full_name)")
        .order("created_at", { ascending: false });
      csv = toCsv(
        ["id", "subject", "category", "priority", "status", "created_at", "last_message_at", "business", "requester_email", "requester_name"],
        (data ?? []).map((row: any) => [
          row.id,
          row.subject,
          row.category,
          row.priority,
          row.status,
          row.created_at,
          row.last_message_at,
          row.business?.name,
          row.profile?.email,
          row.profile?.full_name,
        ]),
      );
      break;
    }
    case "audit": {
      const { data } = await supabase
        .from("platform_audit_logs")
        .select("*")
        .order("created_at", { ascending: false });
      csv = toCsv(
        ["id", "actor_email", "action", "entity_type", "entity_id", "target_type", "target_id", "metadata", "created_at"],
        (data ?? []).map((row: any) => [
          row.id,
          row.actor_email,
          row.action,
          row.entity_type,
          row.entity_id,
          row.target_type,
          row.target_id,
          JSON.stringify(row.metadata ?? {}),
          row.created_at,
        ]),
      );
      break;
    }
    default:
      return new NextResponse("Unknown export type", { status: 400 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
