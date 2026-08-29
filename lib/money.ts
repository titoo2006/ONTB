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
 * ROUNDING RULE — decided 2026-08-29 (context.md §9). Not negotiable per-call site:
 *   1. Convert the USD total to EGP piasters ONCE. Round once, here, and nowhere else.
 *   2. Split that converted total 65/30 — never convert $65 and $30 separately.
 *   3. Any remainder piaster goes to the OWNER.
 * The two shares therefore always sum to charged_amount_piasters exactly, which the
 * database enforces via `booking_split_sums_to_charge`. Reconciliation against
 * Paymob's settlement is then exact, with no month-end drift to explain.
 *
 * SCAFFOLD STUB — the rule is fixed; the implementation lands with Screen 3.
 */

/** context.md §4 — guest-facing price, quoted in USD. */
export const GUEST_PRICE_USD_CENTS = 9500;

/** context.md §4 — contractual split of the $95 ticket. */
export const OWNER_SHARE_USD_CENTS = 6500;
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

// TODO: convertUsdCentsToPiasters() and splitChargeIntoShares(), implementing the
// rounding rule above. Unblocked — build with Screen 3 (checkout).
