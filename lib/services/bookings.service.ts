import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { AppError, appError } from "@/lib/errors";
import { generateBookingCode } from "@/lib/booking-code";

const FILE = "lib/services/bookings.service.ts";

/**
 * Booking creation.
 *
 * Two rules this file exists to enforce:
 *  1. context.md §5 — the seat check and the booking insert happen inside ONE
 *     transaction, via the reserve_seats_and_create_booking database function.
 *     Two guests racing for the last seats must not both succeed, and no amount
 *     of careful application code can guarantee that from outside a row lock.
 *  2. CLAUDE.md Rule 8 — the money snapshot is exactly three fields
 *     (guest_price_usd_cents per guest, charged_amount_piasters,
 *     fx_rate_snapshot_micros), written ONCE at creation and never recalculated.
 *     There is no split and no commission field: the full payment settles into
 *     the client's single account and our $30 is collected offline by contract,
 *     never passing through this system (context.md §4).
 *
 * CLAUDE.md Rule 9 — no .delete() on bookings, ever. Status transitions only.
 *
 * Service-role client, because SECURITY.md §3 gives guests no direct table
 * access and the reservation function is granted to service_role alone.
 */

/** SECURITY.md §5 — unpaid holds are released quickly so seats aren't hoarded. */
export const PENDING_PAYMENT_HOLD_MINUTES = 15;

/** How many times to retry a booking-code collision before giving up. */
const CODE_COLLISION_RETRIES = 3;

export interface CreatePendingBookingInput {
  tripInstanceId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  nationality: string;
  headcount: number;
  guestPriceUsdCents: number;
  chargedAmountPiasters: number;
  fxRateSnapshotMicros: number;
  analyticsConsent: boolean;
  marketingConsent: boolean;
}

export interface PendingBooking {
  bookingId: string;
  bookingCode: string;
  expiresAt: string;
}

/**
 * Reserve seats and create a pending_payment booking, atomically.
 *
 * Throws CAPACITY_EXCEEDED when the trip filled while the guest was on the form.
 * That is an expected outcome, not a failure — it is the race this system is
 * designed around.
 */
export async function createPendingBooking(
  input: CreatePendingBookingInput,
): Promise<PendingBooking> {
  const supabase = createSupabaseServiceRoleClient();

  const expiresAt = new Date(
    Date.now() + PENDING_PAYMENT_HOLD_MINUTES * 60 * 1000,
  ).toISOString();

  for (let attempt = 0; attempt < CODE_COLLISION_RETRIES; attempt += 1) {
    const bookingCode = generateBookingCode();

    const { data, error } = await supabase.rpc(
      "reserve_seats_and_create_booking",
      {
        p_trip_instance_id: input.tripInstanceId,
        p_booking_code: bookingCode,
        p_guest_name: input.guestName,
        p_guest_email: input.guestEmail,
        p_guest_phone: input.guestPhone,
        p_nationality: input.nationality,
        p_headcount: input.headcount,
        p_guest_price_usd_cents: input.guestPriceUsdCents,
        p_charged_amount_piasters: input.chargedAmountPiasters,
        p_fx_rate_snapshot_micros: input.fxRateSnapshotMicros,
        p_analytics_consent: input.analyticsConsent,
        p_marketing_consent: input.marketingConsent,
        p_expires_at: expiresAt,
      },
    );

    if (!error && data) {
      return { bookingId: data, bookingCode, expiresAt };
    }

    if (error) {
      // Unique violation on booking_code — astronomically unlikely at 31^8, but
      // the constraint exists precisely so this is a retry rather than a
      // duplicate code on someone's ticket.
      if (error.code === "23505") continue;

      // The function raises these as P0001 with the message as the marker.
      if (error.message.includes("CAPACITY_EXCEEDED")) {
        throw appError(
          AppError.BOOKING.CHECKOUT.CAPACITY_EXCEEDED,
          FILE,
          "createPendingBooking",
        );
      }
      if (
        error.message.includes("TRIP_NOT_FOUND") ||
        error.message.includes("TRIP_NOT_BOOKABLE")
      ) {
        throw appError(
          AppError.TRIP.DETAILS.NOT_FOUND,
          FILE,
          "createPendingBooking",
        );
      }

      throw appError(
        AppError.BOOKING.CHECKOUT.CREATE_FAILED,
        FILE,
        "createPendingBooking",
      );
    }
  }

  throw appError(
    AppError.BOOKING.CHECKOUT.CREATE_FAILED,
    FILE,
    "createPendingBooking",
  );
}
