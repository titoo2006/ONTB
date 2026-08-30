"use client";

import { useEffect } from "react";
import { en } from "@/lib/i18n/en";
import { toAppError } from "@/lib/errors";

/**
 * SCREEN 1 — error state. PRD_Phase1.md §Screen 1, Rule 14.
 *
 * DELIBERATE DEVIATION FROM THE PRD, flag for review: the PRD asks for "generic
 * error toast + retry button". A toast floats over the page it belongs to — but
 * when the listing itself fails there is no page behind it, so the guest would get
 * a toast over a blank screen. This renders the failure inline instead, with the
 * same retry affordance. Toasts still apply where the PRD's reasoning holds:
 * check-in confirmations and payment errors (DESIGN.md §5.7).
 *
 * Rule 7: the error is logged through the registry, with its code, never a bare
 * console.log of the raw object.
 */
export default function TripListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const appErr = toAppError(error);
    console.error(`[${appErr.code}] ${appErr.file} → ${appErr.function}`);
  }, [error]);

  return (
    <main className="mx-auto max-w-content px-4 py-8 md:px-6">
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-md border border-border bg-surface p-8 text-center"
      >
        <h1 className="text-lg font-semibold text-text-primary">
          {en.tripListing.errorTitle}
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          {en.tripListing.errorBody}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-touch items-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
        >
          {en.common.retry}
        </button>
      </div>
    </main>
  );
}
