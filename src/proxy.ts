import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);
const PROTECTED_PAGES = ["/dashboard", "/onboarding"];

function isProtected(pathname: string) {
  return PROTECTED_PAGES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function withRefreshedCookies(source: NextResponse, target: NextResponse) {
  const setCookies = (
    source.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.();

  if (setCookies) {
    for (const cookie of setCookies) {
      target.headers.append("set-cookie", cookie);
    }
  }

  return target;
}

/**
 * Refreshes the Supabase session on authenticated routes and performs
 * optimistic redirects. Server Components and Server Actions still validate
 * every session and every business id — this is not the security boundary.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedRoute = isProtected(pathname);
  const authPage = AUTH_PAGES.has(pathname);
  const resetPage = pathname === "/reset-password";

  if (!protectedRoute && !authPage && !resetPage) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  let user = null;

  try {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch {
    // A network blip should not lock a merchant out of the marketing site.
    return response;
  }

  if (!user) {
    if (protectedRoute) {
      const next = `${pathname}${request.nextUrl.search}`;
      return withRefreshedCookies(
        response,
        NextResponse.redirect(
          new URL(`/login?next=${encodeURIComponent(next)}`, request.url),
        ),
      );
    }

    if (resetPage) {
      return withRefreshedCookies(
        response,
        NextResponse.redirect(
          new URL("/forgot-password?status=link-expired", request.url),
        ),
      );
    }

    return response;
  }

  if (authPage) {
    return withRefreshedCookies(
      response,
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  if (protectedRoute) {
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!error) {
      if (!business && pathname !== "/onboarding") {
        return withRefreshedCookies(
          response,
          NextResponse.redirect(new URL("/onboarding", request.url)),
        );
      }

      if (business && pathname === "/onboarding") {
        return withRefreshedCookies(
          response,
          NextResponse.redirect(new URL("/dashboard", request.url)),
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/dashboard/:path*",
  ],
};
