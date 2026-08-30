"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findBookingAction } from "@/lib/actions/organizer.actions";
import { en } from "@/lib/i18n/en";

/**
 * SCREEN 7 — booking code search. PRD_Phase1.md §Screen 7.
 *
 * DESIGN.md §6 specifics honoured here:
 *   - auto-focused on load, so the organizer can type or scan immediately
 *     without a tap
 *   - 24px input text — read at arm's length, outdoors
 *   - 48px minimum targets
 *   - one primary action, nothing competing
 *
 * `autoCapitalize` and `autoCorrect` are off and the value is upper-cased as
 * typed: booking codes are upper-case only, and a phone keyboard "helpfully"
 * autocorrecting one is a support call at the pier.
 *
 * On a hit, it navigates to the confirmation screen rather than checking in from
 * here — DESIGN.md §6 wants a single unmistakable action on its own screen, not
 * a check-in button sitting under a search box where it can be hit by accident.
 */
export function CheckInSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setNotFound(false);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await findBookingAction(trimmed);
      if (result.ok) {
        router.push(`/organizer/check-in/${result.booking.bookingCode}`);
        return;
      }
      setNotFound(true);
      inputRef.current?.select();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2" htmlFor="booking-code">
        <span className="text-base font-semibold text-text-primary">
          {en.organizer.searchLabel}
        </span>
        <input
          ref={inputRef}
          id="booking-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={en.organizer.searchPlaceholder}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="search"
          className="booking-code min-h-touch-organizer rounded-sm border-2 border-border-strong bg-surface px-4 text-[24px] uppercase tracking-wide text-text-primary"
        />
      </label>

      {notFound ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-sm border-2 border-danger bg-danger-tint p-4"
        >
          <p className="text-lg font-semibold text-text-primary">
            {en.organizer.notFoundTitle}
          </p>
          <p className="mt-1 text-base text-text-primary">
            {en.organizer.notFoundBody}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || code.trim().length === 0}
        className="flex min-h-touch-organizer items-center justify-center rounded-sm bg-primary px-6 text-lg font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px disabled:opacity-40"
      >
        {isPending ? en.organizer.searching : en.organizer.searchButton}
      </button>
    </form>
  );
}
