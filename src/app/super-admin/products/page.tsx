import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Folder,
  Package,
  Loader2,
  XCircle,
  CheckCircle,
  Trash2,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseServerClient } from "@/lib/supabase/server";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";

type ProductRecord = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  original_price: number | null;
  images: string[];
  stock_quantity: number;
  is_active: boolean;
  business_id: string;
  business_name: string;
  created_at: string;
};

type ProductsListResult = {
  data: ProductRecord[];
  error: Error | null;
  count: number;
};

export const metadata: Metadata = {
  title: "Products",
  description: "Product and inventory monitoring across all platform merchants.",
};

export default function SuperAdminProductsPage() {
  const supa = useSupabaseServerClient();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const { data, error } = await supa
          .from("products")
          .select(
            "*, business(name, slug, owner:profiles(full_name, email))",
            { count: "exact" }
          )
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setProducts(data || []);
        setError(null);
      } catch (err: any) {
        setError(err);
        toast({
          title: "Error loading products",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <Loader2 className="size-6 mx-auto mb-4 animate-spin text-electric-300" />
          <p className="text-[12px] text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="bg-red-500/10 border-l-4 border-red-500 rounded p-4 text-red-400">
          <strong>Error:</strong> {error?.message ?? "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Card bodyClassName="p-3">
        <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
          Products
        </h1>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Product and inventory monitoring across all platform merchants ({formatNumber(products.length)} total).
        </p>
      </Card>

      {products.length === 0 ? (
        <div className="min-h-screen p-6 text-center">
          <Folder className="size-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-heading text-[1.25rem] font-medium mb-2">No products yet</h3>
          <p className="text-[11px] text-muted-foreground">
            Products appear here once merchants add items to their catalog.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      href={`/super-admin/products/${product.id}`}
                      className="text-white hover:text-cyan-glow transition-colors"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] truncate">{product.business_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] truncate">{product.category || "Uncategorized"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {formatCurrency(product.price, "XAF")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px]">
                      {product.stock_quantity} {product.stock_quantity > 0 ? "(in stock)" : "(out of stock)"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] {
                      product.is_active ? "text-green-400" : "text-red-400"
                    }">
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] px-2"
                    >
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-[9px] px-2"
                      onClick={() => {
                        toast({
                          title: "Delete product",
                          description: `Are you sure you want to delete "${product.name}"?`,
                          variant: "destructive",
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}