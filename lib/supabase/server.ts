import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { AppError, appError } from "@/lib/errors";

/**
 * Supabase server client — anon key plus the caller's session cookie.
 *
 * RLS still applies: this client acts AS the signed-in user (or as `anon` when
 * nobody is signed in). Use it for anything read on behalf of a visitor,
 * organizer, or admin. For writes that must bypass RLS — booking creation, the
 * Paymob webhook, the expiry job — use service-role.ts instead.
 *
 * CLAUDE.md Rule 6: only lib/services imports this.
 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw appError(
      AppError.SYSTEM.CONFIG_MISSING,
      "lib/supabase/server.ts",
      "createSupabaseServerClient",
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            // Spread rather than passing `options` positionally: under
            // exactOptionalPropertyTypes an absent options object is `undefined`,
            // which the cookie store's overloads reject.
            cookieStore.set({ name, value, ...(options ?? {}) });
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. Session
          // refresh is handled in middleware instead; ignoring this is correct.
        }
      },
    },
  });
}
