import Link from "next/link";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HeroSearchBar } from "@/components/home/HeroSearchBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { en } from "@/lib/i18n/en";
import { HERO_IMAGES } from "@/lib/media";
import { formatUsdCents, GUEST_PRICE_USD_CENTS } from "@/lib/money";
import { cairoDateRange, cairoToday, type CairoDate } from "@/lib/time";
import { LISTING_WINDOW_DAYS } from "@/lib/services/trips.service";

/**
 * Homepage hero — DESIGN.md §9.
 *
 * Server component. The rotating background and the search bar are the only
 * client pieces; the headline, CTAs, and price stay server-rendered.
 *
 * Dates for the search bar are computed HERE, server-side, in Cairo — never in
 * the browser (context.md §5.1). ~90% of guests browse from another country.
 *
 * The scrim is not decoration. White text over an unknown photograph cannot be
 * assumed to clear 4.5:1 (DESIGN.md §7), so the gradient guarantees contrast
 * whichever image is showing, and `--color-deep` sits beneath so it holds even
 * if an image fails to load.
 */
export function Hero({
  bookTonightDate,
  selectedDate,
  selectedGuests,
}: {
  /**
   * Where "Book tonight" points. Defaults to today in Cairo; the listing page
   * passes the first date that actually has sailings, so late in the evening —
   * when today's departures have gone — the button lands somewhere bookable
   * rather than on an empty state.
   */
  bookTonightDate?: CairoDate | undefined;
  selectedDate?: CairoDate | undefined;
  selectedGuests?: number | undefined;
}) {
  const today = cairoToday();
  const dates = cairoDateRange(today, LISTING_WINDOW_DAYS);
  const tonight = bookTonightDate ?? today;

  return (
    <section className="relative isolate bg-deep pb-16 sm:pb-12">
      <HeroCarousel images={HERO_IMAGES} />

      {/* Contrast guarantee for the header and headline. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-scrim-strong via-scrim-soft to-scrim-none"
      />

      <SiteHeader />

      <div className="relative mx-auto max-w-content px-4 pb-24 pt-32 md:px-6 md:pb-28 md:pt-40">
        <p className="mb-4 inline-flex rounded-full border border-text-on-primary/25 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-text-on-primary">
          {en.hero.eyebrow}
        </p>

        <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-text-on-primary">
          {en.hero.titleLine1}
          <br />
          <span className="text-accent">{en.hero.titleLine2}</span>
        </h1>

        <p className="mt-4 max-w-xl text-lg text-text-on-primary/90">
          {en.hero.body}
        </p>

        {/* Two CTAs with genuinely different destinations. Both pointing at the
            listing would be two buttons doing one thing. */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#sailings"
            className="flex min-h-touch items-center rounded-sm bg-accent px-6 text-base font-semibold text-text-on-accent shadow-card hover:opacity-90 hover:shadow-card-hover active:translate-y-px"
          >
            {en.hero.ctaPrimary}
          </a>
          <Link
            href={`/?date=${tonight}#sailings`}
            className="flex min-h-touch items-center rounded-sm border border-text-on-primary/40 px-6 text-base font-semibold text-text-on-primary hover:bg-text-on-primary/10 active:translate-y-px"
          >
            {en.hero.ctaSecondary}
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-baseline gap-2 text-text-on-primary">
          <span className="text-sm text-text-on-primary/80">
            {en.hero.priceFrom}
          </span>
          <span className="text-2xl font-semibold">
            {formatUsdCents(GUEST_PRICE_USD_CENTS)}
          </span>
          <span className="text-sm text-text-on-primary/80">
            {en.hero.priceUnit}
          </span>
          {/*
            CLAUDE.md Rule 13 / DESIGN.md §8 — wherever a USD price appears, the
            EGP disclosure appears with it, at a legible size rather than shrunk
            into fine print. The binding placement is beside the pay button on
            Screen 3; saying it this early means it is never a surprise.
          */}
          <span className="w-full text-sm text-text-on-primary/80">
            {en.checkout.egpDisclosure}
          </span>
        </div>
      </div>

      {/* Floating search bar, overlapping the bottom edge of the hero. */}
      <div className="relative mx-auto -mb-28 max-w-content px-4 md:px-6">
        <HeroSearchBar
          dates={dates}
          selectedDate={selectedDate}
          selectedGuests={selectedGuests}
        />
      </div>
    </section>
  );
}
