import "server-only";

/**
 * Supabase service-role client — BYPASSES ROW LEVEL SECURITY.
 *
 * `import "server-only"` above makes importing this from a client component a build
 * error rather than a silent key leak (SECURITY.md §7).
 *
 * Legitimate callers (SECURITY.md §3, §4):
 *   - booking creation / capacity transaction (guests have no direct table access)
 *   - the Paymob webhook handler
 *   - the 30-minute no-show expiry job
 *
 * Not legitimate: reading data on behalf of a signed-in organizer or admin — those
 * go through lib/supabase/server.ts so RLS is still enforced.
 *
 * SCAFFOLD STUB.
 */

// TODO(scaffold): createClient using SUPABASE_SERVICE_ROLE_KEY, auth persistence off.
export {};
