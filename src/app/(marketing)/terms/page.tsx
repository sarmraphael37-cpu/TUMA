import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - TUMA",
  description: "TUMA terms of service governing use of the platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-[2rem] font-semibold text-white mb-6">
          Terms of Service
        </h1>

        <div className="text-white leading-relaxed space-y-6">
          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Acceptance</h2>
          <p>
            By accessing or using TUMA, you agree to these terms. This agreement
            applies to all users of the platform, including merchants and
            customers.
          </p>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Merchant Obligations</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Provide accurate business information and product details
            </li>
            <li>
              Maintain accurate inventory levels and product availability
            </li>
            <li>
              Process orders in a timely manner and communicate with customers
            </li>
            <li>
              Comply with applicable laws and regulations in your jurisdiction
            </li>
          </ul>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Customer Conduct</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Provide accurate information when placing orders
            </li>
            <li>
              Contact merchants directly for order-related questions
            </li>
            <li>
              Respect business policies and delivery timelines
            </li>
          </ul>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Order Processing</h2>
          <p>
            TUMA facilitates orders between merchants and customers. All order
            calculations and inventory updates are handled by the merchant's
            storefront. TUMA does not guarantee order fulfillment and merchants
            are responsible for their own products and services.
          </p>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Limitation of Liability</h2>
          <p>
            TUMA provides the platform "as is" without warranties of any kind.
            We are not liable for any indirect, incidental, or consequential
            damages arising from use of the platform or orders placed through it.
          </p>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Governing Law</h2>
          <p>
            These terms are governed by the laws of Cameroon, Africa. Any disputes
            will be resolved through good faith negotiation between the parties.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-white/[0.05] text-xs text-muted-foreground">
          <p>Last updated: November 2026</p>
          <p>TUMA Platform</p>
        </div>
      </div>
    </div>
  );
}