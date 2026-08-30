"use server";

import { AppError } from "@/lib/errors";
import { isSupportedCountryCode } from "@/lib/countries";
import {
  checkSeatsAvailable,
  getTripInstanceById,
} from "@/lib/services/trips.service";
import { checkoutSubmissionSchema } from "@/lib/validators";

/**
 * Screen 3 — checkout submission. PRD_Phase1.md §Screen 3.
 *
 * Order of operations, and the order matters:
 *   1. Validate booker input server-side (SECURITY.md §6). The browser's own
 *      validation is for feedback only and is never trusted.
 *   2. Confirm the trip still exists and is still in the future.
 *   3. Re-verify seat availability.
 *   4. Create the pending_payment booking inside a transaction, then start the
 *      Paymob payment.
 *
 * Steps 1–3 are implemented. STEP 4 IS BLOCKED — see PAYMENT_UNAVAILABLE below.
 *
 * Critically, if seats are gone we do NOT create a booking row (PRD Screen 3).
 * A row created and then abandoned would hold seats against a booking that can
 * never be paid for.
 */

export type CheckoutResult =
  | { ok: true; redirectTo: string }
  | { ok: false; code: string; fieldErrors: Record<string, string> };

export async function submitCheckoutAction(
  input: unknown,
): Promise<CheckoutResult> {
  const parsed = checkoutSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      ok: false,
      code: AppError.BOOKING.CHECKOUT.VALIDATION_FAILED.code,
      fieldErrors,
    };
  }

  const submission = parsed.data;

  // The nationality dropdown is a client control; a submitted code still has to
  // be one we actually offer (Rule 10 — never trust client-side validation).
  if (!isSupportedCountryCode(submission.nationality)) {
    return {
      ok: false,
      code: AppError.BOOKING.CHECKOUT.VALIDATION_FAILED.code,
      fieldErrors: { nationality: "Please select your nationality." },
    };
  }

  const trip = await getTripInstanceById(submission.tripInstanceId);
  if (!trip) {
    return {
      ok: false,
      code: AppError.TRIP.DETAILS.NOT_FOUND.code,
      fieldErrors: {},
    };
  }

  const available = await checkSeatsAvailable(
    submission.tripInstanceId,
    submission.headcount,
  );
  if (!available) {
    return {
      ok: false,
      code: AppError.TRIP.DETAILS.SOLD_OUT.code,
      fieldErrors: {},
    };
  }

  // ===========================================================================
  // BLOCKED HERE. Everything above this line works and is tested.
  //
  // The next step is createPendingBooking(). Its remaining blocker is narrow:
  // the USD->EGP rate. The row's three money fields, all NOT NULL:
  //   guest_price_usd_cents    — known (9500, per guest)
  //   charged_amount_piasters  — needs the rate
  //   fx_rate_snapshot_micros  — IS the rate
  //
  // The rate cannot be deferred to the webhook: Paymob is EGP-denominated and
  // requires the amount in piasters at handoff, and SECURITY.md §1 compares the
  // webhook's amount against what is stored on the pending_payment row — a null
  // there would silently disable that check (context.md §9, 2026-08-30).
  //
  // Guessing a rate would write a wrong number into a column that is never
  // recalculated (Rule 8), so this stops rather than improvises.
  //
  // Paymob credentials are a second, separate blocker for the handoff itself.
  //
  // When unblocked, replace this return with:
  //   - createPendingBooking() inside a transaction that reserves the seats
  //   - createPaymentIntent()
  //   - return { ok: true, redirectTo: <Paymob URL> }
  // ===========================================================================
  return {
    ok: false,
    code: AppError.BOOKING.CHECKOUT.PAYMENT_UNAVAILABLE.code,
    fieldErrors: {},
  };
}
