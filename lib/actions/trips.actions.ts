"use server";

import { redirect } from "next/navigation";
import {
  checkSeatsAvailable,
  findNextAvailableDate,
  getTripInstanceById,
  listAlternativeTrips,
  listUpcomingTrips,
} from "@/lib/services/trips.service";
import { AppError } from "@/lib/errors";
import { cairoToday } from "@/lib/time";
import type { CairoDate } from "@/lib/time";
import { startBookingSchema } from "@/lib/validators";
import type { TripListingDay, TripListingItem } from "@/types/domain";

/**
 * Screen 1 — trip listing.
 *
 * CLAUDE.md Rule 6: pages call this; this calls the service; only the service
 * touches Supabase.
 */
export async function getUpcomingTripsAction(
  date?: CairoDate,
): Promise<TripListingDay[]> {
  return listUpcomingTrips(date);
}

/** Empty-state shortcut — the next Cairo date that still has a departure. */
export async function getNextAvailableDateAction(
  after?: CairoDate,
): Promise<CairoDate | null> {
  return findNextAvailableDate(after ?? cairoToday());
}

/** Screen 2 — one trip. Null means 404, not an error page. */
export async function getTripDetailsAction(
  tripInstanceId: string,
): Promise<TripListingItem | null> {
  return getTripInstanceById(tripInstanceId);
}

export type StartBookingResult =
  | { ok: true }
  | {
      ok: false;
      code: string;
      alternatives: TripListingItem[];
    };

/**
 * Screen 2 — "Book now".
 *
 * PRD_Phase1.md Screen 2: if the trip filled between page load and click, block
 * navigation, say so, and suggest alternatives. That is what this does.
 *
 * Rule 10 / SECURITY.md §6 — the submitted trip id and headcount are validated
 * server-side here before any service is called. The browser's number input cap
 * is a convenience; it is not a control.
 *
 * IMPORTANT: passing this does NOT reserve a seat. No booking row is created and
 * nothing is held. The authoritative capacity check runs inside a transaction at
 * checkout (context.md §5). Two guests can both pass this and only one can
 * complete — which is correct, and is why Screen 3 must handle sold-out too.
 *
 * On success it redirects rather than returning, so the guest cannot re-submit a
 * stale form by going back.
 */
export async function startBookingAction(
  rawTripInstanceId: string,
  rawHeadcount: number,
): Promise<StartBookingResult> {
  const parsed = startBookingSchema.safeParse({
    tripInstanceId: rawTripInstanceId,
    headcount: rawHeadcount,
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: AppError.BOOKING.CHECKOUT.VALIDATION_FAILED.code,
      alternatives: [],
    };
  }

  const { tripInstanceId, headcount } = parsed.data;

  const trip = await getTripInstanceById(tripInstanceId);
  if (!trip) {
    return {
      ok: false,
      code: AppError.TRIP.DETAILS.NOT_FOUND.code,
      alternatives: [],
    };
  }

  const available = await checkSeatsAvailable(tripInstanceId, headcount);
  if (!available) {
    return {
      ok: false,
      code: AppError.TRIP.DETAILS.SOLD_OUT.code,
      alternatives: await listAlternativeTrips(
        tripInstanceId,
        trip.tripDate,
        headcount,
      ),
    };
  }

  redirect(
    `/checkout?trip=${encodeURIComponent(tripInstanceId)}&headcount=${headcount}`,
  );
}
