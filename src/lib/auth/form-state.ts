export type FormStatus = "idle" | "error" | "success";

export type FormState = {
  status: FormStatus;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const emptyFormState: FormState = { status: "idle" };

/** Collapses a Zod error into a serialisable field map for forms. */
export function toFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return fieldErrors;
}
