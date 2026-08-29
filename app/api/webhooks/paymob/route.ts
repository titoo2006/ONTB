/**
 * Paymob payment webhook — the ONLY authoritative confirmation path.
 * SECURITY.md §1 (P0). PRD_Phase1.md Screen 4.
 *
 * CLAUDE.md Rule 18 — who may trigger this write surface: Paymob's servers only,
 * proven by HMAC signature. Never a guest, never a browser, never the redirect.
 *
 * Non-negotiable order of checks before anything is written:
 *   1. Verify the HMAC signature. Reject AND LOG on failure — never silently drop.
 *   2. Look up the pending_payment booking.
 *   3. Compare the payload's charged amount against the amount stored on that row.
 *      A mismatch is rejected and flagged for manual review, never accepted.
 *   4. Idempotency: an already-confirmed booking short-circuits — no second email,
 *      no second commission-split write.
 *
 * SCAFFOLD STUB — not built yet.
 */

// TODO(scaffold): export async function POST(request: Request).
export {};
