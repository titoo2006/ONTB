/**
 * SECURITY.md §6 / CLAUDE.md Rule 10 — server-side validation.
 *
 * ALL user input is validated here before it reaches a service, regardless of any
 * client-side validation that already ran. Client-side validation exists only for
 * immediate feedback; it is never trusted.
 *
 * Phase 1 inputs: booker name, email, phone, nationality, headcount.
 * Headcount is bounds-checked against BOTH a sane per-booking maximum AND the real
 * remaining trip capacity — the capacity half of that check happens server-side in
 * a transaction (context.md §5), not here.
 *
 * SCAFFOLD STUB — schemas added when Screen 3 (Checkout) is built.
 */

/**
 * PRD_Phase1.md Screen 2 — UI cap for an individual booking. Group/tour-operator
 * bulk bookings are out of scope for Phase 1 (context.md §8).
 */
export const MAX_HEADCOUNT_PER_BOOKING = 20;

// TODO(scaffold): zod schemas for booker details and checkout input.
