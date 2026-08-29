import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError, appError } from "@/lib/errors";
import { GUEST_PRICE_USD_CENTS } from "@/lib/money";
import { cairoDateRange, cairoToday, isFutureInCairo } from "@/lib/time";
import type { CairoDate } from "@/lib/time";
import type { TripListingDay, TripListingItem } from "@/types/domain";

const FILE = "lib/services/trips.service.ts";

/** PRD_Phase1.md Screen 1 — default view is today plus the next 6 days. */
export const LISTING_WINDOW_DAYS = 7;

/**
 * Trips for the listing screen.
 *
 * Seat counts returned here are INFORMATIONAL ONLY (context.md §5) — the
 * authoritative capacity check happens in a transaction at checkout.
 *
 * All date filtering is Cairo-pinned (context.md §5.1). "Today" is today in Cairo
 * and "still departing" is judged against Cairo wall-clock time, never the
 * visitor's browser — ~90% of guests browse from another country.
 *
 * @param date  Restrict to a single Cairo date. Omit for the default 7-day window.
 */
export async function listUpcomingTrips(
  date?: CairoDate,
): Promise<TripListingDay[]> {
  const supabase = createSupabaseServerClient();

  const days = date ? [date] : cairoDateRange(cairoToday(), LISTING_WINDOW_DAYS);
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  if (firstDay === undefined || lastDay === undefined) return [];

  const { data: tripRows, error: tripError } = await supabase
    .from("trip_instances")
    .select("id, yacht_id, trip_date, departure_time, capacity, seats_booked")
    .eq("status", "scheduled")
    .gte("trip_date", firstDay)
    .lte("trip_date", lastDay)
    .order("trip_date", { ascending: true })
    .order("departure_time", { ascending: true });

  if (tripError) {
    throw appError(AppError.TRIP.LISTING.LOAD_FAILED, FILE, "listUpcomingTrips");
  }
  if (!tripRows || tripRows.length === 0) return [];

  // Fetched separately rather than as an embedded join: there are two yachts, so
  // the second round trip is trivial, and it keeps us off supabase-js relation
  // typing while types/database.ts is hand-written rather than generated.
  const yachtIds = [...new Set(tripRows.map((row) => row.yacht_id))];
  const { data: yachtRows, error: yachtError } = await supabase
    .from("yachts")
    .select("id, name, image_url")
    .in("id", yachtIds);

  if (yachtError) {
    throw appError(AppError.TRIP.LISTING.LOAD_FAILED, FILE, "listUpcomingTrips");
  }

  const yachtsById = new Map(
    (yachtRows ?? []).map((yacht) => [yacht.id, yacht] as const),
  );

  const byDate = new Map<CairoDate, TripListingItem[]>();

  for (const row of tripRows) {
    // A trip that has already departed today is gone from the listing, judged in
    // Cairo. This filter is applied here and not in SQL so that "now" comes from
    // one place (lib/time.ts) rather than from the database server's clock.
    if (!isFutureInCairo(row.trip_date, row.departure_time)) continue;

    const yacht = yachtsById.get(row.yacht_id);
    if (!yacht) continue;

    const item: TripListingItem = {
      id: row.id,
      yachtName: yacht.name,
      yachtImageUrl: yacht.image_url,
      tripDate: row.trip_date,
      departureTime: row.departure_time,
      capacity: row.capacity,
      seatsRemaining: Math.max(0, row.capacity - row.seats_booked),
      pricePerGuestUsdCents: GUEST_PRICE_USD_CENTS,
    };

    const existing = byDate.get(row.trip_date);
    if (existing) existing.push(item);
    else byDate.set(row.trip_date, [item]);
  }

  return days
    .filter((day) => byDate.has(day))
    .map((day) => ({ date: day, trips: byDate.get(day) ?? [] }));
}

/**
 * The next Cairo date that still has a departure, used by the empty state's
 * "try another date" shortcut (DESIGN.md §5.5 — never a bare "No results").
 */
export async function findNextAvailableDate(
  after: CairoDate,
): Promise<CairoDate | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_instances")
    .select("trip_date")
    .eq("status", "scheduled")
    .gt("trip_date", after)
    .order("trip_date", { ascending: true })
    .limit(1);

  if (error) {
    throw appError(AppError.TRIP.LISTING.LOAD_FAILED, FILE, "findNextAvailableDate");
  }

  return data?.[0]?.trip_date ?? null;
}
