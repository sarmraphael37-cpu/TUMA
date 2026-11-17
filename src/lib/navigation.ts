/** Only allow same-origin, path-relative redirects. */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  if (/[\u0000-\u001f]/.test(value)) {
    return fallback;
  }

  return value;
}
