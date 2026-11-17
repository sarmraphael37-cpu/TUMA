export type PlatformRole = "super_admin" | "support" | "analyst";

export type Capability =
  | "platform.read"
  | "merchants.read"
  | "merchants.suspend"
  | "users.read"
  | "users.manageAdmins"
  | "products.read"
  | "orders.read"
  | "subscriptions.read"
  | "subscriptions.manage"
  | "payments.read"
  | "ai.read"
  | "announcements.read"
  | "announcements.manage"
  | "support.read"
  | "support.reply"
  | "support.delete"
  | "settings.read"
  | "settings.manage"
  | "reports.export"
  | "audit.read";

const ALL: Capability[] = [
  "platform.read",
  "merchants.read",
  "merchants.suspend",
  "users.read",
  "users.manageAdmins",
  "products.read",
  "orders.read",
  "subscriptions.read",
  "subscriptions.manage",
  "payments.read",
  "ai.read",
  "announcements.read",
  "announcements.manage",
  "support.read",
  "support.reply",
  "support.delete",
  "settings.read",
  "settings.manage",
  "reports.export",
  "audit.read",
];

const SUPPORT_CAPS: Capability[] = [
  "platform.read",
  "merchants.read",
  "products.read",
  "orders.read",
  "subscriptions.read",
  "payments.read",
  "ai.read",
  "announcements.read",
  "announcements.manage",
  "support.read",
  "support.reply",
  "reports.export",
];

const ANALYST_CAPS: Capability[] = [
  "platform.read",
  "merchants.read",
  "products.read",
  "orders.read",
  "subscriptions.read",
  "payments.read",
  "ai.read",
  "announcements.read",
  "support.read",
  "reports.export",
];

const ROLE_CAPS: Record<PlatformRole, Capability[]> = {
  super_admin: ALL,
  support: SUPPORT_CAPS,
  analyst: ANALYST_CAPS,
};

export function hasCapability(role: PlatformRole, capability: Capability): boolean {
  return ROLE_CAPS[role].includes(capability);
}

export function capabilitiesFor(role: PlatformRole): Capability[] {
  return ROLE_CAPS[role];
}

export const roleLabels: Record<PlatformRole, string> = {
  super_admin: "Super admin",
  support: "Support",
  analyst: "Analyst",
};

export const roleDescriptions: Record<PlatformRole, string> = {
  super_admin: "Full control over the platform, including staff and audit logs.",
  support: "Support tickets, announcements and read access to platform data.",
  analyst: "Read-only access to platform monitoring and exports.",
};
