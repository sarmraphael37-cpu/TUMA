import "server-only";

import {
  type ResolvedRange,
} from "@/lib/db/ranges";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from "@/types/database";

export {
  DASHBOARD_RANGES,
  resolveDashboardRange,
  type RangeKey,
  type ResolvedRange,
} from "@/lib/db/ranges";

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
};

export type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  placed_at: string;
  customers: { name: string } | null;
  order_items: OrderItemRow[];
};

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  status: ProductStatus;
  deleted_at: string | null;
  created_at: string;
};

export type DashboardMetrics = {
  revenue: number;
  invoiced: number;
  orders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  products: number;
  archivedProducts: number;
  lowStock: number;
  customers: number;
  averageOrderValue: number;
};

export type SeriesPoint = {
  label: string;
  revenue: number;
  orders: number;
  previousRevenue: number;
};

export type DistributionSlice = {
  status: OrderStatus;
  label: string;
  value: number;
  tone: "brand" | "info" | "success" | "warning" | "danger" | "neutral";
};

export type BestSeller = {
  key: string;
  name: string;
  units: number;
  revenue: number;
  sku: string | null;
  stock: number | null;
};

export type GrowthSummary = {
  revenueCurrent: number;
  revenuePrevious: number;
  revenueDelta: string | null;
  ordersCurrent: number;
  ordersPrevious: number;
  ordersDelta: string | null;
  customersCurrent: number;
  customersPrevious: number;
  customersDelta: string | null;
  averageOrderValue: number;
  averageOrderValueDelta: string | null;
  productsAdded: number;
};

export type DashboardSection = "orders" | "products" | "customers";

export type DashboardData = {
  range: ResolvedRange;
  metrics: DashboardMetrics;
  series: SeriesPoint[];
  distribution: DistributionSlice[];
  bestSellers: BestSeller[];
  recentOrders: OrderRow[];
  lowStock: ProductRow[];
  growth: GrowthSummary;
  truncated: boolean;
  errors: Partial<Record<DashboardSection, string>>;
};

