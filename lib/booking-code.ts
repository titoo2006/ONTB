/**
 * SECURITY.md §2 / context.md §6 — booking code generation.
 *
 * Requirements this must satisfy:
 *   - Random. Never sequential, never derived from the row id, timestamp, or guest
 *     info — a code must not be derivable from another code.
 *   - Cryptographically random source, not Math.random().
 *   - 8 characters from an unambiguous charset (no 0/O, 1/I/L) — the organizer reads
 *     these off a phone screen, outdoors, quickly.
 *   - Uniqueness enforced by a DB unique constraint, with retry on collision.
 *
 * SCAFFOLD STUB — implementation follows once the schema is applied.
 */

/** Unambiguous charset — 0/O/1/I/L removed to avoid misreads at the boarding point. */
export const BOOKING_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const BOOKING_CODE_LENGTH = 8;

// TODO(scaffold): generateBookingCode() using crypto.randomInt / getRandomValues.
