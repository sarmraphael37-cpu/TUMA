/**
 * Detects the "the database schema has not been installed yet" condition.
 *
 * PostgREST answers a query against a missing table with
 * `PGRST205` ("Could not find the table … in the schema cache"); Postgres
 * itself answers `42P01` (relation does not exist). Both mean the same thing
 * here: `supabase/migrations` has not been applied to the project yet.
 */

const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01", "42883"]);

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export function isMissingSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as SupabaseError;

  if (candidate.code && MISSING_TABLE_CODES.has(candidate.code)) {
    return true;
  }

  return /could not find the table|does not exist|schema cache/i.test(
    `${candidate.message ?? ""} ${candidate.details ?? ""} ${candidate.hint ?? ""}`,
  );
}

let schemaWarningShown = false;

/**
 * Logs the missing-schema condition once per process, with the exact command
 * that fixes it, instead of dumping a raw PostgREST error on every request.
 */
export function reportMissingSchema(context: string): void {
  if (schemaWarningShown) {
    return;
  }

  schemaWarningShown = true;

  console.warn(
    `[TUMA] The Supabase schema is not installed yet (${context}). ` +
      `Apply supabase/migrations with "npm run db:migrate" ` +
      `(or run docs/apply-migrations.sql in the Supabase SQL editor), then retry.`,
  );
}
