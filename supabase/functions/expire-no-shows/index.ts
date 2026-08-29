/**
 * No-show expiry job — Supabase Edge Function, cron-triggered.
 * context.md §3 rule 6, SECURITY.md §4 (P0).
 *
 * CLAUDE.md Rule 18 — who may trigger this write surface: the cron schedule only.
 * Not a guest, not an organizer, not an admin, not any client request. Nothing a
 * browser can reach may influence it.
 *
 * What it does, and strictly nothing more:
 *   - moves `confirmed` bookings to `expired` once 30 minutes past the trip's
 *     scheduled departure with no check-in
 *   - never touches a `checked_in` booking
 *   - never touches a `payments` row and runs NO refund logic — the no-refund
 *     policy is decided (context.md §9); expiry is an operational cutoff, not a
 *     financial transaction
 *   - writes an audit_log row per expired booking
 *
 * SCAFFOLD STUB — not built yet.
 */

export {};
