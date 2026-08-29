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
    },
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
    },
  },
} as const;
