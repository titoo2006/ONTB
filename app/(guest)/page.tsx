import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { DateFilter } from "@/components/trips/DateFilter";
import { TripCard } from "@/components/trips/TripCard";
import {
  getNextAvailableDateAction,
  getUpcomingTripsAction,
} from "@/lib/actions/trips.actions";
import { en } from "@/lib/i18n/en";
import { LISTING_WINDOW_DAYS } from "@/lib/services/trips.service";
import { cairoDateRange, cairoToday, formatCairoDateLabel } from "@/lib/time";
import type { CairoDate } from "@/lib/time";
import { parseHeadcount } from "@/lib/validators";

/**
 * SCREEN 1 — Trip Listing (Homepage). PRD_Phase1.md §Screen 1, DESIGN.md §9.
 *
 * Server component. Rule 6: it calls a server action, which calls the service,
 * which is the only thing that touches Supabase.
 *
 * Seat counts are read fresh on every request and never cached (Rule 14) — a page
 * cached for even a minute would show two guests the same stale "12 seats left".
 */
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function TripListingPage({
  searchParams,
}: {
  searchParams: { date?: string; guests?: string };
}) {
  // Never trust the query string. Unparseable values fall back rather than
  // reaching a service (Rule 10). parseHeadcount enforces the same 1–20 bounds
  // the checkout validator uses, so a hand-edited ?guests=999 filters nothing.
  const requested = searchParams.date;
  const selectedDate: CairoDate | undefined =
    requested && DATE_PATTERN.test(requested) ? requested : undefined;
  const selectedGuests = parseHeadcount(searchParams.guests) ?? undefined;

  const today = cairoToday();
  const windowDates = cairoDateRange(today, LISTING_WINDOW_DAYS);

  // A throw here is caught by app/(guest)/error.tsx, which renders the error state.
  const days = await getUpcomingTripsAction(selectedDate, selectedGuests);
  const isEmpty = days.length === 0;
  const nextAvailable = isEmpty
    ? await getNextAvailableDateAction(selectedDate ?? today)
    : null;

  // "Book tonight" should land somewhere bookable. Late in the evening today's
  // sailings have gone, so point at the first date that actually has one.
  const bookTonightDate = days[0]?.date ?? today;

  /** Carries the party size into Screen 2 so the quantity selector is prefilled. */
  const guestsParam = selectedGuests ? `?guests=${selectedGuests}` : "";

  return (
    <>
      <Hero
        bookTonightDate={bookTonightDate}
        selectedDate={selectedDate}
        selectedGuests={selectedGuests}
      />
      <TrustStrip />

      <main id="sailings" className="mx-auto max-w-content px-4 py-12 md:px-6">
        <header className="mb-6 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-text-primary">
            {en.tripListing.pageTitle}
          </h2>
          <p className="text-base text-text-secondary">
            {en.tripListing.pageSubtitle}
          </p>
        </header>

        <div className="mb-8">
          <DateFilter
            dates={windowDates}
            selected={selectedDate}
            guests={selectedGuests}
          />
        </div>

        {isEmpty ? (
          <EmptyState
            nextAvailable={nextAvailable}
            guests={selectedGuests}
            guestsParam={guestsParam}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {days.map((day) => (
              <section key={day.date} className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-text-primary">
                  {formatCairoDateLabel(day.date)}
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {day.trips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      guestsParam={guestsParam}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

/**
 * DESIGN.md §5.5 — plain language plus a way forward, never a bare "No results".
 *
 * With a party-size filter applied, "no trips" may mean "none big enough" rather
 * than "none at all", so the copy says which — otherwise a guest searching for 12
 * concludes we don't sail that day.
 */
function EmptyState({
  nextAvailable,
  guests,
  guestsParam,
}: {
  nextAvailable: CairoDate | null;
  guests: number | undefined;
  guestsParam: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-8 text-center">
      <h3 className="text-lg font-semibold text-text-primary">
        {guests
          ? en.tripListing.emptyTitleForParty(guests)
          : en.tripListing.emptyTitle}
      </h3>
      <p className="mt-2 text-base text-text-secondary">
        {en.tripListing.emptyBody}
      </p>

      {nextAvailable ? (
        <Link
          href={`/?date=${nextAvailable}${guestsParam ? `&guests=${guests}` : ""}`}
          className="mt-6 inline-flex min-h-touch items-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
        >
          {en.tripListing.emptyNextAvailable(
            formatCairoDateLabel(nextAvailable),
          )}
        </Link>
      ) : (
        <Link
          href="/"
          className="mt-6 inline-flex min-h-touch items-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
        >
          {en.tripListing.emptyShowAll}
        </Link>
      )}
    </div>
  );
}
