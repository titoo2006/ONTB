# PRD — Phase 1: Core Booking Funnel, Check-In, and Minimal Admin
## NileBook — Nile Yacht Trip Booking Platform

---

## PHASE 1 GOAL

Ship the minimum that lets the client run a real trip end-to-end through the platform:
a guest can find a trip, pay for it online, receive a valid ticket, and be checked in
at the yacht by the organizer — with the no-show/expiry rule enforced automatically,
and enough admin visibility to see what happened. Everything else (loyalty, group
booking flows, multi-language beyond English, marketing/SEO content pages) is
explicitly out of scope for Phase 1.

---

## SCREENS IN THIS PHASE

1. Trip Listing (Homepage)
2. Trip Details
3. Checkout
4. Payment Processing
5. Booking Confirmation / Digital Ticket
6. Organizer Login
7. Organizer Check-In Search
8. Organizer Check-In Confirmation
9. Admin Login
10. Admin Dashboard (Overview)

---

## SCREEN 1 — TRIP LISTING (HOMEPAGE)

### What the user sees
A list/grid of upcoming trip instances (grouped by date), each card showing: yacht
name, date, departure time, price ($95), seats-remaining indicator (DESIGN.md §5.4),
and a short activities line. A date filter at the top.

### What happens
- Default view: today + next 6 days, only trips with `status = scheduled` and
  departure time in the future.
- Selecting a date filters the list.
- Tapping/clicking a card navigates to Trip Details for that trip instance.

### States
- Loading: skeleton cards (3–4).
- Empty: "No trips scheduled for this date" + shortcut to next available date.
- Error: generic error toast + retry button.

---

## SCREEN 2 — TRIP DETAILS

### What the user sees
Full trip info: yacht, date/time, duration (2 hours), included activities/food/live
music, price per person, seats remaining, and a quantity selector with a "Book now"
CTA.

### What happens — Happy Path
1. Guest selects headcount (1–[remaining capacity], reasonable UI cap e.g. 20 for an
   individual booking — larger group/tour-operator bookings are out of scope for
   Phase 1, see context.md §8).
2. "Book now" navigates to Checkout, carrying `trip_instance_id` + `headcount`.

### What happens — Error States
- If the trip has filled between page load and click: block navigation, show
  "This trip just sold out" and suggest nearby alternatives.

### States
Loading / not-found (invalid trip id → 404 page, not a broken detail screen) / error.

---

## SCREEN 3 — CHECKOUT

### What the user sees
Order summary (trip, headcount, price × headcount, total in USD with "charged in EGP
at checkout" disclosure per DESIGN.md §8), a booker info form (name, email, phone,
nationality — dropdown, required for the admin nationality-breakdown report), and a
"Pay $X" button that hands off to Paymob.

### What happens — Happy Path
1. Guest fills booker info; client-side validation for immediate feedback, but the
   real validation is server-side (CLAUDE.md Rule 10).
2. On submit, server re-verifies seat availability inside a transaction (context.md
   §5) before creating a `pending_payment` booking row and initiating the Paymob
   payment intent.
3. Guest is redirected to Paymob's hosted payment page (or embedded iframe, per
   Paymob's integration options — decide during implementation).

### What happens — Error States
- Seats no longer available at submit time → do not create a booking row; show
  "Sorry, this trip just sold out" and return to Trip Details.
- Validation errors → inline, field-level.

### Error Codes
`BOOKING.CHECKOUT.CAPACITY_EXCEEDED`, `BOOKING.CHECKOUT.VALIDATION_FAILED`

### States
Form / submitting (disable double-submit) / error.

---

## SCREEN 4 — PAYMENT PROCESSING

### What the user sees
A brief "Confirming your payment..." screen while the payment webhook is processed.

### What happens
1. Paymob redirects back to this page after payment, AND (authoritative path) sends
   a server-to-server webhook confirming payment status.
2. The booking is only marked `confirmed` on the **webhook**, never on the client-side
   redirect alone — the redirect can be spoofed or interrupted; the webhook is the
   source of truth. See SECURITY.md.
3. On confirmed webhook: generate booking code + QR, send confirmation email,
   redirect guest to Booking Confirmation.
