import { z } from "zod";

/**
 * SECURITY.md §6 / CLAUDE.md Rule 10 — server-side validation.
 *
 * ALL user input is validated here before it reaches a service, regardless of any
 * client-side validation that already ran. Client-side validation exists only for
 * immediate feedback; it is never trusted.
 *
 * Headcount is bounds-checked TWICE, and the two checks are not interchangeable:
 *   1. Here — against a sane per-booking maximum. Cheap, no database needed.
 *   2. In the service, inside a transaction — against the trip's real remaining
 *      capacity (context.md §5). That one is authoritative and is the only thing
 *      standing between two racing guests and an oversold sailing.
 * Passing this file does not mean a seat exists.
 */

/**
 * PRD_Phase1.md Screen 2 — UI cap for an individual booking. Group/tour-operator
 * bulk bookings are out of scope for Phase 1 (context.md §8).
 */
export const MAX_HEADCOUNT_PER_BOOKING = 20;

/** A trip instance id, as it arrives from a URL segment. */
export const tripInstanceIdSchema = z.string().uuid();

export const headcountSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_HEADCOUNT_PER_BOOKING);

export const startBookingSchema = z.object({
  tripInstanceId: tripInstanceIdSchema,
  headcount: headcountSchema,
});

export type StartBookingInput = z.infer<typeof startBookingSchema>;

/**
 * Parse a headcount that arrived as a string (form field or query param).
 * Returns null rather than throwing — the caller decides what a bad value means,
 * and an unparseable value must never reach a service.
 */
export function parseHeadcount(raw: string | number | undefined): number | null {
  if (raw === undefined) return null;
  const numeric = typeof raw === "number" ? raw : Number(raw);
  const result = headcountSchema.safeParse(numeric);
  return result.success ? result.data : null;
}
