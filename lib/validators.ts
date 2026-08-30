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
 * Booker details — PRD_Phase1.md Screen 3, SECURITY.md §6.
 *
 * SECURITY.md §8 limits collection to what is operationally needed: name, email,
 * phone, nationality, headcount. Do not add fields here "in case they're needed
 * later" — every field added is PII we then have to justify, protect, and delete
 * on request.
 *
 * Validation is deliberately permissive on names and phone numbers. ~90% of
 * guests are foreign tourists from 9+ countries: a name may be non-Latin,
 * single-word, or contain particles and apostrophes, and phone formats vary
 * wildly. We check that something plausible is present, not that it matches a
 * Western pattern — over-strict validation here silently rejects real customers.
 */
export const bookerDetailsSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(2, "Please enter the name for the booking.")
    .max(120),
  guestEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(254),
  guestPhone: z
    .string()
    .trim()
    .min(6, "Please enter a phone number we can reach you on.")
    .max(32)
    // Digits, spaces, and the usual separators. No format assumptions beyond
    // "contains enough digits to be a phone number somewhere in the world".
    .regex(/^[+()\-\s0-9]+$/, "Please enter a valid phone number.")
    .refine(
      (value) => value.replace(/\D/g, "").length >= 6,
      "Please enter a valid phone number.",
    ),
  nationality: z
    .string()
    .trim()
    .length(2, "Please select your nationality.")
    .toUpperCase(),
});

export type BookerDetails = z.infer<typeof bookerDetailsSchema>;

export const checkoutSubmissionSchema = bookerDetailsSchema.extend({
  tripInstanceId: tripInstanceIdSchema,
  headcount: headcountSchema,
});

export type CheckoutSubmission = z.infer<typeof checkoutSubmissionSchema>;

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
