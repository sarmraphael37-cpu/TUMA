import "server-only";

import { getOwnedBusiness } from "@/lib/auth/server";
import { isMissingColumnError } from "@/lib/db/catalogue";
import { resolveDashboardRange, type ResolvedRange } from "@/lib/db/ranges";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/types/database";

/**
 * The merchant order data layer.
 *
 * Every query is scoped by the business that belongs to the signed-in merchant
 * (`getOwnedBusiness`) and by row level security. The browser never supplies a
 * business id, so a merchant can only ever read and change their own orders.
 */

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at?: string;
};

export type OrderCustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export type OrderEventRow = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  from_payment_status: string | null;
  to_payment_status: string | null;
  note: string | null;
  actor_id: string | null;
  created_at: string;
};

export type OrderHistoryEntry = OrderEventRow & {
  actor_name: string | null;
};

export type OrderSummaryRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  placed_at: string;
  created_at: string;
  updated_at: string;
  payment_verified_at: string | null;
  payment_note: string | null;
  public_token: string | null;
  customer: OrderCustomerRow | null;
  items: OrderItemRow[];
  item_count: number;
};

export type OrderDetail = OrderSummaryRow & {
  payment_verified_by: string | null;
  verified_by_name: string | null;
  history: OrderHistoryEntry[];
  history_audited: boolean;
  capabilities: OrderCapabilities;
};

export type OrderStats = {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  completed: number;
  cancelled: number;
  unpaid: number;
  awaitingVerification: number;
  paid: number;
  rejected: number;
  paidRevenue: number;
  invoiced: number;
};

export type OrderCapabilities = {
  /** `order_events` exists, so every change is audited. */
  audit: boolean;
  /** `payment_verified_at` exists, so verification can be recorded. */
  verification: boolean;
  /** The extended statuses (`completed`, `awaiting_verification`, `rejected`) exist. */
  extendedStatuses: boolean;
};

export type OrderFilters = {
  query?: string;
  status?: OrderStatus | "all";
  payment?: PaymentStatus | "all";
  range: ResolvedRange;
  page: number;
  pageSize?: number;
};

export type OrdersResult = {
  orders: OrderSummaryRow[];
  total: number;
  page: number;
  pageCount: number;
  stats: OrderStats;
  capabilities: OrderCapabilities;
  errors: { orders?: string; stats?: string };
};

export const ORDERS_PAGE_SIZE = 12;

const EMPTY_STATS: OrderStats = {
  total: 0,
  pending: 0,
  confirmed: 0,
  processing: 0,
  completed: 0,
  cancelled: 0,
  unpaid: 0,
  awaitingVerification: 0,
  paid: 0,
  rejected: 0,
  paidRevenue: 0,
  invoiced: 0,
};

const MAX_FALLBACK_ROWS = 5000;

/* -------------------------------------------------------------------------- */
/*  Selects                                                                    */
/* -------------------------------------------------------------------------- */

const ORDER_COLUMNS = [
  "id",
  "order_number",
  "status",
  "payment_status",
  "currency",
  "subtotal",
  "discount",
  "tax",
  "total",
  "notes",
  "placed_at",
  "created_at",
  "updated_at",
  "payment_verified_at",
  "payment_note",
  "public_token",
  "customers(id, name, email, phone, address, notes)",
  "order_items(id, product_id, product_name, quantity, unit_price, line_total, created_at)",
].join(", ");

const ORDER_COLUMNS_LEGACY = [
  "id",
  "order_number",
  "status",
  "payment_status",
  "currency",
  "subtotal",
  "discount",
  "tax",
  "total",
  "notes",
  "placed_at",
  "created_at",
  "updated_at",
  "customers(id, name, email, phone, address, notes)",
  "order_items(id, product_id, product_name, quantity, unit_price, line_total, created_at)",
].join(", ");

