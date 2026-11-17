import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutForm } from "@/components/shop/checkout-form";
import { getStorefrontBusiness } from "@/lib/db/storefront";

type Props = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  const business = await getStorefrontBusiness(slug);

  if (!business) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-[1.45rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[1.7rem]">
          Checkout
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
          Almost there. Tell {business.name} where to deliver your order and we
          will confirm it on the phone.
        </p>
      </div>

      <CheckoutForm
        slug={business.slug}
        currency={business.currency}
        phone={business.phone}
        whatsapp={business.whatsapp}
      />
    </div>
  );
}
