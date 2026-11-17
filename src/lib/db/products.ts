import "server-only";

import {
  CATALOGUE_PAGE_SIZE,
  PRODUCT_SELECT,
  PRODUCT_SELECT_LEGACY,
  isMissingColumnError,
  type CatalogueFilters,
  type CatalogueProduct,
  type CatalogueResult,
  type CatalogueSort,
} from "@/lib/db/catalogue";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export {
  CATALOGUE_PAGE_SIZE,
  CATALOGUE_SORTS,
  CATALOGUE_STATUS_FILTERS,
  PRODUCT_SELECT,
  PRODUCT_SELECT_LEGACY,
  type CatalogueFilters,
  type CatalogueProduct,
  type CatalogueResult,
  type CatalogueSort,
  type CatalogueStats,
  type CatalogueStatus,
  type CatalogueView,
} from "@/lib/db/catalogue";

/** Resolves the merchant and their business from the session. */
export async function getCatalogueBusiness() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, business: null, businessId: null };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, currency")
    .limit(1)
    .maybeSingle();

  return {
    supabase,
    business: business ?? null,
    businessId: (business?.id as string | undefined) ?? null,
  };
}

function applySort(query: ReturnType<typeof buildQuery>, sort: CatalogueSort) {
  switch (sort) {
    case "name":
      return query.order("name", { ascending: true });
    case "price_asc":
      return query.order("price", { ascending: true });
    case "price_desc":
      return query.order("price", { ascending: false });
    case "stock_asc":
      return query.order("stock_quantity", { ascending: true });
    case "stock_desc":
      return query.order("stock_quantity", { ascending: false });
    default:
      return query.order("created_at", { ascending: false });
  }
}

function buildQuery(
  supabase: Awaited<ReturnType<typeof getCatalogueBusiness>>["supabase"],
  businessId: string,
  select: string,
) {
  return supabase
    .from("products")
    .select(select, { count: "exact" })
    .eq("business_id", businessId);
}

/**
 * Loads one page of the catalogue plus the statistics that drive the header.
 *
 * Every query is scoped by the merchant's business id, which is resolved from
 * the session — the browser never chooses whose inventory to read.
 *
 * The media migration adds `original_price`, `images` and `deleted_at`. Until it
 * is applied the catalogue falls back to the legacy column set so the merchant
 * still sees their products.
 */
export async function getCatalogue(
  filters: CatalogueFilters,
): Promise<CatalogueResult> {
  const { supabase, businessId } = await getCatalogueBusiness();

  const empty: CatalogueResult = {
    products: [],
    total: 0,
    page: 1,
    pageSize: CATALOGUE_PAGE_SIZE,
    pageCount: 1,
    categories: [],
    stats: {
      active: 0,
      archived: 0,
      deleted: 0,
      lowStock: 0,
      outOfStock: 0,
      inventoryValue: 0,
      averagePrice: 0,
    },
    capabilities: { images: false, originalPrice: false, softDelete: false },
    errors: {},
  };

  if (!businessId) {
    return empty;
  }

  const status = filters.status ?? "all";
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? CATALOGUE_PAGE_SIZE;
  const lowStockOnly = status === "low";
  const query = filters.query?.trim();

  const buildList = (select: string, withSoftDelete: boolean) => {
    let list = buildQuery(supabase, businessId, select);

    if (withSoftDelete) {
      list = status === "deleted"
        ? list.not("deleted_at", "is", null)
        : list.is("deleted_at", null);
    }

    if (status === "active" || lowStockOnly) {
      list = list.eq("status", "active");
    } else if (status === "archived") {
      list = list.eq("status", "archived");
    }

    if (filters.category && filters.category !== "all") {
      list = list.eq("category", filters.category);
    }

    if (query) {
      const safe = query.replace(/[%,()]/g, " ").trim();
      if (safe) {
        list = list.or(
          `name.ilike.%${safe}%,sku.ilike.%${safe}%,description.ilike.%${safe}%`,
        );
      }
    }

    return applySort(list, filters.sort ?? "recent").range(
      lowStockOnly ? 0 : (page - 1) * pageSize,
      lowStockOnly ? 4999 : page * pageSize - 1,
    );
  };

  let supportsMedia = true;
  let listResult = await buildList(PRODUCT_SELECT, supportsMedia);

  if (listResult.error && isMissingColumnError(listResult.error.message)) {
    // The media migration has not been applied yet: read the legacy columns.
    supportsMedia = false;
    listResult = await buildList(PRODUCT_SELECT_LEGACY, supportsMedia);
  }

  const statsSelect = supportsMedia
    ? "status, stock_quantity, low_stock_threshold, price, deleted_at, category"
    : "status, stock_quantity, low_stock_threshold, price, category";

  const [allResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select(statsSelect)
      .eq("business_id", businessId),
    supabase
      .from("products")
      .select("category")
      .eq("business_id", businessId)
      .not("category", "is", null),
  ]);

  const rows = (listResult.data ?? []) as unknown as CatalogueProduct[];

  const filteredProducts = lowStockOnly
    ? rows.filter(
        (product) => product.stock_quantity <= product.low_stock_threshold,
      )
    : rows;

  const pagedProducts = lowStockOnly
    ? filteredProducts.slice((page - 1) * pageSize, page * pageSize)
    : filteredProducts;

  const allRows = (allResult.data ?? []) as unknown as Array<{
    status: "active" | "archived";
    stock_quantity: number;
    low_stock_threshold: number;
    price: number;
    deleted_at?: string | null;
    category?: string | null;
  }>;

  const live = supportsMedia
    ? allRows.filter((row) => row.deleted_at === null)
    : allRows;
  const active = live.filter((row) => row.status === "active");
  const archived = live.filter((row) => row.status === "archived");
  const deleted = supportsMedia
    ? allRows.filter((row) => row.deleted_at !== null)
    : [];
  const lowStock = active.filter(
    (row) => row.stock_quantity <= row.low_stock_threshold,
  );
  const outOfStock = active.filter((row) => row.stock_quantity === 0);
  const inventoryValue = active.reduce(
    (sum, row) => sum + Number(row.price) * row.stock_quantity,
    0,
  );
  const averagePrice = active.length
    ? active.reduce((sum, row) => sum + Number(row.price), 0) / active.length
    : 0;

  const categories = Array.from(
    new Set(
      ((categoriesResult.data ?? []) as unknown as Array<{ category: string }>)
        .map((row) => row.category)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const total = lowStockOnly
    ? lowStock.length
    : (listResult.count ?? rows.length);

  return {
    products: pagedProducts,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    categories,
    stats: {
      active: active.length,
      archived: archived.length,
      deleted: deleted.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      inventoryValue,
      averagePrice,
    },
    capabilities: {
      images: supportsMedia,
      originalPrice: supportsMedia,
      softDelete: supportsMedia,
    },
    errors: {
      ...(listResult.error ? { products: listResult.error.message } : {}),
      ...(allResult.error ? { stats: allResult.error.message } : {}),
    },
  };
}

/** Loads a single product for the edit panel. */
export async function getProduct(productId: string) {
  const { supabase, businessId } = await getCatalogueBusiness();

  if (!businessId) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error && isMissingColumnError(error.message)) {
    const legacy = await supabase
      .from("products")
      .select(PRODUCT_SELECT_LEGACY)
      .eq("id", productId)
      .eq("business_id", businessId)
      .maybeSingle();

    return (legacy.data as unknown as CatalogueProduct | null) ?? null;
  }

  if (error) {
    return null;
  }

  return (data as unknown as CatalogueProduct | null) ?? null;
}
