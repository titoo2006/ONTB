"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase browser client — anon key only (SECURITY.md §7).
 * Never the service role key: this file's contents reach the client bundle.
 *
 * Used ONLY for auth session handling on the staff screens (sign-in, sign-out,
 * session refresh). It never queries booking data directly: CLAUDE.md Rule 6
 * keeps data access in services, reached through server actions.
 *
 * Returns null rather than throwing when unconfigured, so a misconfigured
 * environment shows a sign-in error instead of a blank crashed page.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient<Database>(url, anonKey);
}
