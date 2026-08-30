# PROJECT CONTEXT — Nile Booking
## Online booking platform for Nile yacht dinner-cruise trips — Egypt

> This file is the source of truth about what IS true in this system: the business,
> the roles, the workflow, the schema, and decisions already made. CLAUDE.md governs
> how to work; this file governs what to build. If they conflict, this file wins.

---

## TABLE OF CONTENTS

1. The Business
2. The People — User Roles
3. Core Booking Workflow
4. Money & Commission Model
5. Trip & Capacity Model
6. Booking Code & Check-In Design
7. Database Schema (Phase 1)
8. Open Decisions / Not Yet Answered
9. Decision Log
10. Known Limitations (accepted, not open questions)

---

## 1. THE BUSINESS

**What is this platform?** A booking website that lets tourists (and locals) reserve
seats on Nile dinner-cruise yacht trips in Egypt directly online, instead of only
through local trip offices. The platform handles browsing, payment, digital ticketing,
and on-site check-in.

**Client:** owns 2 yachts — **Nile Maxim** and **The Pharaohs** (confirmed
2026-08-31) — each with a 500-guest capacity. Each yacht runs 3 trips per day
(2 hours per trip, includes open buffet food, activities, live singing) — 6 trips
per day across the fleet.

**Brands:** the client trades under several names — *Nile Booking* (the booking
brand this platform is built for), *Nile Maxim*, and *The Pharaohs Cruising
Restaurants*. All are his own; none is a competitor. This matters when reviewing
supplied photography, which frequently carries one brand's logo.

**The two yachts are genuinely different vessels**, with visibly different
interiors — not two labels for one hull. Two consequences worth holding onto:
- The 500-guest capacity figure for *both* is inherited from the original brief
  and has not been re-confirmed since we learned they are distinct boats. Verify
  each separately. The schema already stores capacity per yacht and snapshots it
  per trip instance, so differing figures need no code change — only the seed
  currently asserts they match.
