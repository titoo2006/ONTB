-- =============================================================================
-- Remove the per-booking revenue split
--
-- NOT YET APPLIED WHEN WRITTEN. Rehearse before pushing (CLAUDE.md Rule 19):
--   begin; \i this_file.sql  rollback;
--
-- WHY
-- The original design divided every booking into owner and platform shares in
-- EGP at creation time. That does not describe how the money moves (decided
-- 2026-08-30, context.md §9): the full $95 per guest, converted to EGP, settles
-- into the client's single Paymob account. The platform's $30 per guest is
-- collected separately and offline under the partnership contract — it never
-- passes through this system.
--
-- So there is nothing to split, and nothing to snapshot. A commission column was
-- briefly considered and rejected: snapshotting a rate is only worth doing for
-- money this system actually handles, and this system never handles it. The
-- reconciliation report computes `sum(headcount) x $30` from a constant instead.
--
-- Dropping the split also voids the rounding rule it required — convert once,
-- split 65/30, remainder to the owner — and every way that could go wrong.
--
-- WHAT A BOOKING'S MONEY FIELDS ARE AFTER THIS
--   guest_price_usd_cents    the quoted per-guest price (9500). Multiply by
--                            headcount for the booking total; the total is not
--                            stored separately.
--   charged_amount_piasters  what Paymob actually charged, in full, undivided.
--   fx_rate_snapshot_micros  the rate that turned the first into the second.
-- That is the complete set. All three stay NOT NULL and are written once at
-- creation, never recalculated (Rule 8).
--
-- charged_amount_piasters and fx_rate_snapshot_micros deliberately remain NOT
-- NULL: Paymob is EGP-denominated and requires the amount in piasters at
-- handoff, and SECURITY.md §1 compares the webhook's reported amount against the
-- amount stored on the pending_payment row. A null there would silently disable
-- that tampering check.
--
-- CLAUDE.md Rule 18 — write surface: unchanged. bookings is still written only by
-- the booking-creation path under the service role and by the payment webhook. No
-- role gains a capability, and no RLS policy is added or altered.
--
-- Safe on an empty table: bookings has 0 rows, so no data is lost.
-- =============================================================================

alter table public.bookings
  drop constraint booking_split_sums_to_charge,
  drop column owner_share_piasters,
  drop column platform_share_piasters;
