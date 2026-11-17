/**
 * Catalogue contract shared by the server queries and the client filters.
 *
 * This module is intentionally free of any server-only import so the toolbar,
 * cards and rows can use the same types in the browser.
 */

export type CatalogueSort =
  | "recent"
  | "name"
  | "price_asc"
  | "price_desc"
  | "stock_asc"
  | "stock_desc";

export type CatalogueStatus = "all" | "active" | "archived" | "deleted" | "low";

export type CatalogueView = "grid" | "table";

export type CatalogueProduct = {
  id: string;
  business_id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  price: number;
  cost: number | null;
  original_price?: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  status: "active" | "archived";
  images?: string[] | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogueFilters = {
  query?: string;
  category?: string;
  status?: CatalogueStatus;
  sort?: CatalogueSort;
  page?: number;
  pageSize?: number;
};

export type CatalogueStats = {
  active: number;
  archived: number;
  deleted: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
  averagePrice: number;
};

/**
 * Which optional parts of the catalogue the workspace database supports.
 *
 * The product media migration adds the image gallery, the original price and
 * the soft delete; until it is applied the catalogue works without them.
 */
export type CatalogueCapabilities = {
  images: boolean;
  originalPrice: boolean;
  softDelete: boolean;
};

export type CatalogueResult = {
  products: CatalogueProduct[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  categories: string[];
  stats: CatalogueStats;
  capabilities: CatalogueCapabilities;
  errors: Partial<Record<"products" | "stats", string>>;
};

export const CATALOGUE_RANGES = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "12m", label: "12 months", days: 365 },
] as const;

export const CATALOGUE_SORTS: { value: CatalogueSort; label: string }[] = [
  { value: "recent", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "stock_asc", label: "Stock: low to high" },
  { value: "stock_desc", label: "Stock: high to low" },
];

export const CATALOGUE_STATUS_FILTERS: {
  value: CatalogueStatus;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Available" },
  { value: "archived", label: "Archived" },
  { value: "low", label: "Low stock" },
  { value: "deleted", label: "Deleted" },
];

export const CATALOGUE_PAGE_SIZE = 12;

/**
 * Column list used by the catalogue. The media migration adds `original_price`,
 * `images` and `deleted_at`; the legacy list keeps the catalogue readable while
 * that migration is still pending.
 */
export const PRODUCT_SELECT = [
  "id",
  "business_id",
  "name",
  "sku",
  "description",
  "category",
  "price",
  "cost",
  "original_price",
  "stock_quantity",
  "low_stock_threshold",
  "status",
  "images",
  "deleted_at",
  "created_at",
  "updated_at",
].join(", ");

export const PRODUCT_SELECT_LEGACY = [
  "id",
  "business_id",
  "name",
  "sku",
  "description",
  "category",
  "price",
  "cost",
  "stock_quantity",
  "low_stock_threshold",
  "status",
  "created_at",
  "updated_at",
].join(", ");

/**
 * True when PostgREST rejected a column, i.e. the migration is still pending.
 *
 * Reads report "column products.x does not exist" while writes report
 * "Could not find the 'x' column of 'products' in the schema cache".
 */
export function isMissingColumnError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }

  return (
    /column .* does not exist/i.test(message) ||
    /could not find the '[^']+' column/i.test(message)
  );
}