/* -------------------------------------------------------------------------- */
/*  Range handling                                                             */
/* -------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  completed: "Completed",
  delivered: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const ORDER_STATUS_TONES: Record<
  OrderStatus,
  DistributionSlice["tone"]
> = {
  draft: "neutral",
  pending: "warning",
  confirmed: "info",
  processing: "brand",
  completed: "success",
  delivered: "success",
  cancelled: "danger",
  refunded: "neutral",
};

const COUNTED_STATUSES: OrderStatus[] = [
  "draft",
  "pending",
  "confirmed",
  "processing",
  "completed",
  "delivered",
  "cancelled",
  "refunded",
];

const PENDING_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing"];

function isCountable(order: OrderRow) {
  return order.status !== "cancelled" && order.status !== "refunded";
}

function isCollected(order: OrderRow) {
  return order.payment_status === "paid";
}

type Bucket = {
  key: string;
  start: number;
  end: number;
  label: string;
};

function buildBuckets(range: ResolvedRange): Bucket[] {
  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  const buckets: Bucket[] = [];

  if (range.bucket === "month") {
    const cursor = new Date(from);
    cursor.setUTCDate(1);

    while (cursor.getTime() <= to) {
      const start = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1),
      );
      const end = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
      );
      const label = new Intl.DateTimeFormat("en-GB", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(start);

      buckets.push({
        key: `${start.getUTCFullYear()}-${start.getUTCMonth()}`,
        start: start.getTime(),
        end: end.getTime() - 1,
        label,
      });

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return buckets;
  }

  const size = range.bucket === "week" ? 7 * DAY_MS : DAY_MS;
  const labelFormat = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  for (let start = from; start <= to; start += size) {
    const end = Math.min(start + size - 1, to);
    const label =
      range.bucket === "week"
        ? `w/c ${labelFormat.format(new Date(start))}`
        : labelFormat.format(new Date(start));

    buckets.push({
      key: String(start),
      start,
      end,
      label,
    });
  }

  return buckets;
}

function bucketKeyFor(order: OrderRow, range: ResolvedRange) {
  const placedAt = new Date(order.placed_at).getTime();

  if (range.bucket === "month") {
    const date = new Date(placedAt);
    return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
  }

  const size = range.bucket === "week" ? 7 * DAY_MS : DAY_MS;
  const from = new Date(range.from).getTime();
  const offset = Math.floor((placedAt - from) / size);

  return String(from + offset * size);
}

function percentageChange(current: number, previous: number) {
  if (!previous) {
    return null;
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const sign = change > 0 ? "+" : "";

  return `${sign}${change.toFixed(1)}%`;
}

function summarise(orders: OrderRow[]) {
  let revenue = 0;
  let invoiced = 0;
  let pendingOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;

  for (const order of orders) {
    const total = Number(order.total ?? 0);

    if (isCollected(order)) {
      revenue += total;
    }

    if (isCountable(order)) {
      invoiced += total;
    }

    if (PENDING_STATUSES.includes(order.status)) {
      pendingOrders += 1;
    }

    if (order.status === "completed" || order.status === "delivered") {
      completedOrders += 1;
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      cancelledOrders += 1;
    }
  }

  return {
    revenue,
    invoiced,
    orders: orders.length,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    averageOrderValue: orders.length ? invoiced / orders.length : 0,
  };
}

function buildBestSellers(
  orders: OrderRow[],
  products: ProductRow[],
): BestSeller[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const sellers = new Map<
    string,
    { key: string; name: string; units: number; revenue: number }
  >();

  for (const order of orders) {
    if (!isCountable(order)) {
      continue;
    }

    for (const item of order.order_items ?? []) {
      const key = item.product_id ?? `name:${item.product_name}`;
      const existing = sellers.get(key);

      if (existing) {
        existing.units += Number(item.quantity ?? 0);
        existing.revenue += Number(item.line_total ?? 0);
      } else {
        sellers.set(key, {
          key,
          name: item.product_name,
          units: Number(item.quantity ?? 0),
          revenue: Number(item.line_total ?? 0),
        });
      }
    }
  }

  return [...sellers.values()]
    .map((seller) => {
      const product = seller.key.startsWith("name:")
        ? null
        : productsById.get(seller.key);

      return {
        key: seller.key,
        name: seller.name,
        units: seller.units,
        revenue: seller.revenue,
        sku: product?.sku ?? null,
        stock: product?.stock_quantity ?? null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units);
}

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

const ORDER_FIELDS = [
  "id",
  "order_number",
  "status",
  "payment_status",
  "currency",
  "subtotal",
  "discount",
  "tax",
  "total",
  "placed_at",
  "customers(name)",
  "order_items(id, product_id, product_name, quantity, unit_price, line_total)",
].join(", ");

const PRODUCT_FIELDS = [
  "id",
  "name",
  "sku",
  "price",
  "cost",
  "stock_quantity",
  "low_stock_threshold",
  "status",
  "images",
  "deleted_at",
  "created_at",
].join(", ");

const MAX_ORDERS = 2000;
const MAX_PRODUCTS = 2000;

function sanitiseSearch(value: string) {
  return value.replace(/[,()*%'"\\]/g, " ").trim().slice(0, 60);
}

export type WorkspaceSearchResults = {
  query: string;
  products: ProductRow[];
  orders: OrderRow[];
  customers: { id: string; name: string; email: string | null; phone: string | null }[];
};

/**
 * Loads everything the dashboard needs. Every query is scoped by the
 * authenticated merchant (RLS + `businesses.owner_id`), and no number is ever
 * assumed: each metric is derived from the rows that come back.
 */
