import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError, appError } from "@/lib/errors";

/**
 * Supabase service-role client — BYPASSES ROW LEVEL SECURITY.
 *
 * `import "server-only"` above makes importing this from a client component a
 * build error rather than a silent key leak (SECURITY.md §7).
 *
 * Legitimate callers (SECURITY.md §3, §4):
 *   - booking creation / capacity transaction (guests have no direct table access)
 *   - the Paymob webhook handler
 *   - the 30-minute no-show expiry job
 *   - reading internal config that the browser must not see, e.g. fx_rates
 *
 * Not legitimate: reading data on behalf of a signed-in organizer or admin —
 * those go through lib/supabase/server.ts so RLS is still enforced.
 *
 * CLAUDE.md Rule 6: only lib/services imports this.
 */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw appError(
      AppError.SYSTEM.CONFIG_MISSING,
      "lib/supabase/service-role.ts",
      "createSupabaseServiceRoleClient",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      // No user session is involved and nothing should be persisted or refreshed
      // on a server client — it acts as the system, not as a person.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
