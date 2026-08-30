import Link from "next/link";
import { PaymentPoller } from "@/components/booking/PaymentPoller";
import { en } from "@/lib/i18n/en";
import { isValidBookingCode } from "@/lib/booking-code";
import { parseHeadcount } from "@/lib/validators";

/**
 * SCREEN 4 — Payment Processing. PRD_Phase1.md §Screen 4.
 *
 * Where Paymob redirects the guest back to. It confirms NOTHING — the booking is
 * marked confirmed only by the webhook (SECURITY.md §1). This page observes.
 *
 * The booking code arrives in the query string. That is safe to expose here: a
 * code alone reveals only a status, never PII (SECURITY.md §2), and the ticket
 * behind it still requires a second factor.
 */
export default function PaymentProcessingPage({
  searchParams,
}: {
  searchParams: { booking?: string; trip?: string; headcount?: string };
}) {
  const bookingCode = (searchParams.booking ?? "").toUpperCase();

  if (!isValidBookingCode(bookingCode)) {
    return (
      <main className="mx-auto max-w-content px-4 py-12 md:px-6">
        <div className="mx-auto max-w-xl rounded-md border border-border bg-surface p-8 text-center shadow-card">
          <h1 className="text-2xl font-semibold text-text-primary">
            {en.checkout.invalidTitle}
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            {en.checkout.invalidBody}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-touch items-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
          >
            {en.checkout.backToTrip}
          </Link>
        </div>
      </main>
    );
  }

  // Only used to populate the Purchase analytics event, never to price anything.
  const headcount = parseHeadcount(searchParams.headcount) ?? 1;
  const tripInstanceId = searchParams.trip ?? "";

  return (
    <main className="mx-auto max-w-content px-4 py-12 md:px-6">
      <PaymentPoller
        bookingCode={bookingCode}
        headcount={headcount}
        tripInstanceId={tripInstanceId}
      />
    </main>
  );
}
