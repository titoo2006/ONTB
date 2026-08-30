/**
 * CLAUDE.md Rule 8 — money is integers, never floats.
 *
 * Units in this codebase, always explicit in the variable name:
 *   - `*_usd_cents`   → USD cents        ($95.00 = 9500)   — the quoted guest price
 *   - `*_piasters`    → Egyptian piasters (1 EGP = 100)    — what Paymob settles in
 *
 * Never `parseFloat`, `toFixed`, or decimal arithmetic on a money value.
 * `Math.round()` exactly once, at the point of calculation — never round twice.
 *
 * NO SPLIT, NO COMMISSION FIELD (decided 2026-08-30, context.md §9). The full
 * $95 per guest, converted to EGP, settles into the client's single Paymob
 * account. The platform's $30 is collected separately and offline by contract and
 * never passes through this system. Nothing here divides a charge, and no
 * commission value is written to any booking. The earlier
 * convert-once-then-split-65/30 rounding rule is void — there is no division and
 * therefore no remainder piaster to assign.
 *
 * A booking's money fields are exactly three: guest_price_usd_cents (per guest),
 * charged_amount_piasters, fx_rate_snapshot_micros.
 */

/**
 * context.md §4 — guest-facing price, quoted in USD, PER GUEST.
 * The booking total is this × headcount and is never stored separately.
 */
export const GUEST_PRICE_USD_CENTS = 9500;

/**
 * The contractual commission per guest — a REPORTING CONSTANT ONLY.
 *
 * Used by the admin reconciliation report (`sum(headcount) × this`) and by the
 * Meta `platform_margin_usd` property. It is never written to a booking, never
 * deducted from a charge, and never reflects money this system has moved — the
 * commission is settled offline (context.md §4).
 */
export const PLATFORM_SHARE_USD_CENTS = 3000;

/**
 * Format USD cents for display, e.g. 9500 -> "$95".
 *
 * Integer arithmetic only. No division into a float, no toFixed — Rule 8 applies to
 * display as much as to storage, because a formatter that rounds is a formatter that
 * can show a guest a different number than we charge them.
 *
 * Whole dollars render without a decimal part ("$95", not "$95.00") — the price is a
 * round number and DESIGN.md §5.2 wants it read at a glance on a card.
 */
export function formatUsdCents(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const dollars = Math.trunc(absolute / 100);
  const remainder = absolute % 100;
  const body =
    remainder === 0
      ? `$${dollars.toLocaleString("en-US")}`
      : `$${dollars.toLocaleString("en-US")}.${String(remainder).padStart(2, "0")}`;
  return negative ? `-${body}` : body;
}

/**
 * Apply the margin buffer to a raw rate, giving the rate actually charged at.
 *
 * `bufferBps` is basis points: 300 = 3%. The result is what gets stored as
 * `fx_rate_snapshot_micros` on the booking, so the charge is exactly
 * reproducible from the stored rate rather than approximately so.
 *
 * This rounds a RATE, not money — Rule 8's "never round twice" concerns money
 * values, and rounding here is what makes the single later money rounding
 * reproducible.
 */
export function applyFxBuffer(rateMicros: number, bufferBps: number): number {
  const scaled = BigInt(rateMicros) * BigInt(10_000 + bufferBps);
  const denominator = 10_000n;
  return Number((scaled + denominator / 2n) / denominator);
}

/**
 * Convert USD cents to Egyptian piasters at a given effective rate.
 *
 * `effectiveRateMicros` is EGP per USD × 1,000,000, buffer already applied.
 *
 *   piasters = usdCents × rateMicros / 1,000,000
 *
 * because usdCents/100 × (rateMicros/1e6) × 100 collapses to exactly that.
 *
 * BigInt throughout, then a single round at the end (Rule 8 — round once, at the
 * point of calculation). BigInt is not paranoia: a large headcount at a weak EGP
 * multiplies to values where float precision would start silently lying, and
 * this number is what a guest's card is charged.
 */
export function convertUsdCentsToPiasters(
  usdCents: number,
  effectiveRateMicros: number,
): number {
  const numerator = BigInt(usdCents) * BigInt(effectiveRateMicros);
  const denominator = 1_000_000n;
  return Number((numerator + denominator / 2n) / denominator);
}
