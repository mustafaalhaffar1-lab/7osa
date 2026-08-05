import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * Refreshes the Supabase auth session on every request and mirrors the cookies onto the
 * response so Server Components see a fresh session.
 *
 * Hardened: if env is not configured, or the Supabase call fails, we pass the request
 * through untouched rather than crash. A crashing middleware would 500 EVERY route
 * (Vercel: MIDDLEWARE_INVOCATION_FAILED) — session refresh is best-effort, not critical.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // not configured yet — never crash the app

  try {
    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Touch the user to trigger a refresh if the token is stale.
    await supabase.auth.getUser();
  } catch {
    // Network/config hiccup — proceed without a refreshed session.
    return NextResponse.next({ request });
  }

  return response;
}