- Guest-facing copy still describes one generic product (see §9, 2026-08-29:
  the activities line is static because "all 6 daily trips are the same
  product"). That premise is now worth re-testing with the client — if the two
  boats differ in food, entertainment, or capacity, the copy should move to
  per-yacht columns rather than a shared constant.

**Current state (before this platform):** 100% of bookings go through local trip
offices. No online booking or online marketing funnel exists. Client currently serves
10,000–15,000 guests/month.

**Target:** 30,000–45,000 guests/month. The client's own assessment (agreed with us) is
that traditional/offline-only marketing cannot reach this number — it requires an
online booking channel plus real media buying.

**Audience:** ~90% of guests are tourists, from 9+ different countries. This drives
English-first UI, USD-denominated pricing, and no assumption of Arabic literacy on the
guest side.

---

## 2. THE PEOPLE — USER ROLES

### Role 1: Guest
Books a trip online, pays by card, receives a digital ticket/invoice with a booking
code and QR code. No account required to book (guest checkout) — see §8 for the open
question on optional accounts.

### Role 2: Organizer (yacht staff, boarding point)
Client's on-site staff member(s) at the yacht boarding point. Uses a phone browser
(mobile-optimized, authenticated web page — no native app) to search bookings by
booking code and check guests in as they board. One booking code can represent
anywhere from 1 to 100+ guests (family, group, or tour-operator block booking).

### Role 3: Admin
Client and/or platform staff. Sees the admin dashboard: booking volume, revenue,
check-in vs no-show rates by trip, nationality breakdown, and the commission
reconciliation report (§4).

---

## 3. CORE BOOKING WORKFLOW

1. Guest browses available trips (date, yacht, time slot) on the public site.
2. Guest selects a trip and ticket quantity, enters booker info (name, email, phone,
   nationality, headcount).
3. Guest pays via the payment gateway (Paymob — see §4 and SECURITY.md for why not
   Stripe/PayPal).
4. On successful payment, the system generates one booking record with a unique
   booking code and QR code, and issues a downloadable invoice/ticket.
5. At the yacht, the organizer searches the booking code (or scans the QR) and checks
   the group in. Checking in a group of 10 under one code is a single action, not 10.
6. **No-show rule:** if a booking has not been checked in within 30 minutes of the
   trip's scheduled departure time, the system marks it `expired`. This is an
   operational cutoff only — **no refund is issued** on expiry (decided; see §9).
7. Admin dashboard aggregates all of the above in near-real-time.

---

## 4. MONEY & COMMISSION MODEL

- Guest-facing ticket price: **$95 USD** per person.
- Commercial split per ticket, per the partnership contract: **$65 to the client
  (yacht owner)**, **$30 to the platform (us)**.
- **The $30 commission never touches this system** (decided 2026-08-30). The full
  $95 per guest, converted to EGP, settles into the **client's** single Paymob
  account. Our commission is collected separately and offline under the
  partnership contract. It is never calculated, split, held, or snapshotted
  anywhere in the booking flow, and there is no column for it.
- The admin commission reconciliation report is therefore a pure reporting
  calculation — `sum(headcount) × $30 contract rate` — using a constant in code.
  It reports what is owed under the contract; it does not reflect money this
  system has moved, because this system moves none of it.
- The client's prior per-ticket revenue via offline trip offices was roughly
  equivalent to $40 (≈2,000 EGP); the online channel is a real increase for them
  ($65), not just a volume play.
- **Settlement currency:** Paymob settles in EGP. The guest sees and is quoted a USD
  price; the actual charge is the EGP equivalent at checkout, disclosed to the guest
  before payment (see CLAUDE.md Rule 13).
- **No refund policy on no-show/expiry** (decided). Cancellation-before-departure
  policy is still open — see §8.
- Money is always stored as integers (piasters or USD cents) — never floats. See
  CLAUDE.md Rule 8 for the exact snapshot fields every booking must store.

---

## 5. TRIP & CAPACITY MODEL

- A **trip instance** = one yacht, one date, one departure time slot. There are 6 trip
  instances scheduled per operating day across the fleet (3 per yacht).
- Each trip instance has a fixed capacity (500 for either yacht currently, but the
  schema must not hardcode 500 — capacity is a property of the yacht, not a constant).
- **Overselling prevention:** seat availability shown to a browsing guest is
  informational only. The authoritative check happens server-side at the moment of
  payment confirmation, inside a transaction, comparing current `seats_booked` against
  `capacity` before finalizing the booking. Two guests racing for the last seats must
  not both succeed.

### 5.1 TIMEZONE — A STANDING RULE, NOT A ONE-OFF FIX

**Every date and time comparison in this system is pinned to `Africa/Cairo`, computed
server-side, always — regardless of where the guest is or what their browser clock
says.** This applies to every screen, every query, and every scheduled job, not only
the ones where it has already been considered.

Specifically:
- "Today and the next 6 days" on the trip listing means today in Cairo.
- "Departure time is in the future" is evaluated against Cairo local time.
- The 15-minute unpaid-payment hold and the 30-minute no-show cutoff are both
  computed server-side. Neither ever reads a client clock.
- `trip_date` (`date`) and `departure_time` (`time`) are stored without a timezone
  because they describe the yacht's local schedule. They are only ever interpreted
  in `Africa/Cairo` — never in UTC, never in the browser's zone.

**Why this is written down rather than fixed once:** ~90% of guests browse from
another country, and this class of bug is invisible when tested from Cairo. A guest in
Los Angeles comparing against their own clock would see tonight's cruise as bookable
eight hours after it sailed, or lose a full day of availability. Any new screen that
compares dates re-introduces the bug unless it follows this rule.

---

## 6. BOOKING CODE & CHECK-IN DESIGN

- Booking codes must be **short, human-readable at a glance (organizer will be reading
  these off a phone screen quickly, often outdoors), and non-sequential/non-guessable**
  — sequential IDs would let anyone enumerate other guests' bookings. Use a random
  alphanumeric code (e.g. 8 characters, ambiguous-character-excluded charset), not the
  database primary key.
- The QR code encodes the booking code (or a signed token containing it), so the
  organizer can either scan or manually search.
- Check-in is idempotent and covers the whole booking (headcount), not per-seat — a
  10-person booking checks in as one action, with the headcount shown so the organizer
  can visually confirm the group size matches.

---

## 7. DATABASE SCHEMA (PHASE 1)

High-level tables (see PRD_Phase1.md for the exact fields per screen, SECURITY.md for
RLS policy design):

- `yachts` — id, name, capacity
- `trip_instances` — id, yacht_id, date, departure_time, status
- `bookings` — id, booking_code, trip_instance_id, guest_name, guest_email,
  guest_phone, nationality, headcount, guest_price_usd_cents,
  charged_amount_piasters, fx_rate_snapshot_micros, status (`pending_payment` /
  `confirmed` / `checked_in` / `expired` / `cancelled`), analytics_consent,
  marketing_consent, consent_recorded_at, created_at, checked_in_at, expires_at
- `payments` — id, booking_id, gateway, gateway_reference, amount_piasters, status,
  raw_gateway_response
- `organizer_users` — id, user_id (Supabase auth), assigned_yacht_id (nullable = all),
  active
- `admin_users` — id, user_id, role (`super_admin` / `staff`)
- `audit_log` — id, actor, action, entity, entity_id, meta, created_at

This is the Phase 1 shape. Do not add tables/columns speculatively for features not
yet scoped — extend this file's decision log when a real need appears.

---

## 8. OPEN DECISIONS / NOT YET ANSWERED

These are known gaps, not oversights — flagged here so Claude Code stops and asks
rather than assuming:

- **Cancellation policy before departure** (as opposed to no-show handling, which is
  decided — no refund). Not yet defined.
- **Guest accounts:** guest checkout only, or optional accounts for repeat bookers /
  saved bookings? Not yet decided.
- **Languages beyond English** for the guest-facing site — which of the 9 tourist
  nationalities need dedicated translations vs. relying on English as the lingua franca.
- **Organizer/admin staff language** — confirm with client before building those UIs
  (see CLAUDE.md Rule 13).
- **Group/tour-operator bulk bookings** — do travel agents get a different booking
  path (e.g. a bulk-booking or affiliate flow) or do they use the same guest checkout?

### 8.1 BLOCKING FOR LAUNCH — not blocking Phase 1 development

These do not stop screens being built. They **do** stop real money being taken.
Every one of them was surfaced while drafting the Terms and Privacy pages
(2026-08-30) and each is currently a visible review flag on those pages. Do not
resolve any of them by guessing — that is exactly how a policy gets created by
accident.

- **Confirmation email is DISABLED pending a sending domain** (decided
  2026-08-30). `sendEmail` logs and returns; nothing is sent. The composition —
  subject, HTML, plain text, QR — is written and typechecked, so enabling it is
  a one-function change. What is missing is not a provider but a **domain**:
  guests booked with the client's brand, so mail must come from the client's
  domain with SPF, DKIM and DMARC configured, which needs DNS access from the
  client. Domain authentication affects inbox placement more than the choice of
  provider does. Deliberately does not block launch discussion — the ticket
  screen stands alone, and a guest can always reach their ticket on the site —
  but a launch without it means every guest must keep the browser tab or the
  booking code themselves, which is worth deciding consciously rather than by
  default. Provider recommendation on file: Resend for speed, Postmark if
  deliverability is the priority; verify current pricing and EU data residency
  before signing.
- **The seeded FX rate is a placeholder. Someone must insert a real,
  deliberately sourced rate before accepting real payments.** `supabase/seed.sql`
  inserts `48750000` (48.75 EGP/USD) purely so local development can convert at
  all; the number is invented and marked as such. Because `fx_rates` is
  append-only, fixing it is inserting one row with the real rate and a note — not
  editing the seed. Nothing in the system can detect that a *plausible* rate is
  wrong, which is exactly why this is on the launch checklist rather than left to
  be noticed.
- **Operator cancellation policy.** What happens when *we* cancel a sailing —
  weather, river conditions, safety — is undefined. It cannot inherit the
  no-show rule: a guest who arrives for a cancelled cruise has plainly not
  no-showed, so "no refund" would be indefensible. Terms §7 is deliberately
  left incomplete until this is decided.
- **Privacy policy promises erasure; append-only bookings can't currently honor
  it — needs an anonymization design or a policy rewrite before real payments go
  live.** Rule 9 makes bookings append-only and tax retention requires keeping
  the financial record, yet the privacy policy grants a deletion right. The
  likely resolution is anonymising the guest PII fields while preserving the
  booking and payment rows, but that is a design decision nobody has made. Until
  then the policy promises something the system cannot do.
- **Meta US data-transfer safeguard paragraph.** Meta processes in the US and
  transfers out of the EEA need a stated legal safeguard. **A lawyer is writing
  this — do not draft it.** The flag stays visible on the privacy page until
  their copy replaces it.
- **Governing law and EU consumer override.** Terms currently assume Egyptian
  law. Consumer-protection rules in a guest's home country can override a
  choice-of-law clause, and ~90% of guests are foreign tourists. **A lawyer is
  writing this — do not draft it.**

---

## 9. DECISION LOG

Format: date — decision — why.

- **2026-08-29** — Chose Next.js + Supabase + Paymob as the stack. Why: single
  codebase covers public site, admin dashboard, and organizer check-in (all
  web-based, no native app needed); Supabase gives Postgres + Auth + RLS out of the
  box, which matters given real money and guest PII are involved; Paymob (or
  equivalent Egyptian gateway) chosen over Stripe/PayPal because neither supports
  Egypt-registered merchants receiving funds reliably.
- **2026-08-29** — No refund policy on no-show/expiry. The 30-minute post-departure
  window is purely an operational cutoff (releases the seat for reporting purposes),
  not a financial transaction — no refund logic needed against the payment gateway
  for this case. Must be stated clearly in checkout terms before payment.
- **2026-08-30** — **SUPERSEDES the 2026-08-29 commission-split-rounding entry
  below. There is no per-booking revenue split, and no commission field either.**
  The full $95 per guest, converted to EGP, settles into the client's single
  Paymob account. The platform's $30 is collected separately and offline by
  contract and never passes through this system at all.

  Why: the money never moves in two directions here, so modelling a division was
  inventing complexity to mirror an accounting arrangement rather than a payment
  flow.

  A `platform_commission_usd_cents` snapshot column was proposed and **rejected**
  during this same discussion. The argument for it — protecting past months from
  a future contract renegotiation — is sound in general, but snapshotting a rate
  is only worth doing for money the system actually handles, and this system
  handles none of the commission. Recording it would have implied a per-booking
  financial fact that does not exist.

  Consequences: the `booking_split_sums_to_charge` constraint and the
  `owner_share_piasters` / `platform_share_piasters` columns are dropped; no
  commission column is added; the convert-once-then-split rounding rule is void,
  because there is no division and therefore no remainder piaster to assign. A
  booking's money fields are now exactly three: `guest_price_usd_cents` (per
  guest), `charged_amount_piasters`, `fx_rate_snapshot_micros`. Commission
  reconciliation is `sum(headcount) × $30` from a constant. CLAUDE.md Rule 8
  amended accordingly.
