const DEFAULT_LOCALE = "fr-CM";
const DEFAULT_CURRENCY = "XAF";

/** Formats a number as currency using the Central African CFA franc by default. */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formats a number with thousands separators. */
export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Formats a number in compact form, e.g. 1_200 -> "1.2K". */
export function formatCompactNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Formats a number as a signed percentage, e.g. 12.4 -> "+12.4%". */
export function formatPercent(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** Formats a number as a compact currency, e.g. 1_250_000 -> "1,3 M F CFA". */
export function formatCompactCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Formats an ISO timestamp as a calendar date. The time zone is pinned to UTC
 * so the server and the browser always render the same string.
 */
export function formatDate(
  value: string | Date,
  locale: string = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "UTC",
  }).format(date);
}

/** Formats an ISO timestamp as a short date, e.g. "12 mai". */
export function formatShortDate(value: string | Date): string {
  return formatDate(value, DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
  });
}

/** Formats an ISO timestamp as date and time, e.g. "12 mai 2026, 14:05". */
export function formatDateTime(value: string | Date): string {
  return formatDate(value, DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats the change between two periods. Returns `null` when there is no
 * baseline to compare against, so the UI never renders a misleading 0 %.
 */
export function formatDelta(current: number, previous: number): string | null {
  if (!previous) {
    return null;
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const sign = change > 0 ? "+" : "";

  return `${sign}${change.toFixed(1)}%`;
}

/** Relative time, e.g. "il y a 3 jours" / "3 days ago". */
export function formatRelativeTime(
  value: string | Date,
  locale: string = DEFAULT_LOCALE,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();

  if (Number.isNaN(diffMs)) {
    return "—";
  }

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) {
      return formatter.format(Math.round(diffMs / ms), unit);
    }
  }

  return formatter.format(0, "minute");
}
