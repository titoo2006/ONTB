/**
 * Booking creation and lookup.
 *
 * Two rules this file exists to enforce:
 *  1. context.md §5 — the seat-availability check runs server-side INSIDE a
 *     transaction comparing seats_booked against the yacht's capacity before a
 *     booking row is finalized. Two guests racing for the last seats must not both
 *     succeed. Never read-then-write across two round trips.
 *  2. CLAUDE.md Rule 8 — the money snapshot (guest_price_usd_cents,
 *     charged_amount_piasters, fx_rate_snapshot, owner_share_piasters,
 *     platform_share_piasters) is written ONCE at creation and never recalculated.
 *
 * CLAUDE.md Rule 9 — no .delete() on bookings, ever. Status transitions only.
 *
 * SCAFFOLD STUB.
 */

// TODO(scaffold): createPendingBooking(), getBookingByCode(), listBookingsForTrip().
export {};