- **2026-08-31** — **The platform is named "Nile Booking", after the client's
  existing trading brand.** It is NOT a working title and must not be "corrected"
  back to the earlier placeholder "NileBook". The client trades under several of
  his own names — *Nile Booking* (the booking brand), *Nile Maxim* and *The
  Pharaohs Cruising Restaurants* (the two vessels). Guests will have seen "Nile
  Booking" on his existing material, so a near-miss variant on the site would
  read as a different, less trustworthy operator. Spelled with a space, matching
  his own artwork.

  Deliberately NOT renamed: `package.json` / `package-lock.json` stay `nilebook`
  (never guest-visible, and renaming churns the lockfile for nothing), and
  `lib/i18n/legal.ts` keeps its `[LEGAL ENTITY NAME]` placeholder — "Nile
  Booking" is a trading brand, and terms must name the **registered company** a
  guest actually contracts with. That name is still outstanding (§8).
- **2026-08-31** — **The two yachts are `Nile Maxim` and `The Pharaohs`**,
  confirmed with the client, replacing the invented placeholders "Nile Empress"
  and "Nile Sultana". They are genuinely different vessels with different
  interiors. The schema needed no change — capacity, name, and image_url are
  already per-yacht and snapshotted per trip instance — but two assumptions in
  the COPY now deserve re-testing: guest-facing text hardcodes "500-guest yacht"
  in two places, and the activities line is a shared constant on the premise that
  both boats sell the same product (§9, 2026-08-29). Their capacities have also
  not been separately confirmed since we learned they are distinct hulls.
