# SECURITY.md — Technical Security Specification
## Nile Booking — Nile Yacht Trip Booking Platform

## Priority Legend
🔴 P0 — must be in place before Phase 1 launch, no exceptions.
🟠 P1 — must be in place before scaling beyond initial launch volume.
🟡 P2 — important, can follow shortly after launch with a stated date.

---

## 1. Payment Webhook Verification 🔴 P0

The Paymob (or chosen gateway) webhook is the **only** authoritative source for
marking a booking `confirmed` — never the client-side redirect (PRD_Phase1.md,
Screen 4).

- Verify the webhook's HMAC signature against the gateway's documented method before
  trusting any field in the payload. Reject and log (don't silently drop) any request
  that fails signature verification.
- The webhook handler must be idempotent — a retried webhook for an already-confirmed
  booking must not double-process (e.g. double-send confirmation email, double-write
  the commission split).
- Amount charged in the webhook payload must be compared against the amount stored on
  the `pending_payment` booking row before confirming — a mismatch is rejected and
  flagged for manual review, not silently accepted.

---

## 2. Booking Code Design — Non-Enumerable 🔴 P0

- Booking codes are random (not sequential, not derived from booking ID, timestamp,
  or guest info) — e.g. an 8-character code from an unambiguous charset (excluding
  `0/O`, `1/I/l` etc.).
- A booking code alone should not leak PII when looked up by an unauthenticated
  party — the guest-facing "view my ticket" flow (if added later) must require the
  code *plus* a second factor (e.g. email used at booking), not the code alone,
  since a leaked or guessed code should not expose a stranger's name/phone/trip.
- The organizer check-in search is authenticated (organizer role required) — it is
  not a public lookup, so this is a defense-in-depth measure, not the only control.

---

## 3. Row Level Security (RLS) 🔴 P0

RLS is enabled on every table from the first migration. Design intent per table:

- `bookings` — guests have no direct table access (all reads/writes go through
  server actions using the service role, never the anon/authenticated key from the
  browser). Organizers can `select` bookings for trips at their assigned yacht only
  (or all, if unassigned) and `update` only the check-in fields, only via a
  `security definer` function that enforces the status-transition rules (can't
  check in an already-expired booking, etc. — see §4). Admins have broader `select`
  access for the dashboard, still no direct `update`/`delete` outside defined
  functions.
- `payments` — no client-side access at all, service role only.
- `trip_instances` — public `select` (needed for the listing/details screens),
  writes restricted to admin.
- `audit_log` — insert-only from server-side actions, `select` restricted to admin.

Never suggest disabling RLS to unblock a query — the fix is always to correct the
policy (CLAUDE.md Rule 10).

---

## 4. Check-In & No-Show Expiry Are System-Controlled Writes 🔴 P0

- Check-in is only performed via a `security definer` function that validates: the
  booking exists, its trip hasn't already been marked expired, it isn't already
  checked in, and the caller is an active organizer for the relevant yacht. Direct
  table `update` from the client is not possible under RLS.
- The 30-minute no-show expiry (context.md §3) runs as a scheduled server-side job
  (e.g. Supabase Edge Function on a cron trigger), not something a client can trigger
  or influence. It only ever moves bookings from `confirmed` to `expired` — it never
  touches `checked_in` bookings, and it never touches payment records (no refund
  logic runs, per the decided no-refund policy — context.md §9).
- Per CLAUDE.md Rule 18: every write-capable RLS policy or security-definer function
  added must have a comment stating exactly who can trigger it and why.

---

## 5. Rate Limiting 🟠 P1

- Checkout endpoint: rate-limited per IP to prevent automated seat-hoarding
  (repeatedly creating `pending_payment` bookings that are never paid, which could
  otherwise be used to make a trip falsely appear sold out). Expire unpaid
  `pending_payment` bookings quickly (e.g. 15 minutes) and release the held seats.
- Organizer/admin login: standard rate limiting on auth attempts (Supabase Auth's
  built-in protections, confirm they're enabled, don't assume).

---

## 6. Input Validation — Client AND Server 🔴 P0

All booker info (name, email, phone, nationality, headcount) is validated
server-side in `lib/validators.ts` before reaching a service, regardless of
client-side validation already run. Headcount is bounds-checked against both a
sane per-booking maximum and actual remaining trip capacity (context.md §5).

---

## 7. Secrets & Environment Variables 🔴 P0

- Paymob secret/API key and the Supabase **service role** key are server-only
  environment variables, never exposed to the client bundle. Only the Supabase
  anon/public key and any Paymob publishable/iframe key are ever shipped to the
  browser.
- No key is ever hardcoded in source, including in test/seed scripts.

---

## 8. PII & Data Handling 🟠 P1

- Guest PII collected is limited to what's operationally needed: name, email, phone,
  nationality, headcount. No passport numbers or ID document collection in Phase 1 —
  don't add fields "in case they're needed later."
- Guest email/phone are used for booking confirmation and support only — no
  marketing use without a separate, explicit opt-in (relevant given guests are
  international and subject to their home country's data protection expectations,
  not only Egyptian law).
- Admin dashboard's nationality breakdown is aggregate-only; it must not become a
  de-facto guest-lookup-by-nationality tool without a stated business need.

---

## 9. Session & Auth Management 🟠 P1

- Organizer and admin sessions use Supabase Auth's standard session handling; no
  custom token storage in `localStorage`.
- Admin sessions should have a shorter idle timeout than organizer sessions — a
  logged-in admin dashboard left open unattended is a higher-value target than a
  logged-in check-in screen. Exact durations: decide during implementation, but
  admin should be materially shorter (e.g. 30 min idle vs. a full operating-day
  session for organizers, who are checking guests in continuously all day and
  shouldn't be logged out mid-shift).

---

## 10. Dependency Vulnerability Scanning 🟡 P2

Enable Dependabot (or equivalent) on the repository from the start; review and merge
security patches promptly rather than batching them for a later cleanup sweep.

---

## 11. Security Headers (Web) 🟡 P2

Standard headers via Next.js middleware/config once the app is otherwise stable:
CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS (once on a stable
production domain).

---

## Cross-Reference: Audit Logging

Every state-changing action on a booking (creation, payment confirmation, check-in,
expiry) writes an `audit_log` row — actor, action, entity, entity_id, timestamp,
relevant metadata. This is what lets a disputed "I checked in but the guest says I
didn't" or a payment discrepancy be investigated after the fact rather than argued
from memory.
