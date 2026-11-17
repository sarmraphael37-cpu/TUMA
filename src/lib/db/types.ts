import type {
  AiGenerationStatus,
  BillingCycle,
  BusinessCategoryValue,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/types/database";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  category: BusinessCategoryValue;
  description: string | null;
  phone: string;
  location: string;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  business_id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  price: number;
  cost: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  business_id: string;
  customer_id: string | null;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  placed_at: string;
  created_at: string;
  updated_at: string;
};

export type OrderWithCustomer = Order & {
  customers: Pick<Customer, "name"> | null;
};

export type BusinessSubscription = {
  id: string;
  business_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  price: number;
  currency: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AiGeneration = {
  id: string;
  business_id: string;
  user_id: string;
  kind: string;
  prompt: string;
  response: string | null;
  model: string | null;
  tokens_used: number;
  status: AiGenerationStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlanOption = {
  value: SubscriptionPlan;
  label: string;
  monthlyPrice: number;
};

export const subscriptionPlanLabels: Record<SubscriptionPlan, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
  expired: "Expired",
};
