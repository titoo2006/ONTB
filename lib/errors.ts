/**
 * CLAUDE.md Rule 7 — the single error registry.
 *
 * Every thrown error in this codebase comes from here. Never `throw new Error(...)`,
 * never `catch (err) { console.log(err) }`, never an inline message in a service or
 * route. To add an error: add it to this file first, then use it.
 *
 * Usage:
 *   throw appError(AppError.TRIP.LISTING.LOAD_FAILED, "trips.service.ts", "listTrips");
 *
 *   catch (err) {
 *     const e = toAppError(err);
 *     console.error(`[${e.code}] ${e.file} → ${e.function}`);
 *   }
 *
 * Messages here are the fallback/log text. Guest-facing copy is resolved through
 * lib/i18n (Rule 13) so it stays translatable.
 */

export type AppErrorSeverity = "expected" | "unexpected";

export interface AppErrorShape {
  /** Stable machine code, e.g. "BOOKING.CHECKOUT.CAPACITY_EXCEEDED". */
  readonly code: string;
  readonly message: string;
  /** `expected` = a normal outcome (sold out). `unexpected` = needs investigation. */
  readonly severity: AppErrorSeverity;
}

export class AppErrorInstance extends Error {
  readonly code: string;
  readonly severity: AppErrorSeverity;
  readonly file: string;
  readonly function: string;

  constructor(shape: AppErrorShape, file: string, fn: string) {
    super(shape.message);
    this.name = "AppError";
    this.code = shape.code;
    this.severity = shape.severity;
    this.file = file;
    this.function = fn;
  }
}

/** Construct a throwable error, tagged with where it came from. */
export function appError(
  shape: AppErrorShape,
  file: string,
  fn: string,
): AppErrorInstance {
  return new AppErrorInstance(shape, file, fn);
}

/** Narrow an unknown catch value, so nothing escapes the registry unlabelled. */
export function toAppError(err: unknown): AppErrorInstance {
  if (err instanceof AppErrorInstance) return err;
  return new AppErrorInstance(AppError.SYSTEM.UNEXPECTED, "unknown", "unknown");
}

const define = (
  code: string,
  message: string,
  severity: AppErrorSeverity,
): AppErrorShape => ({ code, message, severity });

export const AppError = {
  SYSTEM: {
    UNEXPECTED: define(
      "SYSTEM.UNEXPECTED",
      "An unexpected error occurred.",
      "unexpected",
    ),
    CONFIG_MISSING: define(
      "SYSTEM.CONFIG_MISSING",
      "A required environment variable is not set.",
      "unexpected",
    ),
  },

  FX: {
    /**
     * No usable rate row exists. Checkout cannot price a booking in EGP, so this
     * blocks payment — correctly. Charging a guessed amount would be worse than
     * not charging at all.
     */
    RATE_UNAVAILABLE: define(
      "FX.RATE_UNAVAILABLE",
      "We can't process payments right now. Please try again shortly.",
      "unexpected",
    ),
    /**
     * The newest rate is older than the review window. Deliberately does NOT
     * block checkout — taking the site down over a stale-but-plausible rate is a
     * worse outcome than charging a slightly drifted one. Surfaced on the admin
     * dashboard so a human notices, which is the actual failure being defended
     * against.
     */
    RATE_STALE: define(
      "FX.RATE_STALE",
      "The exchange rate has not been reviewed recently.",
      "expected",
    ),
  },

  TRIP: {
    LISTING: {
      LOAD_FAILED: define(
        "TRIP.LISTING.LOAD_FAILED",
        "Could not load the trip listing.",
        "unexpected",
      ),
    },
    DETAILS: {
      NOT_FOUND: define(
        "TRIP.DETAILS.NOT_FOUND",
        "That trip does not exist.",
        "expected",
      ),
      LOAD_FAILED: define(
        "TRIP.DETAILS.LOAD_FAILED",
        "Could not load this trip.",
        "unexpected",
      ),
      // PRD_Phase1.md Screen 2 — the trip filled between page load and click.
      // Expected, not exceptional: two guests looking at the last seats is the
      // normal case this system is designed around (context.md §5).
      SOLD_OUT: define(
        "TRIP.DETAILS.SOLD_OUT",
        "This trip just sold out.",
        "expected",
      ),
    },
  },

  ANALYTICS: {
    // Tracking failures are always `expected` in the sense that they must never
    // fail the operation they were observing — a booking is confirmed whether
    // or not Meta ever hears about it.
    PURCHASE_DISPATCH_FAILED: define(
      "ANALYTICS.PURCHASE_DISPATCH_FAILED",
      "Could not send the Purchase event to the Conversions API.",
      "expected",
    ),
  },

  BOOKING: {
    CHECKOUT: {
      // PRD_Phase1.md Screen 3
      CAPACITY_EXCEEDED: define(
        "BOOKING.CHECKOUT.CAPACITY_EXCEEDED",
        "This trip no longer has enough seats available.",
        "expected",
      ),
      VALIDATION_FAILED: define(
        "BOOKING.CHECKOUT.VALIDATION_FAILED",
        "The booking details submitted are not valid.",
        "expected",
      ),
      CREATE_FAILED: define(
        "BOOKING.CHECKOUT.CREATE_FAILED",
        "We couldn't create your booking. Nothing has been charged.",
        "unexpected",
      ),
      /**
       * TEMPORARY — the checkout path is complete up to the payment handoff and
       * stops there.
       *
       * Everything up to and including booking creation is implemented and
       * tested. The remaining blocker is Paymob credentials — without them
       * createPaymentIntent cannot run, so checkout refuses BEFORE reserving any
       * seats rather than holding inventory it cannot charge for.
       *
       * Delete this code once Paymob credentials are in place and
       * createPaymentIntent is implemented.
       */
      PAYMENT_UNAVAILABLE: define(
        "BOOKING.CHECKOUT.PAYMENT_UNAVAILABLE",
        "Online payment isn't available yet.",
        "expected",
      ),
    },
  },
} as const;