4. If the webhook hasn't arrived yet when the guest lands here (race condition),
   poll briefly (e.g. every 2s, up to ~20s) before showing a "still confirming, check
   your email shortly" fallback rather than an error.

### States
Confirming (polling) / confirmed (redirect) / payment failed (clear retry path,
booking row marked `cancelled`, no charge was captured) / timed out (fallback
message, does not imply failure).

---

## SCREEN 5 — BOOKING CONFIRMATION / DIGITAL TICKET

### What the user sees
Booking code (large, prominent), QR code, trip details, headcount, a downloadable
invoice/ticket (PDF), and clear instructions: "Show this at the yacht boarding point."
No-refund-on-no-show policy stated here as well as at checkout.

### What happens
- Ticket is also emailed to the guest at the address they provided, so it's
  retrievable even if they don't download it.
- The QR encodes the booking code (or a signed token containing it — decide during
  implementation based on whether offline scanning must be supported in Phase 1;
  default to online lookup only for Phase 1 given organizer will have connectivity
  at the boarding point).

### States
Success (always — this screen is only reached after a confirmed webhook).

---

## SCREEN 6 — ORGANIZER LOGIN

### What the user sees
Simple email/password (Supabase Auth) login, styled per DESIGN.md §6 (high contrast,
large tap targets — this will be used outdoors).

### What happens
Standard Supabase Auth sign-in; on success, checks the `organizer_users` table for an
active record before granting access to the check-in screens (a valid Supabase user
that isn't in `organizer_users` gets a 404, not a 403 — CLAUDE.md Rule 10).

---

## SCREEN 7 — ORGANIZER CHECK-IN SEARCH

### What the user sees
Auto-focused search field (booking code), large text, list of today's trips at the
organizer's assigned yacht (or all yachts if unassigned) as a quick filter.

### What happens — Happy Path
1. Organizer types or scans a booking code.
2. Matching booking is found → navigate to Check-In Confirmation.

### What happens — Error States
- Not found → "Booking code not found — double-check and try again."
- Found but already `checked_in` → show who/when it was checked in, no duplicate
  action available.
- Found but `expired` or `cancelled` → show status clearly, no check-in action
  available, with a note this requires admin override if the organizer believes
  it's an error (admin override flow is Phase 2 — for Phase 1, the organizer
  escalates manually to the client).

### States
Search / results / not-found / already-checked-in / expired-or-cancelled.

---

## SCREEN 8 — ORGANIZER CHECK-IN CONFIRMATION

### What the user sees
Booking details (guest name, headcount, trip), one large "Check in" button.

### What happens
1. Tapping "Check in" sets `status = checked_in`, `checked_in_at = now()`, via a
   server action — never a direct client-side table write (CLAUDE.md Rule 18).
2. Full-width success confirmation banner per DESIGN.md §6, then returns to the
   search screen ready for the next booking.

### States
Confirming (button disabled during the request, no double-submit) / success / error
(network failure — retry button, no silent failure).

---

## SCREEN 9 — ADMIN LOGIN

Same pattern as Organizer Login, checking `admin_users` instead.

---

## SCREEN 10 — ADMIN DASHBOARD (OVERVIEW)

### What the user sees
For a selected date range (default: today): total bookings, total guests, revenue
(with the owner/platform split shown separately per context.md §4), check-in rate,
no-show rate, and a simple table of trips for the period with per-trip counts.
Nationality breakdown as a simple bar/table, not yet a full analytics suite.

### What happens
Read-only aggregation queries against `bookings`/`payments`/`trip_instances`. No
write actions from this screen in Phase 1 (no manual booking creation/editing from
admin — that's explicitly Phase 2+ if needed).

### States
Loading (skeleton) / loaded / empty (no bookings yet in range) / error.

---

## OUT OF SCOPE FOR PHASE 1 (explicitly deferred)

- Admin manual booking creation/editing or check-in override
- Group/tour-operator bulk booking flow
- Guest accounts / booking history / repeat-booker features
- Multi-language beyond English on the guest site
- Cancellation-before-departure flow (policy not yet decided — context.md §8)
- SMS notifications (email only for Phase 1)
