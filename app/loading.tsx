import { TripCardSkeleton } from "@/components/trips/TripCardSkeleton";
import { en } from "@/lib/i18n/en";

/**
 * SCREEN 1 — loading state. PRD_Phase1.md §Screen 1 ("skeleton cards (3–4)"),
 * DESIGN.md §5.6 (skeletons, not spinners, so the layout doesn't jump).
 *
 * The heading and date-filter row are NOT skeletonised — they're static and render
 * instantly, so the page reads as "loading trips" rather than "loading everything".
 */
export default function TripListingLoading() {
  return (
    <main className="mx-auto max-w-content px-4 py-8 md:px-6">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-text-primary">
          {en.tripListing.pageTitle}
        </h1>
        <p className="text-base text-text-secondary">
          {en.tripListing.pageSubtitle}
        </p>
      </header>

      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-busy="true"
        aria-label="Loading trips"
      >
        <TripCardSkeleton />
        <TripCardSkeleton />
        <TripCardSkeleton />
        <TripCardSkeleton />
      </div>
    </main>
  );
}
