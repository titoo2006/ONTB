/**
 * The analytics event registry — the ONLY place event names and payload shapes
 * are defined.
 *
 * Same principle as lib/errors.ts (Rule 7): a typed registry means an event name
 * cannot be typo'd into existence, and the whole tracking taxonomy is reviewable
 * in one file rather than reconstructed by grepping for `fbq(`.
 *
 * Nothing here dispatches. Dispatch lives in client.ts (browser) and server.ts
 * (Conversions API), both of which refuse to send without consent.
 */

import { GUEST_PRICE_USD_CENTS, PLATFORM_SHARE_USD_CENTS } from "@/lib/money";

/** Meta's standard event names. Ours map onto these 1:1 — no custom events yet. */
export const MetaStandardEvent = {
  PAGE_VIEW: "PageView",
  VIEW_CONTENT: "ViewContent",
  INITIATE_CHECKOUT: "InitiateCheckout",
  PURCHASE: "Purchase",
} as const;

export type MetaStandardEventName =
  (typeof MetaStandardEvent)[keyof typeof MetaStandardEvent];

/**
 * Currency for every value we report.
 *
 * DECIDED — see context.md §9. We report USD, never the EGP actually charged.
 * The EGP figure moves with the FX rate, so identical bookings would report
 * different values month to month, adding noise to ROAS and degrading
 * value-based lookalike audiences. The EGP amount belongs to reconciliation
 * (charged_amount_piasters on the booking), not to ad optimisation.
 */
export const REPORTING_CURRENCY = "USD" as const;

/**
 * Payloads. `value` is always the BOOKING TOTAL, not the per-person price —
 * $95 x headcount. Reporting a flat 95 for every booking would under-report
 * large groups and teach Meta to optimise toward the wrong guests.
 */

export interface ViewContentPayload {
  tripInstanceId: string;
  yachtName: string;
}

export interface InitiateCheckoutPayload {
  tripInstanceId: string;
  headcount: number;
}

export interface PurchasePayload {
  /**
   * Booking id — NOT booking_code.
   *
   * Doubles as Meta's `event_id`, shared between the browser Pixel event and the
   * server Conversions API call so Meta deduplicates them into one conversion
   * instead of counting two. The id is used rather than the code because the
   * code is printed on the guest's ticket and is therefore semi-public
   * (SECURITY.md §2); the id never leaves our systems.
   */
  bookingId: string;
  tripInstanceId: string;
  headcount: number;
}

/** Meta's `value` field is a decimal, so integer cents convert exactly once. */
function bookingTotalUsd(headcount: number): number {
  return metaValueFromUsdCents(GUEST_PRICE_USD_CENTS * headcount);
}

/**
 * Rule 8 boundary. Money is integer cents everywhere in this codebase; Meta's
 * API wants a decimal. This is the single sanctioned place that conversion
 * happens — never inline at a call site, and never with parseFloat.
 */
export function metaValueFromUsdCents(cents: number): number {
  const whole = Math.trunc(cents / 100);
  const remainder = cents % 100;
  return Number(`${whole}.${String(remainder).padStart(2, "0")}`);
}

export function buildViewContentParams(payload: ViewContentPayload) {
  return {
    content_type: "product",
    content_ids: [payload.tripInstanceId],
    content_name: payload.yachtName,
    value: metaValueFromUsdCents(GUEST_PRICE_USD_CENTS),
    currency: REPORTING_CURRENCY,
  };
}

export function buildInitiateCheckoutParams(payload: InitiateCheckoutPayload) {
  return {
    content_type: "product",
    content_ids: [payload.tripInstanceId],
    num_items: payload.headcount,
    value: bookingTotalUsd(payload.headcount),
    currency: REPORTING_CURRENCY,
  };
}

/**
 * Purchase.
 *
 * `value` is GROSS — what the guest paid ($95 x headcount) — which is the
 * standard convention and what Meta's optimiser expects.
 *
 * `platform_margin_usd` carries our actual share ($30 x headcount) alongside it,
 * because only ~32% of the gross is ours (context.md §4). Anyone reading ROAS
 * off the gross number is overstating our real return by roughly 3x: a reported
 * 3.0 ROAS is around break-even for the platform, not triple return. Both
 * numbers exist so the dashboard cannot quietly mislead.
 */
export function buildPurchaseParams(payload: PurchasePayload) {
  return {
    content_type: "product",
    content_ids: [payload.tripInstanceId],
    num_items: payload.headcount,
    value: bookingTotalUsd(payload.headcount),
    currency: REPORTING_CURRENCY,
    platform_margin_usd: metaValueFromUsdCents(
      PLATFORM_SHARE_USD_CENTS * payload.headcount,
    ),
  };
}
