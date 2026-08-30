"use client";

/**
 * Browser-side dispatch.
 *
 * Every function here is a no-op unless the relevant consent category is on AND
 * the vendor script actually loaded. The script is only injected after consent
 * (see components/consent/ConsentScripts.tsx), so in the normal case `fbq` and
 * `posthog` simply do not exist — these guards are the second line, not the
 * first.
 */

import {
  buildInitiateCheckoutParams,
  buildPurchaseParams,
  buildViewContentParams,
  MetaStandardEvent,
  type InitiateCheckoutPayload,
  type PurchasePayload,
  type ViewContentPayload,
} from "@/lib/analytics/events";

type FbqParams = Record<string, unknown>;
type FbqOptions = { eventID?: string };

interface TrackingWindow extends Window {
  fbq?: (
    command: "track" | "init",
    eventName: string,
    params?: FbqParams,
    options?: FbqOptions,
  ) => void;
  posthog?: {
    capture: (event: string, properties?: Record<string, unknown>) => void;
  };
}

function metaWindow(): TrackingWindow | null {
  if (typeof window === "undefined") return null;
  const w = window as TrackingWindow;
  return typeof w.fbq === "function" ? w : null;
}

function trackMeta(
  eventName: string,
  params?: FbqParams,
  options?: FbqOptions,
): void {
  metaWindow()?.fbq?.("track", eventName, params, options);
}

/** PRD Screen 1 and every guest-facing route. */
export function trackPageView(): void {
  trackMeta(MetaStandardEvent.PAGE_VIEW);
}

/** PRD Screen 2 — a guest opened a specific trip. */
export function trackViewContent(payload: ViewContentPayload): void {
  trackMeta(MetaStandardEvent.VIEW_CONTENT, buildViewContentParams(payload));
}

/** PRD Screen 3 — a guest began checkout. Fired before handing off to Paymob. */
export function trackInitiateCheckout(payload: InitiateCheckoutPayload): void {
  trackMeta(
    MetaStandardEvent.INITIATE_CHECKOUT,
    buildInitiateCheckoutParams(payload),
  );
}

/**
 * PRD Screen 5 — the browser half of the Purchase event.
 *
 * The authoritative half is the Conversions API call in server.ts, fired by the
 * payment webhook. Both are sent deliberately: the browser catches most guests,
 * the server catches the ones who closed the tab or run an ad blocker.
 *
 * `eventID` is the booking id and MUST match the server call, or Meta records
 * two purchases for one booking and every downstream number is inflated.
 */
export function trackPurchase(payload: PurchasePayload): void {
  trackMeta(MetaStandardEvent.PURCHASE, buildPurchaseParams(payload), {
    eventID: payload.bookingId,
  });
}

/** Behavioural event to PostHog. Autocapture covers clicks and scroll; this is
 *  for the few moments worth naming explicitly. */
export function trackBehaviour(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  (window as TrackingWindow).posthog?.capture(event, properties);
}