/* -------------------------------------------------------------------------- */
/*  Range                                                                      */
/* -------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

/** `all` opens the window to the first order; the other keys reuse the presets. */
export function resolveOrderRange(input: {
  range?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  if (input.range === "all") {
    const now = new Date();

    return {
      key: "all",
      label: "All time",
      from: new Date(0).toISOString(),
      to: now.toISOString(),
      days: Math.max(
        1,
        Math.round((now.getTime() - new Date(0).getTime()) / DAY_MS),
      ),
      bucket: "month",
    };
  }

  return resolveDashboardRange(input);
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Strips the characters PostgREST treats as syntax from a search term. */
function sanitiseSearch(value: string) {
  return value.replace(/[,()*%'"\\]/g, " ").trim().slice(0, 60);
}

type RawOrder = Omit<OrderSummaryRow, "customer" | "items" | "item_count"> & {
  customers: OrderCustomerRow | null;
  order_items: OrderItemRow[] | null;
};

function normaliseOrder(row: RawOrder): OrderSummaryRow {
  const items = (row.order_items ?? []).map((item) => ({
    ...item,
    quantity: Number(item.quantity ?? 0),
    unit_price: Number(item.unit_price ?? 0),
    line_total: Number(item.line_total ?? 0),
  }));

  return {
    ...row,
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    public_token: row.public_token ?? null,
    customer: row.customers ?? null,
    items,
    item_count: items.reduce((total, item) => total + item.quantity, 0),
  };
}

function countByStatuses(
  rows: Array<{ status: string; payment_status: string; total: number }>,
): OrderStats {
  const stats: OrderStats = { ...EMPTY_STATS };

  for (const row of rows) {
    const total = Number(row.total ?? 0);
    stats.total += 1;

    switch (row.status) {
      case "pending":
        stats.pending += 1;
        break;
      case "confirmed":
        stats.confirmed += 1;
        break;
      case "processing":
        stats.processing += 1;
        break;
      case "completed":
      case "delivered":
        stats.completed += 1;
        break;
      case "cancelled":
        stats.cancelled += 1;
        break;
      default:
        break;
    }

    if (row.status !== "cancelled") {
      stats.invoiced += total;
    }

    switch (row.payment_status) {
      case "unpaid":
        stats.unpaid += 1;
        break;
      case "awaiting_verification":
        stats.awaitingVerification += 1;
        break;
      case "paid":
        stats.paid += 1;
        stats.paidRevenue += total;
        break;
      case "rejected":
        stats.rejected += 1;
        break;
      default:
        break;
    }
  }

  return stats;
}

/* -------------------------------------------------------------------------- */
/*  Capabilities                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Detects whether the order management migration has been applied.
 *
 * One probe is enough: the verification columns, the audit table and the
 * aggregate function ship in the same migration.
 */
export async function getOrderCapabilities(): Promise<OrderCapabilities> {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("orders")
    .select("payment_verified_at, order_events(id)")
    .limit(1);

  if (error) {
    return { audit: false, verification: false, extendedStatuses: false };
  }

  return { audit: true, verification: true, extendedStatuses: true };
}

/* -------------------------------------------------------------------------- */
/*  Stats                                                                      */
/* -------------------------------------------------------------------------- */

/** Aggregates the orders of the window behind the overview tiles. */
export async function getOrderStats(
  range: ResolvedRange,
): Promise<{ stats: OrderStats; error?: string }> {
  const supabase = await getSupabaseServerClient();
  const business = await getOwnedBusiness();

  if (!business) {
    return { stats: { ...EMPTY_STATS } };
  }

  const { data, error } = await supabase.rpc("get_order_stats", {
    p_from: range.from,
    p_to: range.to,
  });

  if (!error && data) {
    const payload = (typeof data === "string" ? JSON.parse(data) : data) as
      | Record<string, unknown>
      | null;

    if (payload) {
      return {
        stats: {
          total: Number(payload.total ?? 0),
          pending: Number(payload.pending ?? 0),
          confirmed: Number(payload.confirmed ?? 0),
          processing: Number(payload.processing ?? 0),
          completed: Number(payload.completed ?? 0),
          cancelled: Number(payload.cancelled ?? 0),
          unpaid: Number(payload.unpaid ?? 0),
          awaitingVerification: Number(payload.awaitingVerification ?? 0),
          paid: Number(payload.paid ?? 0),
          rejected: Number(payload.rejected ?? 0),
          paidRevenue: Number(payload.paidRevenue ?? 0),
          invoiced: Number(payload.invoiced ?? 0),
        },
      };
    }
  }

  // The aggregate function is part of the order management migration. Until it
  // is applied the same numbers are derived from the rows themselves.
  const { data: rows, error: rowsError } = await supabase
    .from("orders")
    .select("status, payment_status, total")
    .eq("business_id", business.id)
    .gte("placed_at", range.from)
    .lte("placed_at", range.to)
    .limit(MAX_FALLBACK_ROWS);

  if (rowsError) {
    return {
      stats: { ...EMPTY_STATS },
      error: "We could not load the order overview.",
    };
  }

  return { stats: countByStatuses((rows ?? []) as never) };
}

/* -------------------------------------------------------------------------- */
/*  List                                                                       */
/* -------------------------------------------------------------------------- */

export async function getOrders(filters: OrderFilters): Promise<OrdersResult> {
  const supabase = await getSupabaseServerClient();
  const business = await getOwnedBusiness();
  const pageSize = filters.pageSize ?? ORDERS_PAGE_SIZE;

  const empty: OrdersResult = {
    orders: [],
    total: 0,
    page: 1,
    pageCount: 1,
    stats: { ...EMPTY_STATS },
    capabilities: { audit: false, verification: false, extendedStatuses: false },
    errors: {},
  };

  if (!business) {
    return empty;
  }

  const [capabilities, statsResult] = await Promise.all([
    getOrderCapabilities(),
    getOrderStats(filters.range),
  ]);

  // A filter for a status the database does not know yet can never match a
  // row. Answering it locally keeps the list usable before the migration.
  if (
    !capabilities.extendedStatuses &&
    (filters.payment === "awaiting_verification" ||
      filters.payment === "rejected")
  ) {
    return {
      ...empty,
      capabilities,
      stats: statsResult.stats,
      errors: statsResult.error ? { stats: statsResult.error } : {},
    };
  }

  const buildQuery = (columns: string) => {
    let query = supabase
      .from("orders")
      .select(columns, { count: "exact" })
      .eq("business_id", business.id)
      .gte("placed_at", filters.range.from)
      .lte("placed_at", filters.range.to);

    const search = filters.query ? sanitiseSearch(filters.query) : "";

    if (search) {
      query = query.ilike("order_number", `%${search}%`);
    }

    if (filters.status && filters.status !== "all") {
      // `delivered` is the historical spelling of `completed`.
      if (filters.status === "completed") {
        query = query.in(
          "status",
          capabilities.extendedStatuses
            ? ["completed", "delivered"]
            : ["delivered"],
        );
      } else {
        query = query.eq("status", filters.status);
      }
    }

    if (filters.payment && filters.payment !== "all") {
      query = query.eq("payment_status", filters.payment);
    }

    return query;
  };

  const page = Math.max(1, filters.page);
  const offset = (page - 1) * pageSize;

  let result = await buildQuery(ORDER_COLUMNS)
    .order("placed_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (result.error && isMissingColumnError(result.error.message)) {
    result = await buildQuery(ORDER_COLUMNS_LEGACY)
      .order("placed_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
  }

  if (result.error) {
    return {
      ...empty,
      capabilities,
      stats: statsResult.stats,
      errors: {
        orders: "We could not load your orders.",
        stats: statsResult.error,
      },
    };
  }

  const rows = ((result.data ?? []) as unknown as RawOrder[]).map(normaliseOrder);
  const total = result.count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    orders: rows,
    total,
    page: Math.min(page, pageCount),
    pageCount,
    stats: statsResult.stats,
    capabilities,
    errors: statsResult.error ? { stats: statsResult.error } : {},
  };
}

/* -------------------------------------------------------------------------- */
/*  Detail                                                                     */
/* -------------------------------------------------------------------------- */

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const supabase = await getSupabaseServerClient();
  const business = await getOwnedBusiness();

  if (!business) {
    return null;
  }

  const capabilities = await getOrderCapabilities();

  let result = await supabase
    .from("orders")
    .select(`${ORDER_COLUMNS}, payment_verified_by`)
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  // The three optional groups arrived in separate migrations. Fall back one
  // group at a time so a workspace with the storefront but not the order
  // migration keeps its public order link.
  if (result.error && isMissingColumnError(result.error.message)) {
    result = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle();
  }

  if (result.error && isMissingColumnError(result.error.message)) {
    result = await supabase
      .from("orders")
      .select(ORDER_COLUMNS_LEGACY)
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle();
  }

  if (result.error || !result.data) {
    return null;
  }

  const raw = result.data as unknown as RawOrder & {
    payment_verified_by?: string | null;
  };
  const order = normaliseOrder(raw) as OrderDetail;

  order.payment_verified_by = raw.payment_verified_by ?? null;
  order.verified_by_name = null;
  order.history = [];
  order.history_audited = capabilities.audit;
  order.capabilities = capabilities;

  if (capabilities.audit) {
    const { data: events } = await supabase
      .from("order_events")
      .select(
        "id, event_type, from_status, to_status, from_payment_status, to_payment_status, note, actor_id, created_at",
      )
      .eq("order_id", id)
      .eq("business_id", business.id)
      .order("created_at", { ascending: true });

    const rows = (events ?? []) as unknown as OrderEventRow[];
    const actorIds = Array.from(
      new Set(
        rows
          .map((event) => event.actor_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const names = new Map<string, string>();

    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);

      for (const profile of profiles ?? []) {
        names.set(
          String(profile.id),
          String(profile.full_name ?? "A teammate"),
        );
      }
    }

    order.history = rows.map((event) => ({
      ...event,
      actor_name: event.actor_id ? names.get(event.actor_id) ?? null : null,
    }));

    if (order.payment_verified_by) {
      const { data: verifier } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", order.payment_verified_by)
        .maybeSingle();

      order.verified_by_name =
        (verifier?.full_name as string | undefined) ?? null;
    }
  }

  if (order.history.length === 0) {
    // Before the audit migration (or for a row inserted outside the trigger)
    // the opening entry is derived from the order itself. It is marked as not
    // audited by `history_audited`.
    order.history = [
      {
        id: `${order.id}-placed`,
        event_type: "order_placed",
        from_status: null,
        to_status: order.status,
        from_payment_status: null,
        to_payment_status: order.payment_status,
        note: null,
        actor_id: null,
        created_at: order.placed_at,
        actor_name: null,
      },
    ];
  }

  return order;
}
