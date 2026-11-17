/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { resolveDashboardRange, type ResolvedRange } from "@/lib/db/ranges";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  isMissingSchemaError,
  reportMissingSchema,
} from "@/lib/db/schema-state";

export { resolveDashboardRange };
export type { ResolvedRange };

const PAGE_SIZE = 25;

function handleError(context: string, error: unknown): string {
  if (isMissingSchemaError(error)) {
    reportMissingSchema(context);
    return "The admin schema is not installed yet. Apply the latest migration to enable this module.";
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }

  return "Unknown error";
}

export async function isAdminSchemaAvailable(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("platform_admins").select("id").limit(1);
    if (error) {
      if (isMissingSchemaError(error)) {
        reportMissingSchema("platform_admins");
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Overview                                                                  */
/* -------------------------------------------------------------------------- */

export type PlatformOverview = {
  available: boolean;
  error?: string;
  overview: Record<string, number>;
  series: Array<Record<string, unknown>>;
  distribution: Record<string, unknown>;
  aiUsage: Record<string, unknown>;
};

export async function getPlatformOverview(
  range: ResolvedRange,
): Promise<PlatformOverview> {
  const supabase = await getSupabaseServerClient();
  const bucket =
    range.bucket === "month" ? "month" : range.bucket === "week" ? "week" : "day";

  const [overviewRes, seriesRes, distributionRes, aiRes] = await Promise.all([
    supabase.rpc("get_platform_overview", {
      p_from: range.from,
      p_to: range.to,
    }),
    supabase.rpc("get_platform_series", {
      p_from: range.from,
      p_to: range.to,
      p_bucket: bucket,
    }),
    supabase.rpc("get_platform_distribution"),
    supabase.rpc("get_platform_ai_usage", {
      p_from: range.from,
      p_to: range.to,
    }),
  ]);

  const firstError =
    overviewRes.error || seriesRes.error || distributionRes.error || aiRes.error;

  if (firstError) {
    return {
      available: false,
      error: handleError("platform overview", firstError),
      overview: {},
      series: [],
      distribution: {},
      aiUsage: {},
    };
  }

  return {
    available: true,
    overview: (overviewRes.data ?? {}) as Record<string, number>,
    series: Array.isArray(seriesRes.data) ? (seriesRes.data as Array<Record<string, unknown>>) : [],
    distribution: (distributionRes.data ?? {}) as Record<string, unknown>,
    aiUsage: (aiRes.data ?? {}) as Record<string, unknown>,
  };
}

/* -------------------------------------------------------------------------- */
/*  Merchants                                                                 */
/* -------------------------------------------------------------------------- */

export type AdminMerchant = {
  id: string;
  name: string;
  slug: string;
  category: string;
  currency: string;
  isPublic: boolean;
  adminStatus: string;
  suspendedReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
  owner: { id: string; email: string; fullName: string } | null;
  subscription: {
    plan: string;
    status: string;
    price: number;
    currency: string;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
  } | null;
  productCount: number;
  orderCount: number;
};

export type MerchantListResult = {
  available: boolean;
  error?: string;
  merchants: AdminMerchant[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getAdminMerchants(input: {
  query?: string;
  status?: string;
  page?: number;
}): Promise<MerchantListResult> {
  const page = Math.max(Number(input.page ?? 1) || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const supabase = await getSupabaseServerClient();
    let builder = supabase
      .from("businesses")
      .select(
        "id, name, slug, category, currency, is_public, admin_status, suspended_reason, suspended_at, created_at, owner:profiles!owner_id(id, email, full_name), subscription:business_subscriptions(plan, status, price, currency, current_period_end, trial_ends_at), products(count), orders(count)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.query) {
      const q = input.query.replace(/[,()*%'"\\]/g, " ").trim();
      if (q) {
        builder = builder.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
      }
    }

    if (input.status && input.status !== "all") {
      builder = builder.eq("admin_status", input.status);
    }

    const { data, error, count } = await builder;

    if (error) {
      return {
        available: false,
        error: handleError("businesses", error),
        merchants: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
        pageCount: 1,
      };
    }

    const merchants: AdminMerchant[] = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      currency: row.currency,
      isPublic: row.is_public,
      adminStatus: row.admin_status,
      suspendedReason: row.suspended_reason,
      suspendedAt: row.suspended_at,
      createdAt: row.created_at,
      owner: row.owner
        ? {
            id: row.owner.id,
            email: row.owner.email,
            fullName: row.owner.full_name,
          }
        : null,
      subscription: row.subscription
        ? {
            plan: row.subscription.plan,
            status: row.subscription.status,
            price: Number(row.subscription.price ?? 0),
            currency: row.subscription.currency,
            currentPeriodEnd: row.subscription.current_period_end,
            trialEndsAt: row.subscription.trial_ends_at,
          }
        : null,
      productCount: Number(row.products?.[0]?.count ?? 0),
      orderCount: Number(row.orders?.[0]?.count ?? 0),
    }));

    const total = count ?? merchants.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      available: true,
      merchants,
      total,
      page,
      pageSize: PAGE_SIZE,
      pageCount,
    };
  } catch (error) {
    return {
      available: false,
      error: handleError("businesses", error),
      merchants: [],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      pageCount: 1,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Users                                                                     */
/* -------------------------------------------------------------------------- */

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
  adminRole: string | null;
};

export type UserListResult = {
  available: boolean;
  error?: string;
  users: AdminUser[];
  total: number;
};

export async function getAdminUsers(input: {
  query?: string;
  roleFilter?: string;
}): Promise<UserListResult> {
  try {
    const supabase = await getSupabaseServerClient();
    let builder = supabase
      .from("profiles")
      .select("id, email, full_name, phone, created_at, platform_admin:platform_admins(role)")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (input.query) {
      const q = input.query.replace(/[,()*%'"\\]/g, " ").trim();
      if (q) {
        builder = builder.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
      }
    }

    const { data, error } = await builder;

    if (error) {
      return {
        available: false,
        error: handleError("profiles", error),
        users: [],
        total: 0,
      };
    }

    let users: AdminUser[] = (data ?? []).map((row: any) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      createdAt: row.created_at,
      adminRole: row.platform_admin?.[0]?.role ?? row.platform_admin?.role ?? null,
    }));

    if (input.roleFilter && input.roleFilter !== "all") {
      if (input.roleFilter === "admin") {
        users = users.filter((user) => user.adminRole !== null);
      } else if (input.roleFilter === "non-admin") {
        users = users.filter((user) => user.adminRole === null);
      } else {
        users = users.filter((user) => user.adminRole === input.roleFilter);
      }
    }

    return { available: true, users, total: users.length };
  } catch (error) {
    return {
      available: false,
      error: handleError("profiles", error),
      users: [],
      total: 0,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

export type AdminProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  status: string;
  deletedAt: string | null;
  createdAt: string;
  business: { id: string; name: string; slug: string } | null;
};

export type ProductListResult = {
  available: boolean;
  error?: string;
  products: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getAdminProducts(input: {
  query?: string;
  status?: string;
  page?: number;
}): Promise<ProductListResult> {
  const page = Math.max(Number(input.page ?? 1) || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const supabase = await getSupabaseServerClient();
    let builder = supabase
      .from("products")
      .select(
        "id, name, sku, price, stock_quantity, status, deleted_at, created_at, business:businesses(id, name, slug)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.query) {
      const q = input.query.replace(/[,()*%'"\\]/g, " ").trim();
      if (q) {
        builder = builder.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
      }
    }

    if (input.status && input.status !== "all") {
      if (input.status === "deleted") {
        builder = builder.not("deleted_at", "is", null);
      } else {
        builder = builder.eq("status", input.status);
      }
    }

    const { data, error, count } = await builder;

    if (error) {
      return {
        available: false,
        error: handleError("products", error),
        products: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
        pageCount: 1,
      };
    }

    const products: AdminProduct[] = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      price: Number(row.price ?? 0),
      stockQuantity: Number(row.stock_quantity ?? 0),
      status: row.status,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      business: row.business
        ? {
            id: row.business.id,
            name: row.business.name,
            slug: row.business.slug,
          }
        : null,
    }));

    const total = count ?? products.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      available: true,
      products,
      total,
      page,
      pageSize: PAGE_SIZE,
      pageCount,
    };
  } catch (error) {
    return {
      available: false,
      error: handleError("products", error),
      products: [],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      pageCount: 1,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                    */
/* -------------------------------------------------------------------------- */

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  total: number;
  placedAt: string;
  business: { id: string; name: string; slug: string } | null;
  customerName: string | null;
};

export type OrderListResult = {
  available: boolean;
  error?: string;
  orders: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getAdminOrders(input: {
  query?: string;
  status?: string;
  payment?: string;
  page?: number;
}): Promise<OrderListResult> {
  const page = Math.max(Number(input.page ?? 1) || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const supabase = await getSupabaseServerClient();
    let builder = supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, currency, total, placed_at, business:businesses(id, name, slug), customer:customers(name)",
        { count: "exact" },
      )
      .order("placed_at", { ascending: false })
      .range(from, to);

    if (input.query) {
      const q = input.query.replace(/[,()*%'"\\]/g, " ").trim();
      if (q) {
        builder = builder.ilike("order_number", `%${q}%`);
      }
    }

    if (input.status && input.status !== "all") {
      builder = builder.eq("status", input.status);
    }

    if (input.payment && input.payment !== "all") {
      builder = builder.eq("payment_status", input.payment);
    }

    const { data, error, count } = await builder;

    if (error) {
      return {
        available: false,
        error: handleError("orders", error),
        orders: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
        pageCount: 1,
      };
    }

    const orders: AdminOrder[] = (data ?? []).map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      currency: row.currency,
      total: Number(row.total ?? 0),
      placedAt: row.placed_at,
      business: row.business
        ? {
            id: row.business.id,
            name: row.business.name,
            slug: row.business.slug,
          }
        : null,
      customerName: row.customer?.name ?? null,
    }));

    const total = count ?? orders.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      available: true,
      orders,
      total,
      page,
      pageSize: PAGE_SIZE,
      pageCount,
    };
  } catch (error) {
    return {
      available: false,
      error: handleError("orders", error),
      orders: [],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      pageCount: 1,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Subscriptions                                                             */
/* -------------------------------------------------------------------------- */

export type AdminSubscription = {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  plan: string;
  status: string;
  billingCycle: string;
  price: number;
  currency: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

export type SubscriptionListResult = {
  available: boolean;
  error?: string;
  subscriptions: AdminSubscription[];
  total: number;
};

export async function getAdminSubscriptions(): Promise<SubscriptionListResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("business_subscriptions")
      .select(
        "id, business_id, plan, status, billing_cycle, price, currency, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, created_at, business:businesses(name, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return {
        available: false,
        error: handleError("business_subscriptions", error),
        subscriptions: [],
        total: 0,
      };
    }

    const subscriptions: AdminSubscription[] = (data ?? []).map((row: any) => ({
      id: row.id,
      businessId: row.business_id,
      businessName: row.business?.name ?? "Unknown",
      businessSlug: row.business?.slug ?? "",
      plan: row.plan,
      status: row.status,
      billingCycle: row.billing_cycle,
      price: Number(row.price ?? 0),
      currency: row.currency,
      trialEndsAt: row.trial_ends_at,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      createdAt: row.created_at,
    }));

    return { available: true, subscriptions, total: subscriptions.length };
  } catch (error) {
    return {
      available: false,
      error: handleError("business_subscriptions", error),
      subscriptions: [],
      total: 0,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  AI generations                                                            */
/* -------------------------------------------------------------------------- */

export type AdminAiGeneration = {
  id: string;
  kind: string;
  prompt: string;
  response: string | null;
  model: string | null;
  tokensUsed: number;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  business: { id: string; name: string; slug: string } | null;
  user: { id: string; email: string; fullName: string } | null;
};

export type AiListResult = {
  available: boolean;
  error?: string;
  generations: AdminAiGeneration[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getAdminAiGenerations(input: {
  query?: string;
  status?: string;
  kind?: string;
  page?: number;
}): Promise<AiListResult> {
  const page = Math.max(Number(input.page ?? 1) || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const supabase = await getSupabaseServerClient();
    let builder = supabase
      .from("ai_generations")
      .select(
        "id, kind, prompt, response, model, tokens_used, status, error_message, created_at, business:businesses(id, name, slug), user:profiles(id, email, full_name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.status && input.status !== "all") {
      builder = builder.eq("status", input.status);
    }

    if (input.kind && input.kind !== "all") {
      builder = builder.eq("kind", input.kind);
    }

    const { data, error, count } = await builder;

    if (error) {
      return {
        available: false,
        error: handleError("ai_generations", error),
        generations: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
        pageCount: 1,
      };
    }

    let generations: AdminAiGeneration[] = (data ?? []).map((row: any) => ({
      id: row.id,
      kind: row.kind,
      prompt: row.prompt,
      response: row.response,
      model: row.model,
      tokensUsed: Number(row.tokens_used ?? 0),
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      business: row.business
        ? {
            id: row.business.id,
            name: row.business.name,
            slug: row.business.slug,
          }
        : null,
      user: row.user
        ? {
            id: row.user.id,
            email: row.user.email,
            fullName: row.user.full_name,
          }
        : null,
    }));

    if (input.query) {
      const q = input.query.toLowerCase();
      generations = generations.filter(
        (generation) =>
          generation.prompt.toLowerCase().includes(q) ||
          generation.business?.name.toLowerCase().includes(q) ||
          generation.user?.email.toLowerCase().includes(q),
      );
    }

    const total = count ?? generations.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      available: true,
      generations,
      total,
      page,
      pageSize: PAGE_SIZE,
      pageCount,
    };
  } catch (error) {
    return {
      available: false,
      error: handleError("ai_generations", error),
      generations: [],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      pageCount: 1,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Announcements                                                             */
/* -------------------------------------------------------------------------- */

export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  tone: string;
  audience: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  createdBy: string | null;
};

export async function getAdminAnnouncements(): Promise<{
  available: boolean;
  error?: string;
  announcements: AdminAnnouncement[];
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("platform_announcements")
      .select("id, title, body, tone, audience, published, published_at, created_at, created_by, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return {
        available: false,
        error: handleError("platform_announcements", error),
        announcements: [],
      };
    }

    const announcements: AdminAnnouncement[] = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      tone: row.tone,
      audience: row.audience,
      published: row.published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      createdBy: row.profiles?.full_name ?? null,
    }));

    return { available: true, announcements };
  } catch (error) {
    return {
      available: false,
      error: handleError("platform_announcements", error),
      announcements: [],
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Support tickets                                                           */
/* -------------------------------------------------------------------------- */

export type AdminTicket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  lastMessageAt: string | null;
  createdAt: string;
  business: { id: string; name: string; slug: string } | null;
  requester: { id: string; email: string; fullName: string } | null;
  messageCount: number;
};

export type AdminTicketMessage = {
  id: string;
  authorId: string;
  authorType: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type TicketListResult = {
  available: boolean;
  error?: string;
  tickets: AdminTicket[];
  total: number;
};

export async function getAdminTickets(input: {
  status?: string;
  priority?: string;
}): Promise<TicketListResult> {
  try {
    const supabase = await getSupabaseServerClient();
    let builder = supabase
      .from("support_tickets")
      .select(
        "id, subject, category, priority, status, last_message_at, created_at, business:businesses(id, name, slug), profile:profiles(id, email, full_name), support_ticket_messages(count)",
      )
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(500);

    if (input.status && input.status !== "all") {
      builder = builder.eq("status", input.status);
    }

    if (input.priority && input.priority !== "all") {
      builder = builder.eq("priority", input.priority);
    }

    const { data, error } = await builder;

    if (error) {
      return {
        available: false,
        error: handleError("support_tickets", error),
        tickets: [],
        total: 0,
      };
    }

    const tickets: AdminTicket[] = (data ?? []).map((row: any) => ({
      id: row.id,
      subject: row.subject,
      category: row.category,
      priority: row.priority,
      status: row.status,
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
      business: row.business
        ? {
            id: row.business.id,
            name: row.business.name,
            slug: row.business.slug,
          }
        : null,
      requester: row.profile
        ? {
            id: row.profile.id,
            email: row.profile.email,
            fullName: row.profile.full_name,
          }
        : null,
      messageCount: Number(row.support_ticket_messages?.[0]?.count ?? 0),
    }));

    return { available: true, tickets, total: tickets.length };
  } catch (error) {
    return {
      available: false,
      error: handleError("support_tickets", error),
      tickets: [],
      total: 0,
    };
  }
}

export async function getAdminTicket(id: string): Promise<{
  available: boolean;
  error?: string;
  ticket: AdminTicket | null;
  messages: AdminTicketMessage[];
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: ticketData, error: ticketError } = await supabase
      .from("support_tickets")
      .select(
        "id, subject, category, priority, status, last_message_at, created_at, business:businesses(id, name, slug), profile:profiles(id, email, full_name)",
      )
      .eq("id", id)
      .maybeSingle();

    if (ticketError || !ticketData) {
      return {
        available: false,
        error: ticketError
          ? handleError("support_tickets", ticketError)
          : "Ticket not found.",
        ticket: null,
        messages: [],
      };
    }

    const { data: messageData, error: messageError } = await supabase
      .from("support_ticket_messages")
      .select("id, author_id, author_type, body, created_at, profiles(full_name, email)")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    if (messageError) {
      return {
        available: false,
        error: handleError("support_ticket_messages", messageError),
        ticket: null,
        messages: [],
      };
    }

    const ticket: AdminTicket = {
      id: ticketData.id,
      subject: ticketData.subject,
      category: ticketData.category,
      priority: ticketData.priority,
      status: ticketData.status,
      lastMessageAt: ticketData.last_message_at,
      createdAt: ticketData.created_at,
      business: (ticketData as any).business
        ? {
            id: (ticketData as any).business.id,
            name: (ticketData as any).business.name,
            slug: (ticketData as any).business.slug,
          }
        : null,
      requester: (ticketData as any).profile
        ? {
            id: (ticketData as any).profile.id,
            email: (ticketData as any).profile.email,
            fullName: (ticketData as any).profile.full_name,
          }
        : null,
      messageCount: 0,
    };

    const messages: AdminTicketMessage[] = (messageData ?? []).map((row: any) => ({
      id: row.id,
      authorId: row.author_id,
      authorType: row.author_type,
      authorName: row.profiles?.full_name ?? row.profiles?.email ?? "Unknown",
      body: row.body,
      createdAt: row.created_at,
    }));

    return { available: true, ticket, messages };
  } catch (error) {
    return {
      available: false,
      error: handleError("support_tickets", error),
      ticket: null,
      messages: [],
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Audit log                                                                 */
/* -------------------------------------------------------------------------- */

export type AdminAuditEntry = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AuditListResult = {
  available: boolean;
  error?: string;
  entries: AdminAuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getAdminAuditLog(input: {
  action?: string;
  entityType?: string;
  page?: number;
}): Promise<AuditListResult> {
  const page = Math.max(Number(input.page ?? 1) || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const supabase = await getSupabaseServerClient();
    let builder = supabase
      .from("platform_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.action && input.action !== "all") {
      builder = builder.eq("action", input.action);
    }

    if (input.entityType && input.entityType !== "all") {
      builder = builder.eq("entity_type", input.entityType);
    }

    const { data, error, count } = await builder;

    if (error) {
      return {
        available: false,
        error: handleError("platform_audit_logs", error),
        entries: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
        pageCount: 1,
      };
    }

    const entries: AdminAuditEntry[] = (data ?? []).map((row: any) => ({
      id: row.id,
      actorId: row.actor_id,
      actorEmail: row.actor_email,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.created_at,
    }));

    const total = count ?? entries.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      available: true,
      entries,
      total,
      page,
      pageSize: PAGE_SIZE,
      pageCount,
    };
  } catch (error) {
    return {
      available: false,
      error: handleError("platform_audit_logs", error),
      entries: [],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      pageCount: 1,
    };
  }
}

export { PAGE_SIZE };
