"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { en } from "@/lib/i18n/en";
import { formatCairoDateLabel, type CairoDate } from "@/lib/time";
import { MAX_HEADCOUNT_PER_BOOKING } from "@/lib/validators";

/**
 * Floating search bar overlapping the bottom of the hero.
 *
 * TWO FILTERS, NOT THREE. Date and party size are real choices for this product.
 * "Destination" and "Price" do not apply — one river, one fixed price. A third
 * filter was considered and rejected: departure time is the only honest
 * candidate, and filtering six sailings down to two solves no problem a guest
 * actually has. The submit button is the third column, which gives the layout
 * its rhythm without inventing a control.
 *
 * STATE LIVES IN THE URL, not in React. The listing already reads `?date=` and
 * server-renders from it, so seat counts are always fresh. Navigating rather
 * than filtering client-side keeps one source of truth, keeps results
 * shareable, and stops this bar from ever disagreeing with the date pills below.
 *
 * `dates` is passed IN from the server on purpose. Building the option list from
 * the browser's clock would put a guest in Los Angeles on a different set of
 * days than the yacht is actually sailing — the exact bug context.md §5.1 exists
 * to prevent.
 */
export function HeroSearchBar({
  dates,
  selectedDate,
  selectedGuests,
}: {
  dates: CairoDate[];
  selectedDate?: CairoDate | undefined;
  selectedGuests?: number | undefined;
}) {
  const router = useRouter();
  const [date, setDate] = useState<string>(selectedDate ?? "");
  const [guests, setGuests] = useState<number>(selectedGuests ?? 2);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    params.set("guests", String(guests));
    startTransition(() => {
      router.push(`/?${params.toString()}#sailings`);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface p-4 shadow-overlay sm:grid-cols-[1fr,1fr,auto] sm:items-end"
    >
      <label className="flex flex-col gap-2" htmlFor="hero-date">
        <span className="text-sm font-semibold text-text-primary">
          {en.heroSearch.dateLabel}
        </span>
        <select
          id="hero-date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="min-h-touch rounded-sm border border-border bg-surface px-3 text-base text-text-primary"
        >
          <option value="">{en.heroSearch.anyDate}</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatCairoDateLabel(d)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2" htmlFor="hero-guests">
        <span className="text-sm font-semibold text-text-primary">
          {en.heroSearch.guestsLabel}
        </span>
        <select
          id="hero-guests"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="min-h-touch rounded-sm border border-border bg-surface px-3 text-base text-text-primary"
        >
          {Array.from({ length: MAX_HEADCOUNT_PER_BOOKING }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {en.heroSearch.guestsOption(n)}
              </option>
            ),
          )}
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-touch items-center justify-center rounded-sm bg-primary px-8 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px disabled:opacity-40"
      >
        {isPending ? en.heroSearch.searching : en.heroSearch.searchButton}
      </button>
    </form>
  );
}
