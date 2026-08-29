import Link from "next/link";
import { SeatAvailability } from "@/components/trips/SeatAvailability";
import { en } from "@/lib/i18n/en";
import { formatUsdCents } from "@/lib/money";
import { formatCairoDateLabel, formatDepartureTime } from "@/lib/time";
import type { TripListingItem } from "@/types/domain";

/**
 * DESIGN.md §5.2 — trip card: image, yacht name, date/time, price, seats
 * remaining, a short activities line, and one CTA.
 *
 * The image is a treated placeholder while `yachtImageUrl` is null — no yacht
 * photography exists yet (context.md §9), and an illustration would imply a boat
 * style we can't confirm the real yachts have.
 */
export function TripCard({ trip }: { trip: TripListingItem }) {
  const soldOut = trip.seatsRemaining <= 0;

  return (
    <article className="overflow-hidden rounded-md border border-border bg-surface">
      {trip.yachtImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote host is not
        // known until the client supplies photography; revisit with next/image then.
        <img
          src={trip.yachtImageUrl}
          alt=""
          className="h-40 w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-40 w-full bg-gradient-to-br from-primary to-primary-light"
        />
      )}

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-semibold text-text-primary">
            {trip.yachtName}
          </h3>
          <p className="text-xl font-semibold text-text-primary">
            {formatUsdCents(trip.pricePerGuestUsdCents)}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-text-secondary">
            {formatCairoDateLabel(trip.tripDate)} ·{" "}
            {formatDepartureTime(trip.departureTime)} ·{" "}
            {en.tripListing.durationSummary}
          </p>
          <p className="text-sm text-text-secondary">
            {en.common.perPerson}
          </p>
        </div>

        <p className="text-sm text-text-secondary">
          {en.tripListing.activitiesSummary}
        </p>

        <SeatAvailability
          seatsRemaining={trip.seatsRemaining}
          capacity={trip.capacity}
        />

        {soldOut ? (
          <span
            aria-disabled="true"
            className="flex min-h-touch cursor-not-allowed items-center justify-center rounded-sm bg-primary px-4 text-base font-semibold text-text-on-primary opacity-40"
          >
            {en.tripListing.soldOut}
          </span>
        ) : (
          <Link
            href={`/trips/${trip.id}`}
            className="flex min-h-touch items-center justify-center rounded-sm bg-primary px-4 text-base font-semibold text-text-on-primary hover:bg-primary-light"
          >
            {en.tripListing.viewTrip}
          </Link>
        )}
      </div>
    </article>
  );
}
