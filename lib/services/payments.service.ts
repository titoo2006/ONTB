/**
 * Paymob payment intent creation and webhook settlement.
 *
 * SECURITY.md §1 — the webhook is the ONLY thing that marks a booking confirmed.
 * The client-side redirect back from Paymob confirms nothing. Before confirming:
 *   - verify the HMAC signature; reject AND LOG failures (never silently drop)
 *   - compare the webhook's charged amount against the pending_payment row; a
 *     mismatch is rejected and flagged for manual review, never accepted
 *   - be idempotent — a retried webhook must not double-send email or double-write
 *     the commission split
 *
 * CLAUDE.md Rule 9 — payments are append-only. No .delete(), ever.
 *
 * SCAFFOLD STUB.
 */

// TODO(scaffold): createPaymentIntent(), verifyWebhookSignature(), settleWebhook().
export {};
