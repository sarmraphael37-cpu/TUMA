import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { safeNextPath } from "@/lib/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Handles every Supabase email link: sign-up confirmation and password
 * recovery. Supports the PKCE `code` flow and the `token_hash` flow so custom
 * email templates keep working.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), "/dashboard");

  const invalid = NextResponse.redirect(
    new URL("/login?status=link-invalid", origin),
  );

  if (!code && !(tokenHash && type)) {
    return invalid;
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return invalid;
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (error) {
        return invalid;
      }
    }

    return NextResponse.redirect(new URL(next, origin));
  } catch {
    return invalid;
  }
}
