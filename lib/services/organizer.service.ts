import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError, appError } from "@/lib/errors";
import { cairoToday } from "@/lib/time";
import type { BookingStatus } from "@/types/domain";

const FILE = "lib/services/organizer.service.ts";

/**
 * Organizer data access — Screens 6, 7 and 8.
 *
 * Uses the SESSION client, not the service role, deliberately. Every read here
 * runs as the signed-in organizer with RLS applied, so the "organizers read
 * bookings for their yacht" policy is doing real work rather than being
 * decoration. Using the service role would silently hand any organizer every
 * booking on the fleet, and the policy would never be exercised.
 */

export interface OrganizerIdentity {
  organizerId: string;
  userId: string;
  /** Null means all yachts (context.md §7). */
  assignedYachtId: string | null;
}

export interface OrganizerBooking {
  bookingCode: string;
  guestName: string;
  headcount: number;
  status: BookingStatus;
  checkedInAt: string | null;
  yachtName: string;
  tripDate: string;
  departureTime: string;
}

/**
 * The signed-in user's organizer record, or null.
 *
 * Null covers both "not signed in" and "signed in but not an organizer". The
 * caller turns either into a 404, never a 403 — Rule 10 says we don't confirm a
 * protected route exists to someone who shouldn't know.
 */
export async function getOrganizerIdentity(): Promise<OrganizerIdentity | null> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("organizer_users")
    .select("id, user_id, assigned_yacht_id, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(1);

  if (error) {
    throw appError(AppError.ORGANIZER.LOOKUP_FAILED, FILE, "getOrganizerIdentity");
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    organizerId: row.id,
    userId: row.user_id,
    assignedYachtId: row.assigned_yacht_id,
  };
}

/**
 * Find a booking by code, for check-in.
 *
 * RLS restricts this to the organizer's own yacht, so a code for another boat
 * simply returns null — indistinguishable from a typo, which is the right
 * behaviour: an organizer has no business confirming a booking exists elsewhere.
 */
export async function findBookingByCode(
  bookingCode: string,
): Promise<OrganizerBooking | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "booking_code, guest_name, headcount, status, checked_in_at, trip_instance_id",
    )
    .eq("booking_code", bookingCode)
    .limit(1);

  if (error) {
    throw appError(AppError.ORGANIZER.LOOKUP_FAILED, FILE, "findBookingByCode");
  }

  const booking = data?.[0];
  if (!booking) return null;

  const { data: tripRows } = await supabase
    .from("trip_instances")
    .select("trip_date, departure_time, yacht_id")
    .eq("id", booking.trip_instance_id)
    .limit(1);

  const trip = tripRows?.[0];
  if (!trip) return null;

  const { data: yachtRows } = await supabase
    .from("yachts")
    .select("name")
    .eq("id", trip.yacht_id)
    .limit(1);

  return {
    bookingCode: booking.booking_code,
    guestName: booking.guest_name,
    headcount: booking.headcount,
    status: booking.status,
    checkedInAt: booking.checked_in_at,
    yachtName: yachtRows?.[0]?.name ?? "",
    tripDate: trip.trip_date,
    departureTime: trip.departure_time,
  };
}

export interface OrganizerTrip {
  id: string;
  yachtName: string;
  departureTime: string;
  headcountExpected: number;
  checkedIn: number;
}

/**
 * Today's sailings at the organizer's yacht, with expected vs checked-in counts.
 *
 * "Today" is Cairo, always (context.md §5.1) — the one place it could go wrong
 * here is an organizer's phone with a wrong clock or a traveller's timezone.
 */
export async function listTodayTripsForOrganizer(
  assignedYachtId: string | null,
): Promise<OrganizerTrip[]> {
  const supabase = createSupabaseServerClient();
  const today = cairoToday();

  let query = supabase
    .from("trip_instances")
    .select("id, departure_time, yacht_id")
    .eq("trip_date", today)
    .eq("status", "scheduled")
    .order("departure_time", { ascending: true });

  if (assignedYachtId) query = query.eq("yacht_id", assignedYachtId);

  const { data: trips, error } = await query;
  if (error) {
    throw appError(
      AppError.ORGANIZER.LOOKUP_FAILED,
      FILE,
      "listTodayTripsForOrganizer",
    );
  }
  if (!trips || trips.length === 0) return [];

  const yachtIds = [...new Set(trips.map((t) => t.yacht_id))];
  const { data: yachts } = await supabase
    .from("yachts")
    .select("id, name")
    .in("id", yachtIds);
  const yachtsById = new Map((yachts ?? []).map((y) => [y.id, y.name] as const));

  // Counts come from bookings the organizer can actually see, which is the same
  // set they can check in — so the numbers on screen match what they can act on.
  const { data: bookings } = await supabase
    .from("bookings")
    .select("trip_instance_id, headcount, status")
    .in(
      "trip_instance_id",
      trips.map((t) => t.id),
    );

  return trips.map((trip) => {
    const forTrip = (bookings ?? []).filter(
      (b) => b.trip_instance_id === trip.id,
    );
    return {
      id: trip.id,
      yachtName: yachtsById.get(trip.yacht_id) ?? "",
      departureTime: trip.departure_time,
      headcountExpected: forTrip
        .filter((b) => b.status === "confirmed" || b.status === "checked_in")
        .reduce((sum, b) => sum + b.headcount, 0),
      checkedIn: forTrip
        .filter((b) => b.status === "checked_in")
        .reduce((sum, b) => sum + b.headcount, 0),
    };
  });
}

export interface CheckInResult {
  bookingCode: string;
  guestName: string;
  headcount: number;
  checkedInAt: string;
}

/**
 * Check in a whole booking, through the database function.
 *
 * SECURITY.md §4 — this is the ONLY path by which a booking becomes checked_in.
 * The function re-validates authorisation and status server-side; nothing here
 * is trusted to have checked first, because the screen that called it could be
 * stale or bypassed entirely.
 */
export async function checkInBooking(
  bookingCode: string,
): Promise<CheckInResult> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("check_in_booking", {
    p_booking_code: bookingCode,
  });

  if (error) {
    const message = error.message;
    if (message.includes("ALREADY_CHECKED_IN")) {
      throw appError(AppError.ORGANIZER.ALREADY_CHECKED_IN, FILE, "checkInBooking");
    }
    if (message.includes("BOOKING_NOT_FOUND")) {
      throw appError(AppError.ORGANIZER.BOOKING_NOT_FOUND, FILE, "checkInBooking");
    }
    if (message.includes("NOT_AUTHORIZED")) {
      throw appError(AppError.ORGANIZER.NOT_AUTHORIZED, FILE, "checkInBooking");
    }
    if (message.includes("NOT_CHECKINABLE")) {
      throw appError(AppError.ORGANIZER.NOT_CHECKINABLE, FILE, "checkInBooking");
    }
    if (message.includes("NOT_CONFIRMED")) {
      throw appError(AppError.ORGANIZER.NOT_CONFIRMED, FILE, "checkInBooking");
    }
    throw appError(AppError.ORGANIZER.CHECK_IN_FAILED, FILE, "checkInBooking");
  }

  const row = data?.[0];
  if (!row) {
    throw appError(AppError.ORGANIZER.CHECK_IN_FAILED, FILE, "checkInBooking");
  }

  return {
    bookingCode: row.booking_code,
    guestName: row.guest_name,
    headcount: row.headcount,
    checkedInAt: row.checked_in_at,
  };
}
