import { en } from "@/lib/i18n/en";

/**
 * DESIGN.md §5.4 — seat availability indicator.
 *
 *   > 20% remaining  → plain text, no urgency styling
 *   5–20% remaining  → warning tint
 *   < 5% remaining   → danger tint, bold
 *   <= 3 remaining   → "Almost full", NO number
 *
 * That last rule is the important one: below the floor we stop quoting a figure
 * entirely rather than implying precision we don't have. Concurrent bookings are in
 * flight, and context.md §5 makes this count informational — the authoritative check
 * is the transaction at checkout. Telling a guest "2 seats left" invites them to
 * treat a stale number as a promise.
 */

/** Below this many seats, show no number at all. */
const PRECISION_FLOOR = 3;

const WARNING_THRESHOLD = 0.2;
const DANGER_THRESHOLD = 0.05;

interface SeatAvailabilityProps {
  seatsRemaining: number;
  capacity: number;
}

export function SeatAvailability({
  seatsRemaining,
  capacity,
}: SeatAvailabilityProps) {
  if (seatsRemaining <= 0) {
    return (
      <p className="text-sm font-semibold text-danger">
        {en.tripListing.soldOut}
      </p>
    );
  }

  if (seatsRemaining <= PRECISION_FLOOR) {
    return (
      <p className="text-sm font-semibold text-danger">
        {en.tripListing.almostFull}
      </p>
    );
  }

  const ratio = capacity > 0 ? seatsRemaining / capacity : 0;

  if (ratio < DANGER_THRESHOLD) {
    return (
      <p className="text-sm font-semibold text-danger">
        {en.tripListing.almostFullWithCount(seatsRemaining)}
      </p>
    );
  }

  if (ratio <= WARNING_THRESHOLD) {
    return (
      <p className="text-sm text-warning">
        {en.tripListing.onlySeatsLeft(seatsRemaining)}
      </p>
    );
  }

  return (
    <p className="text-sm text-text-secondary">
      {en.tripListing.seatsLeft(seatsRemaining)}
    </p>
  );
}
