"use server";

import {
  findNextAvailableDate,
  listUpcomingTrips,
} from "@/lib/services/trips.service";
import { cairoToday } from "@/lib/time";
import type { CairoDate } from "@/lib/time";
import type { TripListingDay } from "@/types/domain";

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
