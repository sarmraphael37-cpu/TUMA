import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - TUMA",
  description: "TUMA privacy policy explaining how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-[2rem] font-semibold text-white mb-6">
          Privacy Policy
        </h1>

        <div className="text-white leading-relaxed space-y-6">
          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Information We Collect</h2>
          <p>
            TUMA collects business and order data to provide the platform services.
            This includes business names, product catalogues, order information,
            and customer contact details necessary for order fulfillment.
          </p>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">How We Use Your Data</h2>
          <p>
            We use your data to operate the TUMA platform, process orders,
            manage inventory, provide business insights, and communicate with
            customers about their orders.
          </p>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Data Sharing</h2>
          <p>
            We do not sell your data to third parties. Merchant data is kept
            confidential and protected by Supabase RLS policies. Customer order
            data is only shared with the respective business owner.
          </p>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Your Rights</h2>
          <p>
            Business owners can access, correct, or delete their data through
            the TUMA admin console. Customers can contact merchants directly
            through the platform.
          </p>

          <h2 className="font-heading text-[1.5rem] font-medium mb-4">Cookies</h2>
          <p>
            TUMA uses essential cookies for platform functionality. No tracking
            or advertising cookies are used.
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