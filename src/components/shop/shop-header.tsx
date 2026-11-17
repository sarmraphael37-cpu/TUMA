import Image from "next/image";
import { MapPin, MessageCircle, Phone } from "lucide-react";

import { CartButton } from "@/components/shop/cart-button";
import type { StorefrontBusiness } from "@/lib/db/storefront";

/**
 * The storefront header.
 *
 * Shows the cover image, the logo, the business name and description and the
 * contact details a customer needs before ordering.
 */
export function ShopHeader({
  business,
}: {
  business: StorefrontBusiness;
}) {
  const whatsappHref = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  return (
    <header className="relative overflow-hidden border-b border-white/[0.07] bg-navy-900/40">
      <div className="relative h-40 w-full overflow-hidden sm:h-52">
        {business.cover_image_url ? (
          <Image
            src={business.cover_image_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="size-full bg-[radial-gradient(120%_120%_at_20%_0%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(100%_100%_at_80%_10%,rgba(167,139,250,0.16),transparent_60%)]"
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/20"
          aria-hidden
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/[0.12] bg-navy-950 shadow-lg sm:size-24">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  width={96}
                  height={96}
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-heading text-xl font-semibold text-foreground/80">
                  {business.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <p className="text-[10.5px] font-medium tracking-[0.18em] text-cyan-glow/80 uppercase">
                {business.category.replace(/_/g, " ")}
              </p>
              <h1 className="font-heading text-[1.5rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[1.85rem]">
                {business.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-1">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 text-[12px] font-medium transition-colors hover:bg-white/[0.08]"
              >
                <MessageCircle className="size-3.5 text-mint-glow" aria-hidden />
                WhatsApp
              </a>
            ) : null}

            <CartButton />
          </div>
        </div>

        {business.description ? (
          <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
            {business.description}
          </p>
        ) : null}

        <dl className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.06] py-4 text-[12px]">
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Phone</dt>
            <dd>
              <a
                href={`tel:${business.phone.replace(/\s/g, "")}`}
                className="text-foreground/85 hover:text-cyan-glow"
              >
                {business.phone}
              </a>
            </dd>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Location</dt>
            <dd className="text-foreground/85">{business.location}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
