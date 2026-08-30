import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { CheckoutForm } from "@/components/booking/CheckoutForm";
import { getTripDetailsAction } from "@/lib/actions/trips.actions";
import { en } from "@/lib/i18n/en";
import { formatUsdCents } from "@/lib/money";
import { formatCairoDateLabel, formatDepartureTime } from "@/lib/time";
import { startBookingSchema, parseHeadcount } from "@/lib/validators";

/**
 * SCREEN 3 — Checkout. PRD_Phase1.md §Screen 3.
 *
 * Server component. Rule 6: page → server action → service → Supabase.
 *
 * Never cached (Rule 14): the summary quotes a seat count and a total, and both
 * must reflect the database now, not whenever a cache was warmed.
 *
 * The trip and headcount arrive as query params from Screen 2. They are
 * re-validated here rather than trusted — a guest can edit the URL, and this is
 * the page that leads to a charge.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { trip?: string; headcount?: string };
}) {
  noStore();

  const headcount = parseHeadcount(searchParams.headcount);
  const parsed = startBookingSchema.safeParse({
    tripInstanceId: searchParams.trip ?? "",
    headcount: headcount ?? 0,
  });

  if (!parsed.success) return <CheckoutProblem variant="invalid" />;

  const trip = await getTripDetailsAction(parsed.data.tripInstanceId);
  if (!trip) return <CheckoutProblem variant="invalid" />;

  // Sold out before the guest even reaches the form. PRD Screen 3 is explicit
  // that no booking row is created in this case — there is nothing to clean up
  // because nothing was written.
  if (trip.seatsRemaining < parsed.data.headcount) {
    return <CheckoutProblem variant="soldOut" />;
  }

  const totalUsdCents = trip.pricePerGuestUsdCents * parsed.data.headcount;

  return (
    <main className="mx-auto max-w-content px-4 py-8 md:px-6">
      <h1 className="text-2xl font-semibold text-text-primary">
        {en.checkout.pageTitle}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr,1fr]">
        <section className="order-2 lg:order-1">
          <CheckoutForm trip={trip} headcount={parsed.data.headcount} />
        </section>

        <aside className="order-1 lg:order-2">
          <div className="rounded-md border border-border bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold text-text-primary">
              {en.checkout.summaryHeading}
            </h2>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label={en.checkout.yachtLabel} value={trip.yachtName} />
              <Row
                label={en.checkout.dateLabel}
                value={formatCairoDateLabel(trip.tripDate)}
              />
              <Row
                label={en.checkout.departureLabel}
                value={formatDepartureTime(trip.departureTime)}
              />
              <Row
                label={en.checkout.durationLabel}
                value={en.tripDetails.durationValue}
              />
              <Row
                label={en.checkout.guestsLabel}
                value={String(parsed.data.headcount)}
              />
              <Row
                label={en.checkout.perGuestLabel}
                value={formatUsdCents(trip.pricePerGuestUsdCents)}
              />
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-base font-semibold text-text-primary">
                {en.checkout.totalLabel}
              </span>
              <span className="text-2xl font-semibold text-text-primary">
                {formatUsdCents(totalUsdCents)}
              </span>
            </div>

            {/* Rule 13 / DESIGN.md §8 — same size as the surrounding text, not
                shrunk into fine print. */}
            <p className="mt-2 text-sm text-text-secondary">
              {en.checkout.egpDisclosure}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-base text-text-primary">{value}</dd>
    </div>
  );
}

function CheckoutProblem({ variant }: { variant: "invalid" | "soldOut" }) {
  const soldOut = variant === "soldOut";
  return (
    <main className="mx-auto max-w-content px-4 py-12 md:px-6">
      <div className="rounded-md border border-border bg-surface p-8 text-center shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">
          {soldOut ? en.checkout.soldOutTitle : en.checkout.invalidTitle}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-base text-text-secondary">
          {soldOut ? en.checkout.soldOutBody : en.checkout.invalidBody}
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
