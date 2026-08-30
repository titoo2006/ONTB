/**
 * DESIGN.md §5.6 — skeleton screens for trip listings, not spinners. The content
 * shape is visible while loading so the layout doesn't jump when data lands.
 * Mirrors TripCard's proportions deliberately: 48-unit image band, then the
 * activities line, seat line, and CTA.
 */
export function TripCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-md border border-border bg-surface"
      aria-hidden="true"
    >
      <div className="h-48 w-full animate-pulse bg-surface-alt" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-64 animate-pulse rounded-sm bg-surface-alt" />
        <div className="h-4 w-24 animate-pulse rounded-sm bg-surface-alt" />
        <div className="min-h-touch w-full animate-pulse rounded-sm bg-surface-alt" />
      </div>
    </div>
  );
}
