"use server";

import { cookies } from "next/headers";
import { AppError, toAppError } from "@/lib/errors";
import { isSupportedCountryCode } from "@/lib/countries";
import {
  CONSENT_COOKIE_NAME,
  parseConsentCookie,
} from "@/lib/analytics/consent";
import { convertUsdCentsToPiasters, GUEST_PRICE_USD_CENTS } from "@/lib/money";
import { createPendingBooking } from "@/lib/services/bookings.service";
import { getCurrentFxRate } from "@/lib/services/fx.service";
import {
  createPaymentIntent,
  isPaymobConfigured,
} from "@/lib/services/payments.service";
import {
  checkSeatsAvailable,
  getTripInstanceById,
} from "@/lib/services/trips.service";
import { checkoutSubmissionSchema } from "@/lib/validators";

/**
 * Screen 3 — checkout submission. PRD_Phase1.md §Screen 3.
 *
 * Order of operations, and the order is the design:
 *   1. Validate booker input server-side (SECURITY.md §6). The browser's own
 *      validation is for feedback only and is never trusted.
 *   2. Confirm the trip exists and is still in the future.
 *   3. Cheap seat pre-check — fails fast without touching anything.
 *   4. Confirm the payment gateway is usable BEFORE reserving seats. Reserving
 *      inventory we cannot charge for would hold seats against a booking that can
 *      never complete.
 *   5. Look up the FX rate and convert once.
 *   6. Reserve seats and create the booking atomically (row lock, see
 *      reserve_seats_and_create_booking).
 *   7. Create the payment intent and hand off.
 *
 * If step 7 fails after step 6, the booking stays `pending_payment` and its
 * 15-minute hold expires, releasing the seats (SECURITY.md §5). Nothing is
 * charged and no row is deleted — bookings are append-only (Rule 9).
 */

export type CheckoutResult =
  | { ok: true; redirectTo: string }
  | { ok: false; code: string; fieldErrors: Record<string, string> };

function failure(code: string, fieldErrors: Record<string, string> = {}) {
  return { ok: false as const, code, fieldErrors };
}

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
    return failure(
      AppError.BOOKING.CHECKOUT.VALIDATION_FAILED.code,
      fieldErrors,
    );
  }

  const submission = parsed.data;

  // The nationality dropdown is a client control; a submitted code still has to
  // be one we actually offer (Rule 10 — never trust client-side validation).
  if (!isSupportedCountryCode(submission.nationality)) {
    return failure(AppError.BOOKING.CHECKOUT.VALIDATION_FAILED.code, {
      nationality: "Please select your nationality.",
    });
  }

  const trip = await getTripInstanceById(submission.tripInstanceId);
  if (!trip) {
    return failure(AppError.TRIP.DETAILS.NOT_FOUND.code);
  }

  const available = await checkSeatsAvailable(
    submission.tripInstanceId,
    submission.headcount,
  );
  if (!available) {
    return failure(AppError.TRIP.DETAILS.SOLD_OUT.code);
  }

  // Before taking seats: can we actually charge for them?
  if (!isPaymobConfigured()) {
    return failure(AppError.BOOKING.CHECKOUT.PAYMENT_UNAVAILABLE.code);
  }

  try {
    // Rule 8 — convert once, here. The effective rate (buffer already applied) is
    // what gets snapshotted, so the charge is exactly reproducible from the
    // stored rate rather than approximately so.
    const fxRate = await getCurrentFxRate();
    const totalUsdCents = GUEST_PRICE_USD_CENTS * submission.headcount;
    const chargedAmountPiasters = convertUsdCentsToPiasters(
      totalUsdCents,
      fxRate.effectiveRateMicros,
    );

    // The consent decision is snapshotted onto the booking here, because the
    // payment webhook arrives later with no cookies and cannot ask
    // (context.md §9, and the migration that added these columns).
    const consent = parseConsentCookie(
      cookies().get(CONSENT_COOKIE_NAME)?.value,
    );

    const booking = await createPendingBooking({
      tripInstanceId: submission.tripInstanceId,
      guestName: submission.guestName,
      guestEmail: submission.guestEmail,
      guestPhone: submission.guestPhone,
      nationality: submission.nationality,
      headcount: submission.headcount,
      // Per guest, not the total — the total is headcount x this and is never
      // stored (CLAUDE.md Rule 8).
      guestPriceUsdCents: GUEST_PRICE_USD_CENTS,
      chargedAmountPiasters,
      fxRateSnapshotMicros: fxRate.effectiveRateMicros,
      analyticsConsent: consent?.analytics === true,
      marketingConsent: consent?.marketing === true,
    });

    const intent = await createPaymentIntent({
      bookingId: booking.bookingId,
      bookingCode: booking.bookingCode,
      amountPiasters: chargedAmountPiasters,
      guestName: submission.guestName,
      guestEmail: submission.guestEmail,
      guestPhone: submission.guestPhone,
    });

    return { ok: true, redirectTo: intent.redirectUrl };
  } catch (err) {
    // Rule 7 — everything leaves through the registry with its code, never a
    // bare console.log of the raw object.
    const appErr = toAppError(err);
    console.error(`[${appErr.code}] ${appErr.file} → ${appErr.function}`);
    return failure(appErr.code);
  }
}
