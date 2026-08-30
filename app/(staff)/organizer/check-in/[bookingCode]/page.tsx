import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { CheckInConfirm } from "@/components/organizer/CheckInConfirm";
import { isValidBookingCode } from "@/lib/booking-code";
import {
  findBookingByCode,
  getOrganizerIdentity,
} from "@/lib/services/organizer.service";
import { en } from "@/lib/i18n/en";

/**
 * SCREEN 8 — Organizer Check-In Confirmation. PRD_Phase1.md §Screen 8.
 *
 * Rule 10 — non-organizers get a 404. A booking for another yacht also 404s,
 * because RLS returns nothing for it: an organizer learns nothing about
 * bookings on a boat they don't work on, which is the same answer they'd get
 * for a typo.
 *
 * Never cached — status changes as guests board, and a cached page could offer
 * a check-in button for a booking already checked in.
 */
export default async function OrganizerCheckInConfirmPage({
  params,
}: {
  params: { bookingCode: string };
}) {
  noStore();

  const organizer = await getOrganizerIdentity();
  if (!organizer) notFound();

  const bookingCode = params.bookingCode.toUpperCase();
  if (!isValidBookingCode(bookingCode)) notFound();

  const booking = await findBookingByCode(bookingCode);
  if (!booking) notFound();

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <p className="booking-code mb-1 text-2xl font-semibold text-text-primary">
        {booking.bookingCode}
      </p>
      <h1 className="mb-6 text-lg text-text-secondary">
        {en.organizer.searchTitle}
      </h1>
      <CheckInConfirm booking={booking} />
    </main>
  );
}