- **2026-08-30** — **FX: a fixed, reviewed rate in an append-only `fx_rates`
  table, with a 3% buffer and a 14-day staleness warning.** Not a live FX API: a
  booking that fails because a rates API timed out mid-checkout is a worse
  outcome than a rate that is a few days stale. Not an environment variable
  either — on Vercel that needs a redeploy to change and carries no history, so
  "log it when you change it" would depend on someone remembering, which is the
  discipline that fails over months. The table is append-only, so **inserting a
  row IS the change log**: every rate ever used, dated, with a note. It also
  makes staleness detectable, which an env var cannot do.

  **The 3% buffer protects the CLIENT, not us.** The full charge settles to their
  account and our $30 is contractual and settled offline, so the buffer absorbs
  currency drift against their revenue. The client should understand this is
  happening rather than discover it — CTO is briefing them.

  Staleness is a warning, never a block: the risk being managed is that nobody
  notices, not that the number drifts. `fx_rates` is service-role only (RLS on,
  no policies, no grants) — the raw rate and our margin are internal pricing
  config, and a browser-reachable write path would be a way to alter prices.
- **2026-08-30** — **We own the USD→EGP rate; Paymob does not convert for us.**
  Paymob is EGP-denominated and both its order-registration and payment-key calls
  require `amount_cents` in piasters, so the EGP figure must exist before handoff.
  Consequences: `charged_amount_piasters` and `fx_rate_snapshot_micros` stay
  NOT NULL and are written at booking creation — making them nullable "until the
  webhook tells us" was considered and rejected, because SECURITY.md §1 compares
  the webhook's amount against the amount stored on the `pending_payment` row,
  and a null there would silently disable that tampering check. The only
  conversion we do not control is the guest's own card issuer converting EGP into
  their home currency, which we never see and do not need to.
