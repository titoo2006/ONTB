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

// TODO: convertUsdCentsToPiasters(), the single USD->EGP conversion used at
// checkout handoff. Blocked only on the FX rate source and buffer being agreed
// (context.md §8). Paymob requires piasters at handoff, so this cannot be
// deferred to the webhook — see the 2026-08-30 decision-log entry.
