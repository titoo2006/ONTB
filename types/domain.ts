/**
 * Hand-written domain types — the shapes the UI actually consumes.
 * Database row types live in types/database.ts and are transcribed from the
 * migration. Services map rows to these; components never see a row type.
 */

import type { CairoDate, CairoTime } from "@/lib/time";

/** context.md §7 — the only statuses a booking can hold. */
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "expired"
  | "cancelled";

/** context.md §5 */
export type TripInstanceStatus = "scheduled" | "departed" | "cancelled";

export type AdminRole = "super_admin" | "staff";

/**
 * One trip card on Screen 1 / the header of Screen 2.
 *
 * `seatsRemaining` is INFORMATIONAL ONLY (context.md §5). It is a snapshot from
 * the moment this was read and may be stale by the time the guest clicks. The
 * authoritative check happens server-side in a transaction at checkout.
 */
export interface TripListingItem {
  id: string;
  yachtName: string;
  /** Null until the client provides photography — cards show a placeholder. */
  yachtImageUrl: string | null;
  tripDate: CairoDate;
  departureTime: CairoTime;
  capacity: number;
  seatsRemaining: number;
  /** Guest-facing price per person, in USD cents (Rule 8 — never a float). */
  pricePerGuestUsdCents: number;
}

/** Trips for one Cairo calendar date, as Screen 1 groups them. */
export interface TripListingDay {
  date: CairoDate;
  trips: TripListingItem[];
}