- **2026-08-29** — **(SUPERSEDED 2026-08-30 — see above. Retained for history.)**
  **Commission split rounding: convert once, then split.** The USD
  total is converted to EGP a single time, and that converted EGP total is split
  65/30. Any remainder piaster goes to the **owner**. Why: the two shares then always
  sum to the amount actually charged, so reconciliation against Paymob's settlement
  is exact. Converting $65 and $30 separately was rejected — it can drift ±1 piaster
  from the real charge, which surfaces as an unexplainable gap at month end. Enforced
  in the database by `booking_split_sums_to_charge` on `bookings`, so a miscalculated
  split fails at write time rather than being found later.
- **2026-08-29** — **`bookings.expires_at` means the 15-minute unpaid payment hold,
  and nothing else.** The 30-minute no-show cutoff is never stored as a column: the
  expiry job derives it as `departure_time + 30 min` each run. Why: two different
  timers in one column is the kind of overloading that produces a wrong-by-30-minutes
  bug nobody can trace. Do not add a second column for the no-show cutoff.
- **2026-08-29** — **All date/time comparisons pinned to `Africa/Cairo`, server-side.**
  Recorded as a standing rule in §5.1, not merely as a fix, because it is silently
  re-introducible on any future screen that compares dates. See §5.1 for the why.
