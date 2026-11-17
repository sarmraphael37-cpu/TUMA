import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Your name is required")
      .max(80, "Name is too long"),
    email,
    password,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const businessCategories = [
  { value: "retail", label: "Retail shop" },
  { value: "wholesale", label: "Wholesale & distribution" },
  { value: "food_and_beverage", label: "Food & beverage" },
  { value: "fashion_and_textiles", label: "Fashion & textiles" },
  { value: "electronics", label: "Electronics" },
  { value: "health_and_beauty", label: "Health & beauty" },
  { value: "agriculture", label: "Agriculture" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
] as const;

export type BusinessCategory = (typeof businessCategories)[number]["value"];

export const businessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Business name is required")
    .max(120, "Business name is too long"),
  category: z.enum(
    businessCategories.map((category) => category.value) as [
      BusinessCategory,
      ...BusinessCategory[],
    ],
    { message: "Choose a business category" },
  ),
  description: z
    .string()
    .trim()
    .max(2000, "Keep the description under 2,000 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a reachable phone number")
    .max(30, "Phone number is too long"),
  location: z
    .string()
    .trim()
    .min(2, "Tell us where the business operates")
    .max(160, "Location is too long"),
});

export type BusinessValues = z.infer<typeof businessSchema>;

/**
 * Categories a merchant can file a product under. Suggestions only — the field
 * stays free text so a merchant is never blocked by a missing option.
 */
export const PRODUCT_CATEGORY_SUGGESTIONS = [
  "Accessories",
  "Bags",
  "Beauty",
  "Electronics",
  "Food & Beverage",
  "Home & Garden",
  "Kids",
  "Men",
  "Shoes",
  "Sports",
  "Textiles",
  "Women",
] as const;

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Product name is required")
      .max(160, "Product name is too long"),
    sku: z
      .string()
      .trim()
      .min(1, "SKU is required")
      .max(64, "SKU is too long"),
    description: z
      .string()
      .trim()
      .max(2000, "Keep the description under 2,000 characters")
      .optional()
      .or(z.literal("")),
    category: z
      .string()
      .trim()
      .max(60, "Keep the category under 60 characters")
      .optional()
      .or(z.literal("")),
    price: z.coerce
      .number({ message: "Enter a selling price" })
      .min(0, "Price cannot be negative")
      .max(999_999_999_999, "Price is too large"),
    originalPrice: z
      .union([
        z.literal(""),
        z.coerce
          .number({ message: "Enter a valid original price" })
          .min(0, "Price cannot be negative")
          .max(999_999_999_999, "Price is too large"),
      ])
      .optional(),
    cost: z
      .union([
        z.literal(""),
        z.coerce
          .number({ message: "Enter a valid cost" })
          .min(0, "Cost cannot be negative")
          .max(999_999_999_999, "Cost is too large"),
      ])
      .optional(),
    stockQuantity: z.coerce
      .number({ message: "Enter a stock quantity" })
      .int("Use a whole number")
      .min(0, "Stock cannot be negative")
      .max(1_000_000, "Stock quantity is too large"),
    lowStockThreshold: z.coerce
      .number({ message: "Enter an alert threshold" })
      .int("Use a whole number")
      .min(0, "Threshold cannot be negative")
      .max(1_000_000, "Threshold is too large"),
    status: z.enum(["active", "archived"]).default("active"),
  })
  .superRefine((values, ctx) => {
    if (
      values.originalPrice !== undefined &&
      values.originalPrice !== "" &&
      values.originalPrice < values.price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["originalPrice"],
        message: "The original price should be higher than the selling price",
      });
    }
  });

/** Uploaded image constraints, mirrored by the Storage bucket policies. */
export const PRODUCT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type ProductValues = z.infer<typeof productSchema>;

/* -------------------------------------------------------------------------- */
/*  Storefront checkout                                                        */
/* -------------------------------------------------------------------------- */

/** One line of the shopping cart. Prices are never sent by the browser. */
export const cartLineSchema = z.object({
  product_id: z.string().uuid("That product is not valid"),
  quantity: z.coerce
    .number({ message: "Enter a valid quantity" })
    .int("Use a whole number")
    .min(1, "Quantity must be at least one")
    .max(1000, "That is more than we can ship in one order"),
});

export const cartSchema = z
  .array(cartLineSchema)
  .min(1, "Your cart is empty")
  .max(50, "Your cart has too many items");

export type CartLine = z.infer<typeof cartLineSchema>;

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(160, "That name is too long"),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Enter a phone number we can reach you on")
    .max(30, "That phone number is too long")
    .regex(/^[+\d][\d\s().-]*$/, "Enter a valid phone number"),
  deliveryLocation: z
    .string()
    .trim()
    .min(2, "Tell us where to deliver the order")
    .max(160, "That location is too long"),
  notes: z
    .string()
    .trim()
    .max(1000, "Keep the note under 1,000 characters")
    .optional()
    .or(z.literal("")),
  cart: z.string().min(2, "Your cart is empty"),
  clientToken: z
    .string()
    .trim()
    .min(8, "The checkout session expired")
    .max(80, "The checkout session expired"),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Your name is required").max(80),
  email,
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more")
    .max(1200, "Message is too long"),
});

export type ContactValues = z.infer<typeof contactSchema>;
