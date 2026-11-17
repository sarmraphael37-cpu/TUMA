import type { Metadata } from "next";

import { Hero } from "@/components/storefront/hero";
import { AssuranceStrip } from "@/components/storefront/assurance-strip";
import { ProblemSolution } from "@/components/storefront/problem-solution";
import { DemoSection } from "@/components/storefront/demo-section";
import { Features } from "@/components/storefront/features";
import { HowItWorks } from "@/components/storefront/how-it-works";
import { Testimonials } from "@/components/storefront/testimonials";
import { PricingPreview } from "@/components/storefront/pricing-preview";
import { FaqSection } from "@/components/storefront/faq";
import { FinalCta } from "@/components/storefront/final-cta";

export const metadata: Metadata = {
  title: "Intelligent business management for African businesses",
  description:
    "TUMA unifies orders, inventory, invoicing, mobile money and AI insights in one calm workspace built for small businesses in Cameroon and across Africa.",
  openGraph: {
    title: "TUMA - Business Management for Africa",
    description:
      "TUMA unifies orders, inventory, invoicing, mobile money and AI insights in one calm workspace built for small businesses in Cameroon and across Africa.",
    images: [
      {
        url: "https://tuma.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TUMA - Business management platform",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <AssuranceStrip />
      <ProblemSolution />
      <DemoSection />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingPreview />
      <FaqSection />
      <FinalCta />
    </>
  );
}