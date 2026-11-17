import { notFound } from "next/navigation";

import { CartSheet } from "@/components/shop/cart-sheet";
import { ShopHeader } from "@/components/shop/shop-header";
import { ShopProvider } from "@/components/shop/shop-provider";
import { getStorefrontBusiness } from "@/lib/db/storefront";

/**
 * The shell of every storefront page.
 *
 * The business is loaded once and shared by the header, the cart and the
 * pages. A shop that is not published (or does not exist) is a 404 — the
 * visitor never learns anything about a private business.
 */
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getStorefrontBusiness(slug);

  if (!business) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ShopProvider slug={business.slug}>
        <ShopHeader business={business} />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <CartSheet currency={business.currency} />
      </ShopProvider>
    </div>
  );
}
