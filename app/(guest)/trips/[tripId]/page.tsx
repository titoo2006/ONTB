import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/trips/BookingForm";
import { SeatAvailability } from "@/components/trips/SeatAvailability";
import { TripViewTracker } from "@/components/trips/TripViewTracker";
import { getTripDetailsAction } from "@/lib/actions/trips.actions";
import { en } from "@/lib/i18n/en";
import { formatCairoDateLabel, formatDepartureTime } from "@/lib/time";
import { parseHeadcount, tripInstanceIdSchema } from "@/lib/validators";

/**
 * SCREEN 2 — Trip Details. PRD_Phase1.md §Screen 2.
 *
 * Server component. Rule 6: page → server action → service → Supabase.
 *
 * Never cached (Rule 14): the seat count shown here feeds the guest-count
 * selector, and a cached page would offer seats that are already gone.
 *
 * Freshness comes from noStore() rather than `export const dynamic =
 * "force-dynamic"`. Either works for caching; noStore() is the narrower tool.
 *
 * KNOWN DEFECT — notFound() here renders the 404 page with an HTTP **200**.
 * The guest layout calls cookies() (consent gating in ConsentScripts), which
 * makes every guest route dynamically rendered and streamed, and a streamed
 * response has already committed its status by the time notFound() runs.
 * Unmatched routes still return a correct 404 because they use the root layout,
 * which does not read cookies.
 *
 * Next injects <meta name="robots" content="noindex"> on the page, so the SEO
 * half is mitigated, but uptime monitoring and link checkers will still see 200.
 * Neither noStore() nor removing a Suspense boundary fixed it — both were tried.
 * Not worked around here because every available workaround trades away either
 * consent gating or seat freshness. Flagged for a decision.
 */
export default async function TripDetailsPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: { guests?: string };
}) {
  noStore();

  // An id that isn't even a uuid never reaches the service (Rule 10). A bad id
  // is a 404, not an error page — PRD_Phase1.md Screen 2.
  const parsed = tripInstanceIdSchema.safeParse(params.tripId);
  if (!parsed.success) notFound();

  const trip = await getTripDetailsAction(parsed.data);
  if (!trip) notFound();

  const soldOut = trip.seatsRemaining <= 0;

  return (
    <main className="mx-auto max-w-content px-4 py-8 md:px-6">
      <TripViewTracker tripInstanceId={trip.id} yachtName={trip.yachtName} />

      <Link
        href="/"
        className="text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
      >
        ← {en.tripDetails.backToListing}
      </Link>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-deep">
        {trip.yachtImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote host is
          // not known until the client supplies photography (context.md §9).
          <img
            src={trip.yachtImageUrl}
            alt=""
            className="h-64 w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-64 w-full bg-gradient-to-br from-primary via-primary-light to-deep"
          />
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-text-primary">
              {trip.yachtName}
            </h1>
            <p className="text-lg text-text-secondary">
              {formatCairoDateLabel(trip.tripDate)} ·{" "}
              {formatDepartureTime(trip.departureTime)} ·{" "}
              {en.tripDetails.durationValue}
            </p>
            <SeatAvailability
              seatsRemaining={trip.seatsRemaining}
              capacity={trip.capacity}
            />
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-text-primary">
              {en.tripDetails.aboutHeading}
            </h2>
            <p className="text-base text-text-secondary">
              {en.tripDetails.aboutBody}
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-text-primary">
              {en.tripDetails.includedHeading}
            </h2>
            <ul className="flex list-none flex-col gap-2">
              {en.tripDetails.included.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-base text-text-secondary"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-tint text-success"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside>
          {soldOut ? (
            <div className="rounded-md border border-border bg-surface p-6 shadow-card">
              <p className="text-lg font-semibold text-danger">
                {en.tripListing.soldOut}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {en.tripDetails.noAlternatives}
              </p>
              <Link
                href="/"
                className="mt-6 flex min-h-touch items-center justify-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
              >
                {en.tripDetails.backToListing}
              </Link>
            </div>
          ) : (
            <BookingForm
              trip={trip}
              initialHeadcount={parseHeadcount(searchParams.guests) ?? 1}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
