import "server-only";
import { randomInt } from "node:crypto";

/**
 * SECURITY.md §2 / context.md §6 — booking code generation.
 *
 * Requirements this satisfies:
 *   - Cryptographically random. `crypto.randomInt` is unbiased and CSPRNG-backed;
 *     Math.random() is neither, and a predictable code here would let someone
 *     enumerate other guests' bookings.
 *   - Never derived from the row id, timestamp, or guest info, so one code tells
 *     you nothing about any other.
 *   - 8 characters from an unambiguous charset. The organizer reads these off a
 *     phone screen, outdoors, in a hurry.
 *   - Uniqueness is enforced by the database's unique constraint, not by hoping.
 *     The caller retries on collision.
 *
 * `server-only`: this must never run in the browser, both because node:crypto
 * isn't there and because code generation belongs to the system, not the client.
 */

/**
 * Unambiguous charset — I, L and O are excluded so they can't be misread as
 * 1, 1 and 0 at the boarding point.
 *
 * MUST stay in step with the `booking_code_shape` CHECK constraint in
 * 20260829120000_phase1_core_schema.sql: ^[2-9A-HJKMNP-Z]{8}$
 */
export const BOOKING_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const BOOKING_CODE_LENGTH = 8;

/** Mirrors the database constraint, so a bad code fails here not at insert. */
export const BOOKING_CODE_PATTERN = /^[2-9A-HJKMNP-Z]{8}$/;

/**
 * A random booking code.
 *
 * 31^8 ≈ 8.5e11 possibilities, so collisions are vanishingly rare — but "rare"
 * is not "impossible", which is why the unique constraint exists and the caller
 * retries rather than assuming.
 */
export function generateBookingCode(): string {
  let code = "";
  for (let i = 0; i < BOOKING_CODE_LENGTH; i += 1) {
    code += BOOKING_CODE_ALPHABET[randomInt(0, BOOKING_CODE_ALPHABET.length)];
  }
  return code;
}

export function isValidBookingCode(code: string): boolean {
  return BOOKING_CODE_PATTERN.test(code);
}
