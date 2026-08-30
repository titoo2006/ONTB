/**
 * SCREEN 2 — loading state. Rule 14, DESIGN.md §5.6.
 * Mirrors the detail layout's proportions so nothing jumps when data lands.
 */
export default function TripDetailsLoading() {
  return (
    <main
      className="mx-auto max-w-content px-4 py-8 md:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading trip"
    >
      <div className="h-4 w-24 animate-pulse rounded-sm bg-surface-alt" />
      <div className="mt-6 h-64 w-full animate-pulse rounded-md bg-surface-alt" />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 animate-pulse rounded-sm bg-surface-alt" />
            <div className="h-6 w-80 animate-pulse rounded-sm bg-surface-alt" />
            <div className="h-4 w-32 animate-pulse rounded-sm bg-surface-alt" />
          </div>
          <div className="h-24 w-full animate-pulse rounded-sm bg-surface-alt" />
          <div className="h-32 w-full animate-pulse rounded-sm bg-surface-alt" />
        </div>
        <div className="h-80 w-full animate-pulse rounded-md bg-surface-alt" />
      </div>
    </main>
  );
}
