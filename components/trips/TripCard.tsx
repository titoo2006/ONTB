import Link from "next/link";
import { SeatAvailability } from "@/components/trips/SeatAvailability";
import { TripBadge } from "@/components/trips/TripBadge";
import { en } from "@/lib/i18n/en";
import { formatUsdCents } from "@/lib/money";
import {
  cairoDateRange,
  cairoToday,
  formatCairoDateLabel,
  formatDepartureTime,
} from "@/lib/time";
import type { TripListingItem } from "@/types/domain";

/**
 * Trip card — DESIGN.md §5.2 and §9.
 *
 * Image-forward: the photograph carries the card, with the yacht name and price
 * laid over it and a scrim guaranteeing contrast (DESIGN.md §7) whatever image is
 * eventually supplied. While `yachtImageUrl` is null it falls back to the treated
 * gradient (context.md §9), so the layout never depends on photography existing.
 *
 * The price sits in the accent gold — DESIGN.md §1 reserves gold for prices and
 * CTAs, and this is the one number a browsing guest is looking for.
 */
export function TripCard({
  trip,
  guestsParam = "",
}: {
  trip: TripListingItem;
  /** e.g. "?guests=4" — carries the hero's party size into Screen 2. */
  guestsParam?: string;
}) {
  const soldOut = trip.seatsRemaining <= 0;

  const today = cairoToday();
  const tomorrow = cairoDateRange(today, 2)[1];
  const isToday = trip.tripDate === today;
  const isTomorrow = trip.tripDate === tomorrow;

  // "Filling fast" mirrors the warning band in DESIGN.md §5.4 so the badge and
  // the seat line can never disagree with each other.
  const fillingFast =
    !soldOut &&
    trip.capacity > 0 &&
    trip.seatsRemaining / trip.capacity <= 0.2;

  return (
    // DESIGN.md §10 — resting elevation, a small lift on hover. The lift is 2px:
    // enough to read as responsive, not enough to make a grid of cards bounce.
    <article className="group flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card transition-[box-shadow,transform,border-color] duration-base ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover">
      <div className="relative h-48 overflow-hidden bg-deep">
        {trip.yachtImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote host is
          // not known until the client supplies photography; revisit with
          // next/image and images.remotePatterns then.
          <img
            src={trip.yachtImageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-deep" />
            <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-accent/15 blur-2xl" />
          </div>
        )}

        {/* Contrast guarantee for the overlaid name and price. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-scrim-strong via-scrim-none to-scrim-none"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {isToday ? (
            <TripBadge tone="accent">{en.tripListing.badgeTonight}</TripBadge>
          ) : null}
          {isTomorrow ? (
            <TripBadge>{en.tripListing.badgeTomorrow}</TripBadge>
          ) : null}
          {soldOut ? (
            <TripBadge tone="danger">{en.tripListing.soldOut}</TripBadge>
          ) : fillingFast ? (
            <TripBadge tone="warning">
              {en.tripListing.badgeFillingFast}
            </TripBadge>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div className="flex flex-col">
            <h3 className="text-xl font-semibold text-text-on-primary">
              {trip.yachtName}
            </h3>
            <p className="text-sm text-text-on-primary/85">
              {formatCairoDateLabel(trip.tripDate)} ·{" "}
              {formatDepartureTime(trip.departureTime)} ·{" "}
              {en.tripListing.durationSummary}
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="block text-xl font-semibold text-accent">
              {formatUsdCents(trip.pricePerGuestUsdCents)}
            </span>
            <span className="block text-xs text-text-on-primary/85">
              {en.common.perPerson}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-sm text-text-secondary">
          {en.tripListing.activitiesSummary}
        </p>

        <SeatAvailability
          seatsRemaining={trip.seatsRemaining}
          capacity={trip.capacity}
        />

        <div className="mt-auto pt-1">
          {soldOut ? (
            <span
              aria-disabled="true"
              className="flex min-h-touch cursor-not-allowed items-center justify-center rounded-sm bg-primary px-4 text-base font-semibold text-text-on-primary opacity-40"
            >
              {en.tripListing.soldOut}
            </span>
          ) : (
            <Link
              href={`/trips/${trip.id}${guestsParam}`}
              className="flex min-h-touch items-center justify-center rounded-sm bg-primary px-4 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
            >
              {en.tripListing.viewTrip}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
