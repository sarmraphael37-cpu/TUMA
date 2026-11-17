export const siteConfig = {
  name: "TUMA",
  tagline: "Your Business. Your Orders. Your Growth.",
  description:
    "TUMA is the intelligent business management platform for small businesses in Cameroon and across Africa. Track orders, stock, invoices and cash flow in one calm, AI-assisted workspace.",
  url: "https://tuma.africa",
  ogImage: "/og.png",
  locale: "en_CM",
  currency: "XAF",
  contactEmail: "hello@tuma.africa",
  supportEmail: "support@tuma.africa",
  social: {
    x: "https://x.com/tuma",
    linkedin: "https://www.linkedin.com/company/tuma",
    instagram: "https://www.instagram.com/tuma",
    facebook: "https://www.facebook.com/tuma",
  },
} as const;

export type SiteConfig = typeof siteConfig;
