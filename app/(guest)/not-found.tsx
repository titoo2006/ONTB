import Link from "next/link";
import { en } from "@/lib/i18n/en";

/**
 * Guest-facing 404 — reached by notFound() from the trip details page when a
 * trip id is invalid, already sailed, or no longer scheduled (PRD_Phase1.md
 * Screen 2: "invalid trip id → 404 page, not a broken detail screen").
 *
 * Lives inside the (guest) group so it keeps the guest layout — footer, consent
 * banner, and the withdrawal link. A guest who lands on a dead link should still
 * be able to change their privacy choices.
 *
 * Deliberately routes them onward rather than dead-ending: someone with a stale
 * link to last night's sailing still wants a cruise.
 */
export default function GuestNotFound() {
  return (
    <main className="mx-auto max-w-content px-4 py-12 md:px-6">
      <div className="rounded-md border border-border bg-surface p-8 text-center shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">
          {en.tripDetails.notFoundTitle}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-base text-text-secondary">
          {en.tripDetails.notFoundBody}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-touch items-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
        >
          {en.tripDetails.backToListing}
        </Link>
      </div>
    </main>
  );
}
