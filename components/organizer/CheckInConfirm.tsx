"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { checkInBookingAction } from "@/lib/actions/organizer.actions";
import type { CheckInResult } from "@/lib/services/organizer.service";
import { en } from "@/lib/i18n/en";
import { formatCairoDateLabel, formatDepartureTime } from "@/lib/time";
import type { OrganizerBooking } from "@/lib/services/organizer.service";

/**
 * SCREEN 8 — Check-In Confirmation. PRD_Phase1.md §Screen 8.
 *
 * DESIGN.md §6, which overrides general rules here:
 *   - ONE primary action. No secondary actions compete with "Check in".
 *   - Confirmation is immediate and unmistakable: a full-width success banner
 *     stating the headcount, not a small badge change. An organizer glancing at
 *     a phone in the dark must not have to hunt for whether it worked.
 *   - The headcount is shown large before AND after, so the organizer can count
 *     the group in front of them against the number.
 *
 * The button disables for the whole request — a double tap must not fire two
 * check-ins, and on a pier wifi connection people tap twice.
 */
export function CheckInConfirm({ booking }: { booking: OrganizerBooking }) {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function checkIn() {
    setErrorCode(null);
    startTransition(async () => {
      const outcome = await checkInBookingAction(booking.bookingCode);
      if (outcome.ok) setResult(outcome.result);
      else setErrorCode(outcome.code);
    });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div
          role="status"
          aria-live="assertive"
          className="rounded-md border-4 border-success bg-success-tint p-6 text-center"
        >
          <p className="text-2xl font-semibold text-success">
            ✓ {en.organizer.successTitle}
          </p>
          <p className="mt-2 text-xl font-semibold text-text-primary">
            {en.organizer.successBody(result.headcount, result.guestName)}
          </p>
          <p className="booking-code mt-2 text-text-primary">
            {result.bookingCode}
          </p>
        </div>

        <Link
          href="/organizer/check-in"
          className="flex min-h-touch-organizer items-center justify-center rounded-sm bg-primary px-6 text-lg font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
        >
          {en.organizer.nextBooking}
        </Link>
      </div>
    );
  }

  const alreadyCheckedIn =
    booking.status === "checked_in" ||
    errorCode === "ORGANIZER.ALREADY_CHECKED_IN";
  const blocked =
    booking.status === "expired" ||
    booking.status === "cancelled" ||
    errorCode === "ORGANIZER.NOT_CHECKINABLE";
  const unpaid =
    booking.status === "pending_payment" ||
    errorCode === "ORGANIZER.NOT_CONFIRMED";

  return (
    <div className="flex flex-col gap-6">
      <dl className="rounded-md border-2 border-border bg-surface p-4">
        <Row label={en.organizer.guestLabel} value={booking.guestName} />
        <Row
          label={en.organizer.guestsLabel}
          value={String(booking.headcount)}
          large
        />
        <Row label={en.organizer.yachtLabel} value={booking.yachtName} />
        <Row
          label={en.organizer.departureLabel}
          value={`${formatCairoDateLabel(booking.tripDate)} ${formatDepartureTime(booking.departureTime)}`}
        />
      </dl>

      {alreadyCheckedIn ? (
        <div
          role="status"
          className="rounded-md border-2 border-success bg-success-tint p-4"
        >
          <p className="text-lg font-semibold text-text-primary">
            {en.organizer.alreadyTitle}
          </p>
          {booking.checkedInAt ? (
            <p className="mt-1 text-base text-text-primary">
              {en.organizer.alreadyBody(
                new Date(booking.checkedInAt).toLocaleString("en-GB", {
                  timeZone: "Africa/Cairo",
                }),
              )}
            </p>
          ) : null}
        </div>
      ) : blocked || unpaid ? (
        /* PRD Screen 7 — no override on this screen in Phase 1. The organizer
           escalates to the office; saying so is more useful than a dead end. */
        <div
          role="alert"
          className="rounded-md border-2 border-danger bg-danger-tint p-4"
        >
          <p className="text-lg font-semibold text-text-primary">
            {en.organizer.expiredTitle}
          </p>
          <p className="mt-1 text-base text-text-primary">
            {unpaid ? en.organizer.unpaidBody : en.organizer.expiredBody}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={checkIn}
          disabled={isPending}
          className="flex min-h-touch-organizer items-center justify-center rounded-sm bg-success px-6 py-4 text-xl font-semibold text-text-on-primary hover:opacity-90 active:translate-y-px disabled:opacity-40"
        >
          {isPending
            ? en.organizer.checkingIn
            : en.organizer.checkInButton(booking.headcount)}
        </button>
      )}

      {errorCode &&
      !alreadyCheckedIn &&
      !blocked &&
      !unpaid ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border-2 border-danger bg-danger-tint p-4"
        >
          <p className="text-lg font-semibold text-text-primary">
            {en.organizer.errorTitle}
          </p>
          <p className="mt-1 text-base text-text-primary">
            {en.organizer.errorBody}
          </p>
        </div>
      ) : null}

      <Link
        href="/organizer/check-in"
        className="text-center text-base text-text-secondary underline underline-offset-4"
      >
        {en.organizer.searchTitle}
      </Link>
    </div>
  );
}

function Row({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="text-base text-text-secondary">{label}</dt>
      <dd
        className={
          large
            ? "text-2xl font-semibold text-text-primary"
            : "text-lg font-semibold text-text-primary"
        }
      >
        {value}
      </dd>
    </div>
  );
}
