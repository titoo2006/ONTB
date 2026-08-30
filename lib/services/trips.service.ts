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
 * @param date      Restrict to a single Cairo date. Omit for the default window.
 * @param minSeats  Only sailings with room for a party this size. Filtered in
 *                  application code rather than SQL because `seats_booked` is a
 *                  live counter — the value that matters is the one read in the
 *                  same pass as everything else on the page, and it is still only
 *                  informational either way (context.md §5). A guest whose party
 *                  no longer fits by the time they click gets the sold-out path.
 */
export async function listUpcomingTrips(
  date?: CairoDate,
  minSeats?: number,
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

    // Party-size filter from the hero search bar.
    const seatsRemaining = Math.max(0, row.capacity - row.seats_booked);
    if (minSeats !== undefined && seatsRemaining < minSeats) continue;

    const yacht = yachtsById.get(row.yacht_id);
    if (!yacht) continue;

    const item: TripListingItem = {
      id: row.id,
      yachtName: yacht.name,
      yachtImageUrl: yacht.image_url,
      tripDate: row.trip_date,
      departureTime: row.departure_time,
      capacity: row.capacity,
      seatsRemaining,
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
 * One trip, for Screen 2. Returns null when the id doesn't exist or the trip is
 * no longer scheduled — the page turns that into a 404 rather than a broken
 * detail screen (PRD_Phase1.md Screen 2).
 *
 * Seat count here is still informational (context.md §5). It is re-read fresh in
 * `checkSeatsAvailable` at the moment the guest clicks, and re-checked again
 * inside a transaction at checkout. This read is for display only.
 */
export async function getTripInstanceById(
  tripInstanceId: string,
): Promise<TripListingItem | null> {
  const supabase = createSupabaseServerClient();

  const { data: tripRows, error: tripError } = await supabase
    .from("trip_instances")
    .select("id, yacht_id, trip_date, departure_time, capacity, seats_booked")
    .eq("id", tripInstanceId)
    .eq("status", "scheduled")
    .limit(1);

  if (tripError) {
    throw appError(AppError.TRIP.DETAILS.LOAD_FAILED, FILE, "getTripInstanceById");
  }

  const row = tripRows?.[0];
  if (!row) return null;

  // A trip that has already sailed is not a detail page, it's a 404. Judged in
  // Cairo (context.md §5.1), never against the visitor's clock.
  if (!isFutureInCairo(row.trip_date, row.departure_time)) return null;

  const { data: yachtRows, error: yachtError } = await supabase
    .from("yachts")
    .select("id, name, image_url")
    .eq("id", row.yacht_id)
    .limit(1);

  if (yachtError) {
    throw appError(AppError.TRIP.DETAILS.LOAD_FAILED, FILE, "getTripInstanceById");
  }

  const yacht = yachtRows?.[0];
  if (!yacht) return null;

  return {
    id: row.id,
    yachtName: yacht.name,
    yachtImageUrl: yacht.image_url,
    tripDate: row.trip_date,
    departureTime: row.departure_time,
    capacity: row.capacity,
    seatsRemaining: Math.max(0, row.capacity - row.seats_booked),
    pricePerGuestUsdCents: GUEST_PRICE_USD_CENTS,
  };
}

/**
 * Re-read a trip's seat count at the instant the guest clicks "Book now".
 *
 * PRD_Phase1.md Screen 2 requires blocking navigation when a trip filled between
 * page load and click. A listing page can sit open for minutes; this closes that
 * window before the guest is sent to checkout with a doomed booking.
 *
 * This is NOT the authoritative check. It is a fresh read, not a transaction, so
 * two guests can still both pass it. The check that actually prevents overselling
 * happens inside the checkout transaction (context.md §5), backed by the
 * `trip_instance_not_oversold` constraint. This exists to make the common case a
 * clean message instead of a failure three screens later.
 */
export async function checkSeatsAvailable(
  tripInstanceId: string,
  headcount: number,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_instances")
    .select("capacity, seats_booked")
    .eq("id", tripInstanceId)
    .eq("status", "scheduled")
    .limit(1);

  if (error) {
    throw appError(AppError.TRIP.DETAILS.LOAD_FAILED, FILE, "checkSeatsAvailable");
  }

  const row = data?.[0];
  if (!row) return false;

  return row.capacity - row.seats_booked >= headcount;
}

/**
 * Other sailings a guest could take instead, for the sold-out case.
 *
 * Same Cairo date first — someone who planned tonight most likely still wants
 * tonight — then the following days. Excludes the trip they were looking at and
 * anything without room for their party.
 */
export async function listAlternativeTrips(
  tripInstanceId: string,
  tripDate: CairoDate,
  headcount: number,
  limit = 3,
): Promise<TripListingItem[]> {
  const days = cairoDateRange(tripDate, 3);
  const lastDay = days[days.length - 1];
  if (lastDay === undefined) return [];

  const supabase = createSupabaseServerClient();

  const { data: tripRows, error: tripError } = await supabase
    .from("trip_instances")
    .select("id, yacht_id, trip_date, departure_time, capacity, seats_booked")
    .eq("status", "scheduled")
    .gte("trip_date", tripDate)
    .lte("trip_date", lastDay)
    .neq("id", tripInstanceId)
    .order("trip_date", { ascending: true })
    .order("departure_time", { ascending: true });

  if (tripError) {
    throw appError(AppError.TRIP.DETAILS.LOAD_FAILED, FILE, "listAlternativeTrips");
  }
  if (!tripRows || tripRows.length === 0) return [];

  const usable = tripRows.filter(
    (row) =>
      row.capacity - row.seats_booked >= headcount &&
      isFutureInCairo(row.trip_date, row.departure_time),
  );
  if (usable.length === 0) return [];

  const yachtIds = [...new Set(usable.map((row) => row.yacht_id))];
  const { data: yachtRows, error: yachtError } = await supabase
    .from("yachts")
    .select("id, name, image_url")
    .in("id", yachtIds);

  if (yachtError) {
    throw appError(AppError.TRIP.DETAILS.LOAD_FAILED, FILE, "listAlternativeTrips");
  }

  const yachtsById = new Map(
    (yachtRows ?? []).map((yacht) => [yacht.id, yacht] as const),
  );

  const alternatives: TripListingItem[] = [];
  for (const row of usable) {
    const yacht = yachtsById.get(row.yacht_id);
    if (!yacht) continue;
    alternatives.push({
      id: row.id,
      yachtName: yacht.name,
      yachtImageUrl: yacht.image_url,
      tripDate: row.trip_date,
      departureTime: row.departure_time,
      capacity: row.capacity,
      seatsRemaining: Math.max(0, row.capacity - row.seats_booked),
      pricePerGuestUsdCents: GUEST_PRICE_USD_CENTS,
    });
    if (alternatives.length >= limit) break;
  }

  return alternatives;
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
