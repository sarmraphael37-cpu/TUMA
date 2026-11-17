/**
 * Dashboard date ranges. This module is intentionally free of any server-only
 * import so both the server data layer and the client-side filter can use it.
 */

export const DASHBOARD_RANGES = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "12m", label: "12 months", days: 365 },
] as const;

export type RangeKey = (typeof DASHBOARD_RANGES)[number]["key"];

export type ResolvedRange = {
  key: string;
  label: string;
  from: string;
  to: string;
  days: number;
  bucket: "day" | "week" | "month";
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value) && /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
}

/**
 * Turns the `range` / `from` / `to` query parameters into a concrete window.
 * Custom ranges are validated; anything unusable falls back to the last
 * 30 days so the dashboard always renders real data.
 */
export function resolveDashboardRange(input: {
  range?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  const now = new Date();
  const today = endOfUtcDay(now);

  if (isIsoDate(input.from) && isIsoDate(input.to)) {
    const customFrom = startOfUtcDay(new Date(`${input.from}T00:00:00.000Z`));
    const customTo = endOfUtcDay(new Date(`${input.to}T00:00:00.000Z`));

    if (
      !Number.isNaN(customFrom.getTime()) &&
      !Number.isNaN(customTo.getTime()) &&
      customFrom <= customTo
    ) {
      const days = Math.max(
        1,
        Math.round((customTo.getTime() - customFrom.getTime()) / DAY_MS),
      );

      return {
        key: "custom",
        label: "Custom range",
        from: customFrom.toISOString(),
        to: customTo.toISOString(),
        days,
        bucket: days <= 45 ? "day" : days <= 210 ? "week" : "month",
      };
    }
  }

  const preset =
    DASHBOARD_RANGES.find((entry) => entry.key === input.range) ??
    DASHBOARD_RANGES[1];

  const from = startOfUtcDay(
    new Date(today.getTime() - (preset.days - 1) * DAY_MS),
  );

  return {
    key: preset.key,
    label: `Last ${preset.label}`,
    from: from.toISOString(),
    to: today.toISOString(),
    days: preset.days,
    bucket: preset.days <= 45 ? "day" : preset.days <= 210 ? "week" : "month",
  };
}
