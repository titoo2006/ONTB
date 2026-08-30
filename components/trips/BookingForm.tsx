"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { startBookingAction } from "@/lib/actions/trips.actions";
import type { StartBookingResult } from "@/lib/actions/trips.actions";
import { en } from "@/lib/i18n/en";
import { formatUsdCents } from "@/lib/money";
import { formatCairoDateLabel, formatDepartureTime } from "@/lib/time";
import { MAX_HEADCOUNT_PER_BOOKING } from "@/lib/validators";
import type { TripListingItem } from "@/types/domain";

/**
 * Guest count selector and "Book now" (PRD_Phase1.md Screen 2).
 *
 * The cap shown is min(20, seats remaining) — but that is convenience, not a
 * control. The server action re-validates the headcount and re-reads the seat
 * count before letting anyone through to checkout (Rule 10), because the number
 * input can be edited and this page may have been open for several minutes.
 *
 * Rule 14 / DESIGN.md §5.6 — the submit button disables during the request so a
 * double click cannot fire two navigations.
 */
export function BookingForm({
  trip,
  initialHeadcount = 1,
}: {
  trip: TripListingItem;
  /**
   * Prefilled from the hero search bar's party size. Clamped to what this
   * sailing can actually seat — a guest who searched for 12 and opens a trip
   * with 5 left should see 5 selected, not a value the form cannot honour.
   */
  initialHeadcount?: number;
}) {
  const [headcount, setHeadcount] = useState(
    Math.max(1, Math.min(initialHeadcount, trip.seatsRemaining || 1)),
  );
  const [result, setResult] = useState<StartBookingResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const maxSelectable = Math.min(MAX_HEADCOUNT_PER_BOOKING, trip.seatsRemaining);
  const totalUsdCents = trip.pricePerGuestUsdCents * headcount;

  function submit() {
    setResult(null);
    startTransition(async () => {
      // A successful action redirects and never returns a value here.
      const outcome = await startBookingAction(trip.id, headcount);
      setResult(outcome);
    });
  }

  const soldOut = result !== null && !result.ok;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <span className="text-base text-text-secondary">
          {en.tripDetails.priceLabel}
        </span>
        <span className="text-xl font-semibold text-text-primary">
          {formatUsdCents(trip.pricePerGuestUsdCents)}{" "}
          <span className="text-sm font-normal text-text-secondary">
            {en.common.perPerson}
          </span>
        </span>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-text-primary">
          {en.tripDetails.guestsLabel}
        </span>
        <select
          value={headcount}
          onChange={(event) => setHeadcount(Number(event.target.value))}
          disabled={isPending || maxSelectable < 1}
          className="min-h-touch rounded-sm border border-border bg-surface px-3 text-base text-text-primary"
        >
          {Array.from({ length: Math.max(0, maxSelectable) }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ),
          )}
        </select>
        <span className="text-sm text-text-secondary">
          {en.tripDetails.guestsHint(MAX_HEADCOUNT_PER_BOOKING)}
        </span>
      </label>

      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-base font-semibold text-text-primary">
          {en.tripDetails.totalLabel}
        </span>
        <span className="text-2xl font-semibold text-text-primary">
          {formatUsdCents(totalUsdCents)}
        </span>
      </div>

      {/* Rule 13 / DESIGN.md §8 — the EGP disclosure sits with the total at a
          legible size, never shrunk into fine print below the button. */}
      <p className="text-sm text-text-secondary">
        {en.checkout.egpDisclosure}
      </p>

      <button
        type="button"
        onClick={submit}
        disabled={isPending || maxSelectable < 1}
        className="flex min-h-touch items-center justify-center rounded-sm bg-accent px-6 text-base font-semibold text-text-on-accent hover:opacity-90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? en.tripDetails.booking : en.tripDetails.bookNow}
      </button>

      {soldOut && !result.ok ? (
        <div role="alert" aria-live="assertive" className="flex flex-col gap-3">
          <div className="rounded-sm border border-danger bg-danger-tint p-3">
            <p className="text-base font-semibold text-text-primary">
              {en.tripDetails.soldOutTitle}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {en.tripDetails.soldOutBody}
            </p>
          </div>

          {result.alternatives.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-text-primary">
                {en.tripDetails.alternativesHeading}
              </p>
              <ul className="flex list-none flex-col gap-2">
                {result.alternatives.map((alt) => (
                  <li key={alt.id}>
                    <Link
                      href={`/trips/${alt.id}`}
                      className="flex min-h-touch items-center justify-between rounded-sm border border-border px-3 text-sm text-text-primary hover:border-border-strong hover:bg-surface-alt"
                    >
                      <span>
                        {alt.yachtName} ·{" "}
                        {formatCairoDateLabel(alt.tripDate)}{" "}
                        {formatDepartureTime(alt.departureTime)}
                      </span>
                      <span className="font-semibold">
                        {formatUsdCents(alt.pricePerGuestUsdCents)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              {en.tripDetails.noAlternatives}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
