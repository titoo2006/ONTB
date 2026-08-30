import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on staff routes.
 *
 * Without this, an organizer's access token expires mid-shift and their next
 * action fails for no visible reason. DESIGN.md §6 and SECURITY.md §9 both
 * assume an organizer stays signed in across a full operating day while checking
 * guests in continuously — that only holds if something refreshes the token.
 *
 * Scoped to /organizer and /admin only. Guest routes are anonymous and have no
 * session to refresh; running this on them would add a pointless auth round trip
 * to every trip listing view.
 *
 * This ONLY refreshes. It performs no authorisation: being signed in is not the
 * same as being an organizer, and that check belongs in the route, where an
 * unauthorised caller can be given a 404 rather than a redirect that confirms
 * the route exists (Rule 10).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set({ name, value, ...(options ?? {}) });
        }
      },
    },
  });

  // Touching getUser() is what performs the refresh. Its result is deliberately
  // ignored here — see the note about authorisation above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/organizer/:path*", "/admin/:path*"],
};
