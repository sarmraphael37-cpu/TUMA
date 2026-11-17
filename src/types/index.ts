import type { LucideIcon } from "lucide-react";

/** A link used in navigation, footers and in-page menus. */
export type NavLink = {
  label: string;
  href: string;
};

/** A product capability shown in the feature grid. */
export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/** A step in the "how it works" narrative. */
export type Step = {
  step: string;
  title: string;
  description: string;
};

/** A headline business metric. */
export type Stat = {
  label: string;
  value: string;
  detail: string;
};

/** A pricing plan. Prices are stored per month in XAF. */
export type PricingTier = {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
};

/** A frequently asked question. */
export type Faq = {
  question: string;
  answer: string;
};

/** A customer testimonial. */
export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  business: string;
  initials: string;
};
