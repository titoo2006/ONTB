import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PrintTicketButton } from "@/components/booking/PrintTicketButton";
import { TicketGate } from "@/components/booking/TicketGate";
import { getTicketAction } from "@/lib/actions/booking.actions";
import { isValidBookingCode } from "@/lib/booking-code";
import { en } from "@/lib/i18n/en";
import { formatUsdCents } from "@/lib/money";
import { generateBookingQrDataUrl } from "@/lib/qr";
import { formatCairoDateLabel, formatDepartureTime } from "@/lib/time";

/**
 * SCREEN 5 — Booking Confirmation / Digital Ticket. PRD_Phase1.md §Screen 5.
 *
 * Access requires a second factor (SECURITY.md §2): either the signed token the
 * confirmation email links to, or the booking email entered on the gate. A
 * booking code alone gets you the gate, never the ticket.
 *
 * Never cached — status can change (a no-show becomes `expired`) and a cached
 * ticket would show a stale one.
 */
export default async function BookingTicketPage({
  params,
  searchParams,
}: {
  params: { bookingCode: string };
  searchParams: { t?: string };
}) {
  noStore();

  const bookingCode = params.bookingCode.toUpperCase();
  if (!isValidBookingCode(bookingCode)) notFound();

  const token = searchParams.t;
  const result = await getTicketAction(bookingCode, {
    ...(token ? { token } : {}),
  });

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-content px-4 py-12 md:px-6">
        <TicketGate bookingCode={bookingCode} />
      </main>
    );
  }

  const { ticket } = result;
  const qrDataUrl = await generateBookingQrDataUrl(ticket.bookingCode);
  const total = formatUsdCents(ticket.guestPriceUsdCents * ticket.headcount);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <div className="print-ticket overflow-hidden rounded-md border border-border bg-surface shadow-card">
        <div className="bg-primary px-6 py-6 text-center">
          <p className="text-sm text-text-on-primary/80">
            {en.ticket.bookingCodeLabel}
          </p>
          {/* DESIGN.md §2 — monospace, tabular, 18px minimum, never wrapping.
              The organizer reads this off a phone, outdoors, quickly. */}
          <p className="booking-code mt-1 text-3xl font-semibold text-text-on-primary">
            {ticket.bookingCode}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated
              data URI, not a remote image; next/image adds nothing here. */}
          <img
            src={qrDataUrl}
            alt={en.ticket.qrAlt}
            width={220}
            height={220}
            className="rounded-sm"
          />

          <dl className="w-full max-w-sm">
            <Row label={en.ticket.yachtLabel} value={ticket.yachtName} />
            <Row
              label={en.ticket.dateLabel}
              value={formatCairoDateLabel(ticket.tripDate)}
            />
            <Row
              label={en.ticket.cairoTimeLabel}
              value={formatDepartureTime(ticket.departureTime)}
            />
            <Row
              label={en.ticket.guestsLabel}
              value={String(ticket.headcount)}
            />
            <Row label={en.ticket.totalLabel} value={total} />
          </dl>

          <p className="text-center text-base text-text-secondary">
            {en.ticket.showAtBoarding}
          </p>
          <p className="text-center text-sm text-text-secondary">
            {en.ticket.arriveEarly}
          </p>

          {/* context.md §9 — restated on the ticket as well as before payment. */}
          <p className="w-full rounded-sm bg-surface-alt p-4 text-center text-sm text-text-primary">
            {en.ticket.noRefundNotice}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <PrintTicketButton />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-base font-semibold text-text-primary">{value}</dd>
    </div>
  );
}
