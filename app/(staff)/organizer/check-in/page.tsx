import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { CheckInSearch } from "@/components/organizer/CheckInSearch";
import { SignOutButton } from "@/components/organizer/SignOutButton";
import { getTodayTripsAction } from "@/lib/actions/organizer.actions";
import { getOrganizerIdentity } from "@/lib/services/organizer.service";
import { en } from "@/lib/i18n/en";
import { formatDepartureTime } from "@/lib/time";

/**
 * SCREEN 7 — Organizer Check-In Search. PRD_Phase1.md §Screen 7.
 *
 * Rule 10 — a signed-in user who is not an active organizer gets a 404, not a
 * redirect and not a 403. We do not confirm this route exists to someone who
 * shouldn't know it does.
 *
 * Never cached: the checked-in counts change constantly during boarding.
 */
export default async function OrganizerCheckInPage() {
  noStore();

  const organizer = await getOrganizerIdentity();
  if (!organizer) notFound();

  const trips = await getTodayTripsAction();

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">
          {en.organizer.searchTitle}
        </h1>
        <SignOutButton />
      </div>

      <CheckInSearch />

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">
          {en.organizer.todayHeading}
        </h2>

        {trips.length === 0 ? (
          <p className="mt-3 text-base text-text-secondary">
            {en.organizer.todayEmpty}
          </p>
        ) : (
          <ul className="mt-3 flex list-none flex-col gap-3">
            {trips.map((trip) => (
              <li
                key={trip.id}
                className="rounded-md border-2 border-border bg-surface p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-lg font-semibold text-text-primary">
                    {formatDepartureTime(trip.departureTime)}
                  </span>
                  <span className="text-base text-text-secondary">
                    {trip.yachtName}
                  </span>
                </div>
                <div className="mt-2 flex gap-6">
                  <span className="text-base text-text-primary">
                    {en.organizer.checkedInLabel}:{" "}
                    <strong className="font-semibold">{trip.checkedIn}</strong>
                  </span>
                  <span className="text-base text-text-primary">
                    {en.organizer.expectedLabel}:{" "}
                    <strong className="font-semibold">
                      {trip.headcountExpected}
                    </strong>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
