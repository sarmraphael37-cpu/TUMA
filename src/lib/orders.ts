import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/types/database";

/**
 * The order vocabulary shared by the server and the browser.
 *
 * Keeping the labels, the tones and the allowed transitions in one place means
 * the list, the detail page and the server actions can never disagree about
 * what a status means or which change is legal.
 */

export type OrderStatusValue = OrderStatus;
export type PaymentStatusValue = PaymentStatus;

export type StatusTone =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "brand"
  | "neutral";

type StatusMeta = {
  label: string;
  description: string;
  tone: StatusTone;
};

/* -------------------------------------------------------------------------- */
/*  Order statuses                                                             */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS_META: Record<OrderStatusValue, StatusMeta> = {
  draft: {
    label: "Draft",
    description: "Not sent to the customer yet.",
    tone: "neutral",
  },
  pending: {
    label: "Pending",
    description: "Waiting for the shop to confirm the order.",
    tone: "warning",
  },
  confirmed: {
    label: "Confirmed",
    description: "The shop accepted the order and will prepare it.",
    tone: "info",
  },
  processing: {
    label: "Processing",
    description: "The order is being prepared.",
    tone: "brand",
  },
  completed: {
    label: "Completed",
    description: "The order was delivered and closed.",
    tone: "success",
  },
  // Historical rows only: the workspace shows them as completed.
  delivered: {
    label: "Completed",
    description: "The order was delivered and closed.",
    tone: "success",
  },
  cancelled: {
    label: "Cancelled",
    description: "The order was cancelled and will not be delivered.",
    tone: "danger",
  },
  refunded: {
    label: "Refunded",
    description: "The order was refunded.",
    tone: "neutral",
  },
};

/** The statuses a merchant can pick, in their natural workflow order. */
export const ORDER_STATUS_OPTIONS: {
  value: OrderStatusValue;
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const ORDER_STATUS_FILTERS: {
  value: OrderStatusValue | "all";
  label: string;
}[] = [{ value: "all", label: "All orders" }, ...ORDER_STATUS_OPTIONS];

export function orderStatusLabel(status: OrderStatusValue): string {
  return ORDER_STATUS_META[status]?.label ?? status;
}

export function orderStatusTone(status: OrderStatusValue): StatusTone {
  return ORDER_STATUS_META[status]?.tone ?? "neutral";
}

/* -------------------------------------------------------------------------- */
/*  Payment statuses                                                           */
/* -------------------------------------------------------------------------- */

export const PAYMENT_STATUS_META: Record<PaymentStatusValue, StatusMeta> = {
  unpaid: {
    label: "Unpaid",
    description: "No payment has been recorded for this order.",
    tone: "danger",
  },
  partial: {
    label: "Partially paid",
    description: "Only part of the amount was received.",
    tone: "warning",
  },
  awaiting_verification: {
    label: "Awaiting verification",
    description: "The customer says they paid — the shop has not verified it yet.",
    tone: "warning",
  },
  paid: {
    label: "Paid",
    description: "The shop verified the payment.",
    tone: "success",
  },
  rejected: {
    label: "Rejected",
    description: "The payment could not be verified.",
    tone: "danger",
  },
  refunded: {
    label: "Refunded",
    description: "The payment was refunded.",
    tone: "neutral",
  },
};

export const PAYMENT_STATUS_OPTIONS: {
  value: PaymentStatusValue;
  label: string;
}[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "awaiting_verification", label: "Awaiting verification" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

export const PAYMENT_STATUS_FILTERS: {
  value: PaymentStatusValue | "all";
  label: string;
}[] = [{ value: "all", label: "All payments" }, ...PAYMENT_STATUS_OPTIONS];

export function paymentStatusLabel(status: PaymentStatusValue): string {
  return PAYMENT_STATUS_META[status]?.label ?? status;
}

export function paymentStatusTone(status: PaymentStatusValue): StatusTone {
  return PAYMENT_STATUS_META[status]?.tone ?? "neutral";
}

/* -------------------------------------------------------------------------- */
/*  Transitions                                                                */
/* -------------------------------------------------------------------------- */

const ORDER_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  draft: ["pending", "cancelled"],
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  delivered: [],
  cancelled: [],
  refunded: [],
};

/** The statuses this order can move to next. */
export function nextOrderStatuses(status: OrderStatusValue): OrderStatusValue[] {
  return ORDER_TRANSITIONS[status] ?? [];
}

export function canTransitionOrder(
  from: OrderStatusValue,
  to: OrderStatusValue,
): boolean {
  return nextOrderStatuses(from).includes(to);
}

/**
 * Payment transitions.
 *
 * `paid` is terminal on purpose: once a merchant verified a payment, undoing it
 * silently would break the audit trail.
 */
const PAYMENT_TRANSITIONS: Record<PaymentStatusValue, PaymentStatusValue[]> = {
  unpaid: ["awaiting_verification", "paid"],
  partial: ["awaiting_verification", "paid", "rejected"],
  awaiting_verification: ["paid", "rejected", "unpaid"],
  paid: [],
  rejected: ["awaiting_verification", "paid"],
  refunded: [],
};

export function nextPaymentStatuses(
  status: PaymentStatusValue,
): PaymentStatusValue[] {
  return PAYMENT_TRANSITIONS[status] ?? [];
}

/** A payment needs a verification stamp when it becomes paid or rejected. */
export function requiresVerification(status: PaymentStatusValue): boolean {
  return status === "paid" || status === "rejected";
}

/* -------------------------------------------------------------------------- */
/*  Date ranges                                                                */
/* -------------------------------------------------------------------------- */

export const ORDER_RANGES = [
  { key: "all", label: "All time", days: 0 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "12m", label: "12 months", days: 365 },
] as const;

export type OrderRangeKey = (typeof ORDER_RANGES)[number]["key"];

/* -------------------------------------------------------------------------- */
/*  WhatsApp                                                                   */
/* -------------------------------------------------------------------------- */

/** Keeps only the digits of a phone number. */
export function whatsappDigits(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/[^\d]/g, "");

  // International dialling prefixes are not part of the number.
  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  return digits;
}