- **2026-08-29** — **Trip card imagery: treated placeholder for Phase 1.** No yacht
  photography exists yet. We deliberately do not use an illustration, since that would
  imply a specific yacht style we cannot confirm the real boats have. `yachts.image_url`
  ships as a **nullable** column in the initial migration so real photos are later a
  data update rather than a new migration; cards fall back to the placeholder while it
  is null.
- **2026-08-29** — **Trip card activities line is static copy for Phase 1**, held in
  `lib/i18n/en.ts`, not a database column. All 6 daily trips are the same product, so
  per-yacht or per-trip activity text would be data entry with no current payoff.
  Promoting it to a column later is additive.
- **2026-08-29** — Trip instances **snapshot** `yachts.capacity` into
  `trip_instances.capacity` at creation. Why: capacity remains a property of the
  yacht (never hardcoded), but a later refit must not retroactively change the
  capacity of a trip that already ran — which would make historical trips look
  oversold.

---

## 10. KNOWN LIMITATIONS (accepted, not open questions)

Things we have investigated, understood, and consciously decided to live with.
They are recorded here so nobody rediscovers and re-investigates them. These are
**not** §8 open questions — no decision is pending.

### 10.0 OPEN GAP — `/admin/*` returns 200 to unauthenticated callers
**Must close when Screens 9–10 are built. Not an accepted limitation.**

`/organizer/*` correctly returns 404 to anyone who is not an active organizer
(Rule 10 — we do not confirm a protected route exists). `/admin/*` does not: it
returns **200**, because the admin pages are still stubs that render `null` and
have no guard.

Harmless today — the pages contain nothing, so nothing leaks — but it confirms
the route exists, which Rule 10 forbids. Deferred deliberately (2026-08-30)
rather than patched, because the guard belongs with the real page and would
otherwise be written twice.

**When building Screens 9–10:** every admin page calls an admin-identity check
and `notFound()` on failure, exactly as `getOrganizerIdentity()` is used on the
organizer screens, and the report must state the resulting status codes.

### 10.1 `notFound()` returns HTTP 200 on guest routes
**Decided 2026-08-30 — accepted, not fixed.**

A missing or already-sailed trip renders the correct 404 page, but with an HTTP
**200** status. Unmatched routes (e.g. `/nonexistent`) still return a correct
404; this affects only `notFound()` called from inside a guest page.

*Cause:* the guest layout calls `cookies()` to gate the consent scripts, which
makes every guest route dynamically rendered and streamed. A streamed response
has already committed its HTTP status by the time `notFound()` runs. The root
layout reads no cookies, which is why unmatched routes are unaffected.

*Already tried, did not work:* `noStore()` in place of `dynamic =
"force-dynamic"`; removing the `Suspense` boundary from the guest layout. Do not
re-try these.

*Why we accept it:* every fix trades away either consent gating or seat
freshness, both of which matter more. It is link-checker and SEO hygiene, not a
guest-facing or money-path issue — the guest sees the right page either way.
Next.js already injects `<meta name="robots" content="noindex">`, so search
engines are handled; only uptime monitors and link checkers see the 200.

*Revisit if:* a Next.js upgrade changes streaming status behaviour, or the
consent gate moves out of the layout (e.g. into middleware).
