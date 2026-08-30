/**
 * Booking creation and lookup.
 *
 * Two rules this file exists to enforce:
 *  1. context.md §5 — the seat-availability check runs server-side INSIDE a
 *     transaction comparing seats_booked against the yacht's capacity before a
 *     booking row is finalized. Two guests racing for the last seats must not both
 *     succeed. Never read-then-write across two round trips.
 *  2. CLAUDE.md Rule 8 — the money snapshot is exactly three fields
 *     (guest_price_usd_cents per guest, charged_amount_piasters,
 *     fx_rate_snapshot_micros), written ONCE at creation and never recalculated.
 *     There is no split and no commission field: the full payment settles into
 *     the client's single account and our $30 is collected offline by contract,
 *     never passing through this system (context.md §4).
 *
 * CLAUDE.md Rule 9 — no .delete() on bookings, ever. Status transitions only.
 *
 * SCAFFOLD STUB.
 */

// TODO(scaffold): createPendingBooking(), getBookingByCode(), listBookingsForTrip().
export {};
