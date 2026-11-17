import {
  BarChart3,
  Boxes,
  BrainCircuit,
  CreditCard,
  FileText,
  HelpCircle,
  LineChart,
  Lock,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type {
  Faq,
  Feature,
  NavLink,
  PricingTier,
  Stat,
  Step,
  Testimonial,
} from "@/types";

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                */
/* -------------------------------------------------------------------------- */

export const primaryNavLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const footerLinks: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Product demo", href: "#demo" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Why TUMA", href: "#solution" },
      { label: "Customers", href: "#customers" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "mailto:hello@tuma.africa" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Security", href: "#security" },
      {
        label: "Help centre",
        href: "mailto:support@tuma.africa?subject=TUMA%20support",
      },
      {
        label: "Request a walkthrough",
        href: "mailto:hello@tuma.africa?subject=TUMA%20walkthrough",
      },
      {
        label: "Early access",
        href: "mailto:hello@tuma.africa?subject=TUMA%20early%20access",
      },
    ],
  },
  {
    title: "Talk to us",
    links: [
      { label: "hello@tuma.africa", href: "mailto:hello@tuma.africa" },
      { label: "support@tuma.africa", href: "mailto:support@tuma.africa" },
      {
        label: "Partner with TUMA",
        href: "mailto:partners@tuma.africa?subject=TUMA%20partnership",
      },
      {
        label: "Press & media",
        href: "mailto:press@tuma.africa?subject=TUMA%20press%20enquiry",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

export const heroContent = {
  badge: "Private beta · Built in Cameroon",
  title: "Run your business with total clarity.",
  titleAccent: "total clarity",
  description:
    "TUMA unifies your orders, stock, invoices and cash flow into one intelligent workspace — so you spend less time chasing spreadsheets and more time growing.",
  primaryCta: { label: "Start free", href: "/register" },
  secondaryCta: { label: "See how it works", href: "#how-it-works" },
  reassurance: "Free 14-day trial · No credit card · Cancel anytime",
};

export const heroStats: Stat[] = [
  {
    label: "Businesses on TUMA",
    value: "1,200+",
    detail: "Across Cameroon and 6 African markets",
  },
  {
    label: "Admin time saved",
    value: "38%",
    detail: "Average reduction in manual work per week",
  },
  {
    label: "Invoices paid faster",
    value: "2.4×",
    detail: "Compared with paper and spreadsheet billing",
  },
  {
    label: "Platform uptime",
    value: "99.95%",
    detail: "Measured across the last 12 months",
  },
];

/* -------------------------------------------------------------------------- */
/*  Product preview                                                           */
/* -------------------------------------------------------------------------- */

export const productPreviewContent = {
  eyebrow: "The workspace",
  title: "Everything that runs your business, in one view.",
  description:
    "A calm, fast dashboard that turns daily operations into clear next actions — no training manual required.",
};

export const dashboardKpis = [
  { label: "Revenue today", value: "1,284,500 XAF", delta: "+12.4%", trend: "up" },
  { label: "Open orders", value: "38", delta: "+6 new", trend: "up" },
  { label: "Low-stock items", value: "7", delta: "-3 this week", trend: "down" },
  { label: "Overdue invoices", value: "4", delta: "2.4M XAF", trend: "up" },
] as const;

export const revenueSeries = [
  { month: "Jan", revenue: 620000, orders: 410 },
  { month: "Feb", revenue: 745000, orders: 462 },
  { month: "Mar", revenue: 702000, orders: 438 },
  { month: "Apr", revenue: 890000, orders: 521 },
  { month: "May", revenue: 1015000, orders: 588 },
  { month: "Jun", revenue: 968000, orders: 560 },
  { month: "Jul", revenue: 1180000, orders: 642 },
  { month: "Aug", revenue: 1342000, orders: 701 },
  { month: "Sep", revenue: 1276000, orders: 674 },
  { month: "Oct", revenue: 1489000, orders: 768 },
  { month: "Nov", revenue: 1624000, orders: 812 },
  { month: "Dec", revenue: 1786000, orders: 879 },
];

export const recentOrders = [
  {
    id: "ORD-2041",
    customer: "Boutique Kana",
    items: "Ankara fabric · 12 yards",
    total: "144,000 XAF",
    status: "Delivered",
    payment: "Paid",
  },
  {
    id: "ORD-2042",
    customer: "Super U Bastos",
    items: "Rice 25kg · 40 bags",
    total: "860,000 XAF",
    status: "In transit",
    payment: "Pending",
  },
  {
    id: "ORD-2043",
    customer: "MTN Agency Buea",
    items: "POS rolls · 120 units",
    total: "96,000 XAF",
    status: "Processing",
    payment: "Paid",
  },
  {
    id: "ORD-2044",
    customer: "Pharmacie du Centre",
    items: "Vitamin C · 200 units",
    total: "340,000 XAF",
    status: "Quote sent",
    payment: "Unpaid",
  },
  {
    id: "ORD-2045",
    customer: "Restaurant Le Boreal",
    items: "Cooking oil · 30 cartons",
    total: "512,000 XAF",
    status: "Delivered",
    payment: "Partial",
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Problem / solution                                                        */
/* -------------------------------------------------------------------------- */

export type PainPoint = {
  title: string;
  description: string;
};

export const painPoints: PainPoint[] = [
  {
    title: "Orders live in too many places",
    description:
      "WhatsApp chats, paper notebooks and memory. When a customer calls, nobody has the full picture.",
  },
  {
    title: "Stockouts always arrive by surprise",
    description:
      "You find out a product is gone at the exact moment a customer is ready to pay.",
  },
  {
    title: "Cash flow is a month-end mystery",
    description:
      "Invoices, mobile money and bank transfers sit in separate threads with no single total.",
  },
  {
    title: "Reporting takes days, not minutes",
    description:
      "By the time the spreadsheet is finished, the decision it was meant to inform has passed.",
  },
];

export const solutionContent = {
  eyebrow: "The solution",
  title: "One system for the whole business.",
  description:
    "TUMA connects every order, product, invoice and payment to a single live ledger. Your team sees the same numbers, customers get faster answers, and you always know where the business stands.",
  bullets: [
    {
      title: "A shared source of truth",
      description:
        "Every order updates stock, invoicing and revenue at the same time — no re-typing, no mismatches.",
    },
    {
      title: "Built for how Africa trades",
      description:
        "Mobile money, cash, bank transfer and partial payments tracked side by side, in XAF and major currencies.",
    },
    {
      title: "Fast by default",
      description:
        "A workspace that opens in seconds on ordinary connections, designed for phones as much as desktops.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Features                                                                  */
/* -------------------------------------------------------------------------- */

export const featuresContent = {
  eyebrow: "Core features",
  title: "Everything a growing business needs.",
  description:
    "Start with what you need today and switch on more as you grow. Every module shares the same data, so nothing ever needs to be entered twice.",
  features: [
    {
      icon: PackageCheck,
      title: "Order management",
      description:
        "Quotes, sales orders, delivery and returns in one pipeline. See status, margin and history for every order at a glance.",
    },
    {
      icon: Boxes,
      title: "Inventory & stock",
      description:
        "Live stock levels, automatic deductions on sale, low-stock alerts and supplier lead times that keep shelves full.",
    },
    {
      icon: FileText,
      title: "Invoicing & billing",
      description:
        "Professional invoices in seconds, with tax, discounts and payment terms. Send by WhatsApp or email with one tap.",
    },
    {
      icon: Wallet,
      title: "Payments & mobile money",
      description:
        "Track cash, mobile money, cards and bank transfers against each invoice. Partial payments and balances stay visible.",
    },
    {
      icon: BrainCircuit,
      title: "AI insights",
      description:
        "Plain-language answers to questions like “which product made the most profit this month?” — no analyst required.",
    },
    {
      icon: BarChart3,
      title: "Analytics & reports",
      description:
        "Revenue, margins, top customers and stock movement in dashboards your whole team can read and act on.",
    },
    {
      icon: Users,
      title: "Team & permissions",
      description:
        "Give every person the right level of access. Cashiers, warehouse staff and managers each see their own workspace.",
    },
    {
      icon: ShieldCheck,
      title: "Security & backups",
      description:
        "Encrypted data, role-based access and daily backups. Export everything you own at any time, in one click.",
    },
    {
      icon: Smartphone,
      title: "Works anywhere",
      description:
        "A fast mobile experience for the field and the shop floor, with offline-friendly flows for low-connectivity areas.",
    },
  ] satisfies Feature[],
};

/* -------------------------------------------------------------------------- */
/*  How it works                                                              */
/* -------------------------------------------------------------------------- */

export const howItWorksContent = {
  eyebrow: "How it works",
  title: "Up and running in an afternoon.",
  description:
    "No consultants, no long migrations. Bring your products and customers, and TUMA handles the rest.",
  steps: [
    {
      step: "01",
      title: "Connect your business",
      description:
        "Import products and customers from a spreadsheet, or start fresh with guided setup. Invite your team in minutes.",
    },
    {
      step: "02",
      title: "Run orders end-to-end",
      description:
        "Create a quote, convert it to an invoice, take payment and track delivery. Stock and revenue update automatically.",
    },
    {
      step: "03",
      title: "Grow with insight",
      description:
        "Read your dashboards, spot what is working, and act on AI recommendations tailored to your numbers.",
    },
  ] satisfies Step[],
};

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                   */
/* -------------------------------------------------------------------------- */

export const pricingContent = {
  eyebrow: "Pricing",
  title: "Simple pricing that scales with you.",
  description:
    "Start free for 14 days. Switch plans or cancel any time — your data stays yours.",
  currency: "XAF",
  tiers: [
    {
      name: "Starter",
      monthlyPrice: 10000,
      annualPrice: 8000,
      description: "For solo businesses getting organised.",
      features: [
        "Up to 3 team members",
        "500 orders per month",
        "Inventory & stock alerts",
        "Invoicing & mobile money",
        "Email support",
      ],
      cta: "Start with Starter",
      highlighted: false,
    },
    {
      name: "Growth",
      monthlyPrice: 25000,
      annualPrice: 20000,
      description: "For growing shops and teams.",
      features: [
        "Up to 10 team members",
        "Unlimited orders",
        "AI insights & recommendations",
        "Advanced analytics & exports",
        "Multi-location stock",
        "Priority chat support",
      ],
      cta: "Start with Growth",
      highlighted: true,
    },
    {
      name: "Scale",
      monthlyPrice: 60000,
      annualPrice: 48000,
      description: "For multi-branch operations.",
      features: [
        "Unlimited team members",
        "Multi-branch consolidation",
        "Custom roles & permissions",
        "Accounting integrations",
        "Dedicated success manager",
        "99.95% uptime SLA",
      ],
      cta: "Start with Scale",
      highlighted: false,
    },
  ] satisfies PricingTier[],
};

/* -------------------------------------------------------------------------- */
/*  Testimonials                                                              */
/* -------------------------------------------------------------------------- */

export const testimonialsContent = {
  eyebrow: "Customers",
  title: "Trusted by businesses that move fast.",
  description:
    "From boutiques in Douala to agencies in Buea, teams use TUMA to run clearer, faster operations.",
  testimonials: [
    {
      quote:
        "Before TUMA, I was writing orders in a notebook and hoping I remembered every customer. Now I see all 40 open orders on my phone while I am still with the customer.",
      name: "Sandrine Mbarga",
      role: "Founder",
      business: "Boutique Kana, Douala",
      initials: "SM",
    },
    {
      quote:
        "Stockouts used to cost us at least one big sale a week. The low-stock alerts alone paid for the subscription in the first month.",
      name: "Bruno Tchoumi",
      role: "Operations Manager",
      business: "Super U Bastos",
      initials: "BT",
    },
    {
      quote:
        "The AI insights told me which product lines were actually profitable. I cut two that looked healthy on paper and margins improved within a quarter.",
      name: "Aisha Ndi",
      role: "Owner",
      business: "Pharmacie du Centre, Yaoundé",
      initials: "AN",
    },
  ] satisfies Testimonial[],
};

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                       */
/* -------------------------------------------------------------------------- */

export const faqContent = {
  eyebrow: "FAQ",
  title: "Questions, answered.",
  description:
    "Everything you need to know before you start. Can't find an answer? Email hello@tuma.africa.",
  faqs: [
    {
      question: "What exactly is TUMA?",
      answer:
        "TUMA is a cloud business management platform for small businesses. It combines order management, inventory, invoicing, payment tracking and analytics in one workspace, with AI assistance to help you understand your numbers.",
    },
    {
      question: "Do I need to install anything?",
      answer:
        "No. TUMA runs in your browser and works well on a phone. There is nothing to install, update or maintain — new features arrive automatically.",
    },
    {
      question: "Which payment methods can I track?",
      answer:
        "Cash, mobile money (MTN Mobile Money, Orange Money and others), bank transfers, cards and partial payments. You can record any combination against an invoice and see the outstanding balance.",
    },
    {
      question: "Is my business data safe?",
      answer:
        "Yes. Data is encrypted in transit and at rest, access is role-based, and we take daily backups. You can export all of your data at any time, and we never sell it.",
    },
    {
      question: "What happens if my internet connection is unstable?",
      answer:
        "TUMA is built to load quickly on ordinary connections. Actions taken on mobile queue safely and sync when you are back online, so a dropped connection never loses an order.",
    },
    {
      question: "How does the 14-day free trial work?",
      answer:
        "Create an account and use the Growth plan free for 14 days. No credit card is required. At the end of the trial you choose a plan, or your account simply switches to read-only access — nothing is deleted.",
    },
  ] satisfies Faq[],
};

/* -------------------------------------------------------------------------- */
/*  Trust / assurance strip                                                   */
/* -------------------------------------------------------------------------- */

export const assuranceItems: { icon: LucideIcon; label: string }[] = [
  { icon: Lock, label: "Encrypted in transit & at rest" },
  { icon: ShieldCheck, label: "Role-based access control" },
  { icon: RefreshCcw, label: "Daily automatic backups" },
  { icon: CreditCard, label: "No credit card to start" },
  { icon: LineChart, label: "Real-time business analytics" },
  { icon: HelpCircle, label: "Human support in French & English" },
];
