/**
 * Organizer check-in (Screens 7 and 8).
 *
 * SECURITY.md §4 — check-in is performed ONLY through a `security definer` database
 * function that validates: the booking exists, its trip isn't already expired, it
 * isn't already checked in, and the caller is an active organizer for that yacht.
 * A direct table UPDATE from the client is impossible under RLS, by design.
 *
 * context.md §6 — check-in is idempotent and covers the whole booking headcount as
 * a single action. A 10-guest booking checks in once, not ten times.
 *
 * SCAFFOLD STUB.
 */

// TODO(scaffold): findBookingForCheckIn(), checkInBooking() → rpc to the definer fn.
export {};
