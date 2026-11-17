import "server-only";

import type { Business } from "@/lib/db/types";
import type { AiCatalogueOption } from "@/lib/ai/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The real-data snapshot behind TUMA AI insights and the assistant.
 *
 * Only aggregate product and order data is read here. Customer names, phone
 * numbers, emails and addresses are never selected, so they can never be sent
 * to an external AI provider. Every number in this object comes from the
 * merchant's own rows (RLS applies); if a query fails the snapshot says so
 * instead of pretending the value is zero.
 */

const WINDOW_DAYS = 30;
const MAX_PRODUCTS = 1_000;
const MAX_ORDERS = 2_000;

export type AiSnapshotProduct = {
  name: string;
  stock: number;
  threshold: number;
};

export type AiSnapshotBestSeller = {
  name: string;
  units: number;
  revenue: number;
};

export type AiInsightSnapshot = {
  generatedAt: string;
  windowDays: number;
  currency: string;
  business: {
    name: string;
    category: string;
  };
  availability: {
    products: boolean;
    orders: boolean;
  };
  errors: {
    products: string | null;
    orders: string | null;
  };
  products: {
    active: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    stockUnits: number;
    catalogueValue: number;
    lowStockItems: AiSnapshotProduct[];
  };
  orders: {
    current: {
      orders: number;
      paidOrders: number;
      paidRevenue: number;
      pending: number;
      awaitingVerification: number;
      cancelled: number;
      averagePaidOrder: number;
    };
    previous: {
      orders: number;
      paidOrders: number;
      paidRevenue: number;
    };
    revenueChangePercent: number | null;
    orderChangePercent: number | null;
  };
  bestSellers: AiSnapshotBestSeller[];
  signals: string[];
};

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  price: number | string | null;
  stock_quantity: number | string | null;
  low_stock_threshold: number | string | null;
  status: string | null;
};

type OrderItemRow = {
  product_id: string | null;
  product_name: string;
  quantity: number | string | null;
  line_total: number | string | null;
};

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  total: number | string | null;
  placed_at: string;
  order_items: OrderItemRow[] | null;
};

type ProductOptionsRow = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
};

const PENDING_STATUSES = new Set(["pending", "confirmed", "processing"]);
const EXCLUDED_STATUSES = new Set(["cancelled", "refunded"]);

const PRODUCT_COLUMNS = [
  "id",
  "name",
  "sku",
  "price",
  "stock_quantity",
  "low_stock_threshold",
  "status",
].join(", ");

