/**
 * Helpers for mapping the API's Zod field errors onto form inputs.
 *
 * The API keys errors by the full Zod path (for example `input.productName`),
 * so a form field looks up both the prefixed and the plain key.
 */

export type AiFieldErrors = Record<string, string[] | undefined>;

export function aiFieldError(
  errors: AiFieldErrors | undefined,
  field: string,
): string | undefined {
  if (!errors) {
    return undefined;
  }

  return errors[`input.${field}`]?.[0] ?? errors[field]?.[0];
}

export function aiFirstErrorMessage(
  errors: AiFieldErrors | undefined,
): string | undefined {
  if (!errors) {
    return undefined;
  }

  for (const messages of Object.values(errors)) {
    if (messages && messages.length > 0) {
      return messages[0];
    }
  }

  return undefined;
}
