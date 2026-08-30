import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { TripCardSkeleton } from "@/components/trips/TripCardSkeleton";
import { en } from "@/lib/i18n/en";

/**
 * SCREEN 1 — loading state. PRD_Phase1.md §Screen 1 ("skeleton cards (3–4)"),
 * DESIGN.md §5.6 (skeletons, not spinners, so the layout doesn't jump).
 *
 * The hero and trust strip are rendered for real, not skeletonised: they depend
 * on no data, so showing them immediately means the guest sees a finished page
 * with the sailings filling in, rather than a page-wide grey pulse.
 */
export default function TripListingLoading() {
  return (
    <>
      <Hero />
      <TrustStrip />

      <main className="mx-auto max-w-content px-4 py-12 md:px-6">
        <header className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-text-primary">
            {en.tripListing.pageTitle}
          </h2>
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
    </>
  );
}