/**
 * Builds a `wa.me` link for one customer.
 *
 * The message is passed through `encodeURIComponent`, so the newlines, the
 * accents and the currency symbols survive the trip. Returns null when the
 * number cannot be dialled.
 */
export function buildWhatsAppLink(
  phone: string | null | undefined,
  message: string,
): string | null {
  const digits = whatsappDigits(phone);

  if (digits.length < 7 || digits.length > 15) {
    return null;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a WhatsApp share link that lets the merchant pick a chat.
 *
 * Used for the storefront link, where there is no single recipient yet.
 */
export function buildWhatsAppShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export type MessageOrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderMessageInput = {
  businessName: string;
  orderNumber: string;
  customerName: string | null;
  status: OrderStatusValue;
  paymentStatus: PaymentStatusValue;
  currency: string;
  total: number;
  placedAt: string;
  deliveryLocation: string | null;
  items: MessageOrderItem[];
  orderUrl?: string | null;
  storefrontUrl?: string | null;
  paymentVerifiedAt?: string | null;
};

function greeting(customerName: string | null): string {
  const firstName = customerName?.trim().split(/\s+/)[0];

  return firstName ? `Hello ${firstName},` : "Hello,";
}

function itemLines(items: MessageOrderItem[], currency: string): string {
  return items
    .map(
      (item) =>
        `• ${item.quantity} × ${item.name} — ${formatCurrency(
          item.lineTotal,
          currency,
        )}`,
    )
    .join("\n");
}

function paymentLine(input: OrderMessageInput): string {
  if (input.paymentStatus === "paid" && input.paymentVerifiedAt) {
    return `Payment: verified by ${input.businessName}.`;
  }

  if (input.paymentStatus === "paid") {
    return "Payment: paid (the shop still has to confirm it).";
  }

  return `Payment: ${paymentStatusLabel(input.paymentStatus).toLowerCase()}.`;
}

/**
 * The confirmation message a merchant sends after checking an order.
 *
 * It includes the order number, every product with its quantity and price, the
 * total, the delivery location and the links back to the confirmation page and
 * the shop. Nothing here claims the message was sent: opening the link only
 * prepares the text, the merchant presses send.
 */
export function buildOrderConfirmationMessage(input: OrderMessageInput): string {
  const lines = [
    greeting(input.customerName),
    "",
    `This is ${input.businessName} about your order ${input.orderNumber}.`,
    "",
    itemLines(input.items, input.currency) || "• (no items)",
    "",
    `Total: ${formatCurrency(input.total, input.currency)}`,
    `Status: ${orderStatusLabel(input.status)}`,
    paymentLine(input),
  ];

  if (input.deliveryLocation) {
    lines.push(`Delivery: ${input.deliveryLocation}`);
  }

  lines.push(`Placed on ${formatDate(input.placedAt)}.`);

  if (input.orderUrl) {
    lines.push("", `Follow this order: ${input.orderUrl}`);
  }

  if (input.storefrontUrl) {
    lines.push(`Browse the shop: ${input.storefrontUrl}`);
  }

  lines.push("", "Reply to this message if anything needs to change.");

  return lines.join("\n");
}

/**
 * The message used to chase a payment, or to confirm one.
 *
 * A paid order is only described as verified when `paymentVerifiedAt` is set.
 */
export function buildPaymentMessage(input: OrderMessageInput): string {
  const total = formatCurrency(input.total, input.currency);
  const lines = [
    greeting(input.customerName),
    "",
    `About your order ${input.orderNumber} (${total}):`,
  ];

  if (input.paymentStatus === "paid" && input.paymentVerifiedAt) {
    lines.push(
      `we verified your payment on ${formatDate(input.paymentVerifiedAt)}. Thank you.`,
    );
  } else if (input.paymentStatus === "awaiting_verification") {
    lines.push(
      "you told us the payment was sent. We are still checking it and will confirm as soon as it clears.",
    );
  } else if (input.paymentStatus === "rejected") {
    lines.push(
      "we could not verify the payment. Please contact us so we can sort it out together.",
    );
  } else if (input.paymentStatus === "paid") {
    lines.push(
      "the payment is marked as received. We will confirm it once we have checked it.",
    );
  } else {
    lines.push(
      `our records show the payment is still ${paymentStatusLabel(
        input.paymentStatus,
      ).toLowerCase()}. You can settle it in the way that suits you.`,
    );
  }

  if (input.orderUrl) {
    lines.push("", `Order details: ${input.orderUrl}`);
  }

  lines.push("", `— ${input.businessName}`);

  return lines.join("\n");
}

export type ShareProduct = {
  name: string;
  price: number;
  currency: string;
};

/**
 * The message used to share a storefront.
 *
 * The products passed in are the shop's own active products, so the message
 * carries real names and prices rather than invented ones.
 */
export function buildStorefrontShareMessage(input: {
  businessName: string;
  storefrontUrl: string;
  description?: string | null;
  products?: ShareProduct[];
}): string {
  const lines = [`${input.businessName} on TUMA`, ""];

  if (input.description) {
    lines.push(input.description, "");
  }

  lines.push(`Browse the catalogue and order here: ${input.storefrontUrl}`);

  const products = (input.products ?? []).slice(0, 3);

  if (products.length > 0) {
    lines.push("", "A few things in the shop:");
    for (const product of products) {
      lines.push(
        `• ${product.name} — ${formatCurrency(product.price, product.currency)}`,
      );
    }
  }

  return lines.join("\n");
}

/** A short message used to share one product page. */
export function buildProductShareMessage(input: {
  businessName: string;
  productName: string;
  price: number;
  currency: string;
  productUrl: string;
  description?: string | null;
}): string {
  const lines = [
    `${input.productName} at ${input.businessName}`,
    "",
    formatCurrency(input.price, input.currency),
  ];

  if (input.description) {
    lines.push("", input.description);
  }

  lines.push("", `Order it here: ${input.productUrl}`);

  return lines.join("\n");
}
