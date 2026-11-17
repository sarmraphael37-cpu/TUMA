export type BusinessCategoryValue =
  | "retail"
  | "wholesale"
  | "food_and_beverage"
  | "fashion_and_textiles"
  | "electronics"
  | "health_and_beauty"
  | "agriculture"
  | "services"
  | "other";

export type ProductStatus = "active" | "archived";

export type OrderStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "processing"
  | "completed"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "awaiting_verification"
  | "paid"
  | "rejected"
  | "refunded";

export type AiGenerationStatus = "pending" | "completed" | "failed";

export type SubscriptionPlan = "starter" | "growth" | "scale";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type BillingCycle = "monthly" | "annual";
