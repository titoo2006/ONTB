import { SiteHeader } from "@/components/layout/SiteHeader";
import { en } from "@/lib/i18n/en";
import { getHeroImageUrl } from "@/lib/media";
import { formatUsdCents, GUEST_PRICE_USD_CENTS } from "@/lib/money";

/**
 * Homepage hero — DESIGN.md §9.
 *
 * Built so photography is a drop-in, not a rewrite: when NEXT_PUBLIC_HERO_IMAGE_URL
 * is set the image loads beneath the scrim; when it isn't, the layered gradient
 * treatment stands alone and still reads as designed rather than broken
 * (context.md §9 — no yacht photography exists yet).
 *
 * The scrim is not decoration. White text over an unknown photograph cannot be
 * assumed to clear 4.5:1 (DESIGN.md §7), so the gradient guarantees the contrast
 * regardless of which image is eventually dropped in.
 */
export function Hero() {
  const heroImage = getHeroImageUrl();

  return (
    <section className="relative isolate overflow-hidden bg-deep">
      {heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- source may be a
        // remote host not yet added to next.config images.remotePatterns.
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-deep to-deep" />
          {/* Suggests water and evening light without depicting a boat we can't
              verify — an illustrated yacht would imply a style the real vessels
              may not have (context.md §9). */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary-light/30 to-transparent" />
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>
      )}

      {/* Contrast guarantee for the header and headline. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-scrim-strong via-scrim-soft to-scrim-none"
      />

      <SiteHeader />

      <div className="relative mx-auto max-w-content px-4 pb-12 pt-32 md:px-6 md:pb-12 md:pt-40">
        <p className="mb-4 inline-flex rounded-full border border-text-on-primary/25 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-text-on-primary">
          {en.hero.eyebrow}
        </p>

        <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-text-on-primary">
          {en.hero.titleLine1}
          <br />
          <span className="text-accent">{en.hero.titleLine2}</span>
        </h1>

        <p className="mt-4 max-w-xl text-lg text-text-on-primary/90">
          {en.hero.body}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <a
            href="#sailings"
            className="flex min-h-touch items-center rounded-sm bg-accent px-6 text-base font-semibold text-text-on-accent shadow-card hover:opacity-90 hover:shadow-card-hover active:translate-y-px"
          >
            {en.hero.primaryCta}
          </a>

          <p className="flex items-baseline gap-2 text-text-on-primary">
            <span className="text-sm text-text-on-primary/80">
              {en.hero.priceFrom}
            </span>
            <span className="text-2xl font-semibold">
              {formatUsdCents(GUEST_PRICE_USD_CENTS)}
            </span>
            <span className="text-sm text-text-on-primary/80">
              {en.hero.priceUnit}
            </span>
          </p>
        </div>

        {/*
          CLAUDE.md Rule 13 / DESIGN.md §8 — wherever a USD price appears, the EGP
          disclosure appears with it, at a legible size rather than shrunk into
          fine print. The binding placement is beside the pay button on Screen 3;
          stating it this early means it is never a surprise at checkout.
        */}
        <p className="mt-3 text-sm text-text-on-primary/80">
          {en.checkout.egpDisclosure}
        </p>
      </div>
    </section>
  );
}