const ORDER_COLUMNS = [
  "id",
  "status",
  "payment_status",
  "total",
  "placed_at",
  "order_items(product_id, product_name, quantity, line_total)",
].join(", ");

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentageChange(current: number, previous: number): number | null {
  if (!previous) {
    return null;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

function isCountable(order: OrderRow) {
  return !EXCLUDED_STATUSES.has(order.status);
}

function isPaid(order: OrderRow) {
  return order.payment_status === "paid";
}

function summarise(orders: OrderRow[], currency: string) {
  let paidOrders = 0;
  let paidRevenue = 0;
  let pending = 0;
  let awaitingVerification = 0;
  let cancelled = 0;

  for (const order of orders) {
    if (isPaid(order)) {
      paidOrders += 1;
      paidRevenue += numeric(order.total);
    }

    if (PENDING_STATUSES.has(order.status)) {
      pending += 1;
    }

    if (order.payment_status === "awaiting_verification") {
      awaitingVerification += 1;
    }

    if (EXCLUDED_STATUSES.has(order.status)) {
      cancelled += 1;
    }
  }

  return {
    orders: orders.length,
    paidOrders,
    paidRevenue,
    pending,
    awaitingVerification,
    cancelled,
    averagePaidOrder: paidOrders ? paidRevenue / paidOrders : 0,
    currency,
  };
}

function buildSignals(input: {
  business: Business;
  products: ProductRow[] | null;
  current: ReturnType<typeof summarise>;
  previous: ReturnType<typeof summarise>;
  lowStock: ProductRow[];
  bestSellers: AiSnapshotBestSeller[];
  errors: AiInsightSnapshot["errors"];
}) {
  const { business, products, current, previous, lowStock, bestSellers, errors } =
    input;
  const signals: string[] = [];
  const currency = business.currency;
  const money = (value: number) => formatCurrency(value, currency);

  if (!products) {
    signals.push(
      "Product data could not be loaded, so stock comments are unavailable.",
    );
  } else {
    const active = products.filter((product) => product.status === "active");

    if (active.length === 0) {
      signals.push("There are no active products in the catalogue.");
    }

    if (lowStock.length > 0) {
      const names = lowStock
        .slice(0, 3)
        .map((product) => product.name)
        .join(", ");
      signals.push(
        `${lowStock.length} of ${active.length} active products are at or below their low-stock threshold (${names}${lowStock.length > 3 ? ", ..." : ""}).`,
      );
    }

    const outOfStock = active.filter(
      (product) => numeric(product.stock_quantity) === 0,
    );

    if (outOfStock.length > 0) {
      signals.push(
        `${outOfStock.length} active product${outOfStock.length === 1 ? " is" : "s are"} out of stock.`,
      );
    }
  }

  if (errors.orders) {
    signals.push(
      "Order data could not be loaded, so revenue comments are unavailable.",
    );
  } else if (current.orders === 0) {
    signals.push(`No orders were placed in the last ${WINDOW_DAYS} days.`);
  } else {
    signals.push(
      `${formatNumber(current.orders)} orders were placed in the last ${WINDOW_DAYS} days; ${formatNumber(current.paidOrders)} are recorded as paid.`,
    );

    const change = percentageChange(
      current.paidRevenue,
      previous.paidRevenue,
    );

    if (change === null) {
      signals.push(
        previous.paidRevenue === 0 && current.paidRevenue > 0
          ? `Paid revenue is ${money(current.paidRevenue)} this period. The previous ${WINDOW_DAYS} days had no paid revenue, so no percentage change can be calculated.`
          : `Paid revenue is ${money(current.paidRevenue)} this period.`,
      );
    } else {
      const direction = change >= 0 ? "up" : "down";
      signals.push(
        `Paid revenue is ${direction} ${Math.abs(change).toFixed(1)}% compared with the previous ${WINDOW_DAYS} days (${money(current.paidRevenue)} vs ${money(previous.paidRevenue)}).`,
      );
    }
  }

  if (current.pending > 0) {
    signals.push(
      `${formatNumber(current.pending)} order${current.pending === 1 ? " is" : "s are"} still pending, confirmed or processing.`,
    );
  }

  if (current.awaitingVerification > 0) {
    signals.push(
      `${formatNumber(current.awaitingVerification)} payment${current.awaitingVerification === 1 ? " is" : "s are"} awaiting verification. TUMA does not consider them verified.`,
    );
  }

  if (bestSellers[0]) {
    signals.push(
      `${bestSellers[0].name} is the top product by ordered value (${formatNumber(bestSellers[0].units)} units, ${money(bestSellers[0].revenue)}).`,
    );

    const bestSeller = lowStock.find(
      (product) => product.name === bestSellers[0].name,
    );

    if (bestSeller) {
      signals.push(
        `${bestSeller.name} is also at or below its low-stock threshold with ${formatNumber(numeric(bestSeller.stock_quantity))} unit${numeric(bestSeller.stock_quantity) === 1 ? "" : "s"} left.`,
      );
    }
  }

  return signals;
}

export async function getInsightsSnapshot(
  business: Business,
): Promise<AiInsightSnapshot> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const currentFrom = new Date(
    now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const previousFrom = new Date(
    now.getTime() - WINDOW_DAYS * 2 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [productsResult, currentOrdersResult, previousOrdersResult] =
    await Promise.all([
      supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("business_id", business.id)
        .limit(MAX_PRODUCTS),
      supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("business_id", business.id)
        .gte("placed_at", currentFrom)
        .lte("placed_at", now.toISOString())
        .order("placed_at", { ascending: false })
        .limit(MAX_ORDERS),
      supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("business_id", business.id)
        .gte("placed_at", previousFrom)
        .lt("placed_at", currentFrom)
        .order("placed_at", { ascending: false })
        .limit(MAX_ORDERS),
    ]);

  const productError = productsResult.error
    ? productsResult.error.message
    : null;
  const currentOrderError = currentOrdersResult.error
    ? currentOrdersResult.error.message
    : null;
  const previousOrderError = previousOrdersResult.error
    ? previousOrdersResult.error.message
    : null;
  const orderError = currentOrderError ?? previousOrderError;

  const products = productsResult.error
    ? null
    : ((productsResult.data ?? []) as unknown as ProductRow[]);
  const currentOrders = currentOrdersResult.error
    ? []
    : ((currentOrdersResult.data ?? []) as unknown as OrderRow[]);
  const previousOrders = previousOrdersResult.error
    ? []
    : ((previousOrdersResult.data ?? []) as unknown as OrderRow[]);

  const activeProducts = (products ?? []).filter(
    (product) => product.status === "active",
  );
  const lowStock = activeProducts
    .filter(
      (product) =>
        numeric(product.stock_quantity) <=
        numeric(product.low_stock_threshold),
    )
    .sort(
      (a, b) =>
        numeric(a.stock_quantity) - numeric(b.stock_quantity) ||
        a.name.localeCompare(b.name),
    );

  const catalogueValue = activeProducts.reduce(
    (total, product) =>
      total + numeric(product.price) * numeric(product.stock_quantity),
    0,
  );

  const current = summarise(currentOrders, business.currency);
  const previous = summarise(previousOrders, business.currency);

  const sellerMap = new Map<
    string,
    { name: string; units: number; revenue: number }
  >();

  for (const order of currentOrders) {
    if (!isCountable(order)) {
      continue;
    }

    for (const item of order.order_items ?? []) {
      const key = item.product_id ?? `name:${item.product_name}`;
      const existing = sellerMap.get(key);

      if (existing) {
        existing.units += numeric(item.quantity);
        existing.revenue += numeric(item.line_total);
      } else {
        sellerMap.set(key, {
          name: item.product_name,
          units: numeric(item.quantity),
          revenue: numeric(item.line_total),
        });
      }
    }
  }

  const bestSellers = [...sellerMap.values()]
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, 5);

  const errors = { products: productError, orders: orderError };

  const snapshot: AiInsightSnapshot = {
    generatedAt: now.toISOString(),
    windowDays: WINDOW_DAYS,
    currency: business.currency,
    business: {
      name: business.name,
      category: business.category,
    },
    availability: {
      products: !productError,
      orders: !orderError,
    },
    errors,
    products: {
      active: activeProducts.length,
      inStock: activeProducts.filter(
        (product) => numeric(product.stock_quantity) > 0,
      ).length,
      lowStock: lowStock.length,
      outOfStock: activeProducts.filter(
        (product) => numeric(product.stock_quantity) === 0,
      ).length,
      stockUnits: activeProducts.reduce(
        (total, product) => total + numeric(product.stock_quantity),
        0,
      ),
      catalogueValue,
      lowStockItems: lowStock.slice(0, 8).map((product) => ({
        name: product.name,
        stock: numeric(product.stock_quantity),
        threshold: numeric(product.low_stock_threshold),
      })),
    },
    orders: {
      current: {
        orders: current.orders,
        paidOrders: current.paidOrders,
        paidRevenue: current.paidRevenue,
        pending: current.pending,
        awaitingVerification: current.awaitingVerification,
        cancelled: current.cancelled,
        averagePaidOrder: current.averagePaidOrder,
      },
      previous: {
        orders: previous.orders,
        paidOrders: previous.paidOrders,
        paidRevenue: previous.paidRevenue,
      },
      revenueChangePercent: percentageChange(
        current.paidRevenue,
        previous.paidRevenue,
      ),
      orderChangePercent: percentageChange(
        current.orders,
        previous.orders,
      ),
    },
    bestSellers,
    signals: [],
  };

  snapshot.signals = buildSignals({
    business,
    products,
    current,
    previous,
    lowStock,
    bestSellers,
    errors,
  });

  return snapshot;
}

/** A small list for the product-copy picker. No prices or stock are needed. */
export async function getAiProductOptions(
  businessId: string,
): Promise<AiCatalogueOption[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, description")
      .eq("business_id", businessId)
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(100);

    if (error) {
      return [];
    }

    return ((data ?? []) as unknown as ProductOptionsRow[]).map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
    }));
  } catch {
    return [];
  }
}