export async function getDashboardData(input: {
  range: ResolvedRange;
}): Promise<DashboardData> {
  const { range } = input;
  const supabase = await getSupabaseServerClient();

  const previousTo = new Date(new Date(range.from).getTime() - 1).toISOString();
  const previousFrom = new Date(
    new Date(range.from).getTime() - range.days * DAY_MS,
  ).toISOString();

  const [ordersResult, previousResult, productsResult, customersResult, previousCustomers] =
    await Promise.allSettled([
      supabase
        .from("orders")
        .select(ORDER_FIELDS)
        .gte("placed_at", range.from)
        .lte("placed_at", range.to)
        .order("placed_at", { ascending: false })
        .limit(MAX_ORDERS),
      supabase
        .from("orders")
        .select(ORDER_FIELDS)
        .gte("placed_at", previousFrom)
        .lte("placed_at", previousTo)
        .limit(MAX_ORDERS),
      supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .limit(MAX_PRODUCTS),
      supabase
        .from("customers")
        .select("id, name, created_at")
        .gte("created_at", range.from)
        .lte("created_at", range.to)
        .limit(MAX_ORDERS),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .gte("created_at", previousFrom)
        .lte("created_at", previousTo),
    ]);

  const errors: Partial<Record<DashboardSection, string>> = {};

  if (ordersResult.status === "rejected") {
    errors.orders = "We could not load your orders.";
  } else if (ordersResult.value.error) {
    errors.orders = ordersResult.value.error.message;
  }

  if (productsResult.status === "rejected") {
    errors.products = "We could not load your products.";
  } else if (productsResult.value.error) {
    errors.products = productsResult.value.error.message;
  }

  if (customersResult.status === "rejected") {
    errors.customers = "We could not load your customers.";
  } else if (customersResult.value.error) {
    errors.customers = customersResult.value.error.message;
  }

  const orders = ((ordersResult.status === "fulfilled"
    ? ordersResult.value.data
    : null) ?? []) as unknown as OrderRow[];

  const previousOrders = ((previousResult.status === "fulfilled"
    ? previousResult.value.data
    : null) ?? []) as unknown as OrderRow[];

  const products = ((productsResult.status === "fulfilled"
    ? productsResult.value.error
    ? []
    : productsResult.value.data
    : null) ?? []) as unknown as ProductRow[];

  const customers =
    customersResult.status === "fulfilled" && !customersResult.value.error
      ? (customersResult.value.data ?? [])
      : [];

  const customersPrevious =
    previousCustomers.status === "fulfilled" && !previousCustomers.value.error
      ? (previousCustomers.value.count ?? 0)
      : 0;

  const current = summarise(orders);
  const previous = summarise(previousOrders);

  const liveProducts = products.filter((product) => !product.deleted_at);
  const activeProducts = liveProducts.filter(
    (product) => product.status === "active",
  );
  const lowStock = activeProducts
    .filter((product) => product.stock_quantity <= product.low_stock_threshold)
    .sort(
      (a, b) =>
        a.stock_quantity - b.stock_quantity ||
        a.low_stock_threshold - b.low_stock_threshold,
    );

  const buckets = buildBuckets(range);
  const previousBuckets = buildBuckets({
    ...range,
    from: previousFrom,
    to: previousTo,
  });

  const revenueByBucket = new Map<string, { revenue: number; orders: number }>();
  const previousRevenueByBucket = new Map<string, number>();

  for (const bucket of buckets) {
    revenueByBucket.set(bucket.key, { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const key = bucketKeyFor(order, range);
    const bucket = revenueByBucket.get(key);

    if (!bucket) {
      continue;
    }

    bucket.orders += 1;

    if (isCollected(order)) {
      bucket.revenue += Number(order.total ?? 0);
    }
  }

  for (const order of previousOrders) {
    const key = bucketKeyFor(order, { ...range, from: previousFrom, to: previousTo });
    const bucket = previousRevenueByBucket.get(key);

    if (bucket === undefined) {
      previousRevenueByBucket.set(key, isCollected(order) ? Number(order.total ?? 0) : 0);
    } else if (isCollected(order)) {
      previousRevenueByBucket.set(key, bucket + Number(order.total ?? 0));
    }
  }

  const series: SeriesPoint[] = buckets.map((bucket, index) => {
    const bucketData = revenueByBucket.get(bucket.key) ?? {
      revenue: 0,
      orders: 0,
    };
    const previousBucket = previousBuckets[index];

    return {
      label: bucket.label,
      revenue: Math.round(bucketData.revenue),
      orders: bucketData.orders,
      previousRevenue: previousBucket
        ? Math.round(previousRevenueByBucket.get(previousBucket.key) ?? 0)
        : 0,
    };
  });

  const distribution: DistributionSlice[] = COUNTED_STATUSES.map((status) => ({
    status,
    label: ORDER_STATUS_LABELS[status],
    value: orders.filter((order) => order.status === status).length,
    tone: ORDER_STATUS_TONES[status],
  })).filter((slice) => slice.value > 0);

  const bestSellers = buildBestSellers(orders, products);

  const productsAdded = products.filter(
    (product) =>
      new Date(product.created_at).getTime() >=
      new Date(range.from).getTime() &&
      new Date(product.created_at).getTime() <= new Date(range.to).getTime(),
  ).length;

  return {
    range,
    metrics: {
      revenue: current.revenue,
      invoiced: current.invoiced,
      orders: current.orders,
      pendingOrders: current.pendingOrders,
      completedOrders: current.completedOrders,
      cancelledOrders: current.cancelledOrders,
      products: activeProducts.length,
      archivedProducts: liveProducts.length - activeProducts.length,
      lowStock: lowStock.length,
      customers: customers.length,
      averageOrderValue: current.averageOrderValue,
    },
    series,
    distribution,
    bestSellers,
    recentOrders: orders.slice(0, 8),
    lowStock,
    growth: {
      revenueCurrent: current.revenue,
      revenuePrevious: previous.revenue,
      revenueDelta: percentageChange(current.revenue, previous.revenue),
      ordersCurrent: current.orders,
      ordersPrevious: previous.orders,
      ordersDelta: percentageChange(current.orders, previous.orders),
      customersCurrent: customers.length,
      customersPrevious,
      customersDelta: percentageChange(customers.length, customersPrevious),
      averageOrderValue: current.averageOrderValue,
      averageOrderValueDelta: percentageChange(
        current.averageOrderValue,
        previous.averageOrderValue,
      ),
      productsAdded,
    },
    truncated: orders.length >= MAX_ORDERS,
    errors,
  };
}

/** Counts and rows behind the notification bell. */
export async function getDashboardNotifications() {
  const empty = {
    lowStock: [] as unknown as ProductRow[],
    lowStockCount: 0,
    pendingOrders: [] as unknown as Array<{
      id: string;
      order_number: string;
      status: string;
      customer: string | null;
      placed_at: string;
    }>,
    pendingOrdersCount: 0,
    total: 0,
  };

  try {
    const supabase = await getSupabaseServerClient();

    const [productsResult, ordersResult] = await Promise.all([
      supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("status", "active")
        .limit(MAX_PRODUCTS),
      supabase
        .from("orders")
        .select("id, order_number, status, total, currency, placed_at, customers(name)")
        .in("status", PENDING_STATUSES)
        .order("placed_at", { ascending: false })
        .limit(20),
    ]);

    const products = (productsResult.data ?? []) as unknown as ProductRow[];
    const orders = (ordersResult.data ?? []) as unknown as Array<{
      id: string;
      order_number: string;
      status: OrderStatus;
      total: number;
      currency: string;
      placed_at: string;
      customers: { name: string } | null;
    }>;

    const lowStock = products
      .filter(
        (product) => product.stock_quantity <= product.low_stock_threshold,
      )
      .sort((a, b) => a.stock_quantity - b.stock_quantity);

    return {
      lowStock: lowStock.slice(0, 5),
      lowStockCount: lowStock.length,
      pendingOrders: orders.slice(0, 5).map((order) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        customer: order.customers?.name ?? null,
        placed_at: order.placed_at,
      })),
      pendingOrdersCount: orders.length,
      total: lowStock.length + orders.length,
    };
  } catch {
    return empty;
  }
}
/** Cross-entity search for the top bar. */
export async function searchWorkspace(
  rawQuery: string,
): Promise<WorkspaceSearchResults | null> {
  const query = sanitiseSearch(rawQuery);

  if (query.length < 2) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const pattern = `%${query}%`;

  const [productsResult, ordersResult, customersResult] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_FIELDS)
      .or(`name.ilike.${pattern},sku.ilike.${pattern}`)
      .limit(6),
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, currency, subtotal, discount, tax, total, placed_at, customers(name), order_items(id, product_id, product_name, quantity, unit_price, line_total)")
      .ilike("order_number", pattern)
      .limit(6),
    supabase
      .from("customers")
      .select("id, name, email, phone")
      .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
      .limit(6),
  ]);

  return {
    query,
    products: (productsResult.data ?? []) as unknown as ProductRow[],
    orders: (ordersResult.data ?? []) as unknown as OrderRow[],
    customers: (customersResult.data ??
      []) as unknown as WorkspaceSearchResults["customers"],
  };
}





