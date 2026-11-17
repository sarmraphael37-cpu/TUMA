import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StorefrontForm } from "@/components/dashboard/storefront/storefront-form";
import { StorefrontSharePanel } from "@/components/dashboard/storefront/storefront-share-panel";
import { Card } from "@/components/dashboard/cards/card";
import { DashboardFrame } from "@/components/dashboard/shell/dashboard-frame";
import { getOwnedBusiness } from "@/lib/auth/server";
import { getCatalogue } from "@/lib/db/products";
import { getStorefrontSettings } from "@/lib/db/storefront-settings";
import { getRequestOrigin } from "@/lib/url";

export const metadata: Metadata = {
  title: "Storefront",
  description: "Publish your public shop and set how customers reach you.",
};

type Props = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function StorefrontSettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const business = await getOwnedBusiness();

  if (!business) {
    notFound();
  }

  const settings = await getStorefrontSettings(business.id);
  const [catalogue, origin] = await Promise.all([
    getCatalogue({ status: "active", sort: "recent", page: 1, pageSize: 3 }),
    getRequestOrigin(),
  ]);

  const storefrontUrl = `${origin}/shop/${business.slug}`;

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Storefront
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Your public shop at{" "}
            <Link href={`/shop/${business.slug}`} className="text-cyan-glow hover:underline">
              /shop/{business.slug}
            </Link>
            . Customers see your active products, your contact details and can
            place an order.
          </p>
        </div>

        {params.saved ? (
          <div
            role="status"
            className="rounded-xl border border-mint-glow/20 bg-mint-glow/[0.07] px-3.5 py-3 text-[12px] text-mint-glow"
          >
            Your storefront settings were saved.
          </div>
        ) : null}

        <StorefrontForm
          slug={business.slug}
          isPublic={settings.isPublic}
          logoUrl={settings.logoUrl}
          coverImageUrl={settings.coverImageUrl}
          whatsapp={settings.whatsapp}
          supported={settings.supported}
        />

        <Card
          title="Share your shop"
          description="A ready-made link and message for WhatsApp or any chat."
        >
          <StorefrontSharePanel
            businessName={business.name}
            description={business.description}
            storefrontUrl={storefrontUrl}
            isPublic={settings.isPublic}
            products={catalogue.products.map((product) => ({
              name: product.name,
              price: Number(product.price ?? 0),
              currency: business.currency,
            }))}
          />
        </Card>
      </div>
    </DashboardFrame>
  );
}
