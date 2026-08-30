import "server-only";

/**
 * Meta Conversions API — the authoritative half of the Purchase event.
 *
 * Called from the Paymob webhook (SECURITY.md §1), which is the only place a
 * booking becomes `confirmed`. The browser Pixel event may never arrive — the
 * guest can close the tab the instant they pay, or block the script entirely —
 * so the conversion that matters is sent server-side.
 *
 * CONSENT (the reason bookings carries consent columns):
 * this runs minutes later, server-to-server, with no cookies and no browser. It
 * cannot ask whether the guest consented, so it reads the snapshot taken at
 * booking creation. `analytics_consent` false means nothing is sent at all.
 * `marketing_consent` false means the event may still be sent but WITHOUT any
 * hashed personal data — SECURITY.md §8 restricts guest contact details to
 * booking and support use absent a separate opt-in, and ad matching is neither.
 *
 * DEDUPLICATION: `event_id` is the booking id and must equal the `eventID` sent
 * by the browser Pixel. Without it Meta counts one booking as two purchases.
 */

import { createHash } from "node:crypto";
import { AppError, appError } from "@/lib/errors";
import {
  buildPurchaseParams,
  MetaStandardEvent,
  type PurchasePayload,
} from "@/lib/analytics/events";

const FILE = "lib/analytics/server.ts";
const GRAPH_API_VERSION = "v21.0";

export interface PurchaseConsent {
  analyticsConsent: boolean;
  marketingConsent: boolean;
}

/** Optional guest details, sent ONLY with marketing consent, only hashed. */
export interface PurchaseMatchData {
  email?: string;
  phone?: string;
}

/**
 * Meta requires SHA-256 of the normalised value — lowercased and trimmed, with
 * phone numbers reduced to digits. Raw values must never leave this process.
 */
function hashForMeta(value: string): string {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function hashPhoneForMeta(value: string): string {
  return createHash("sha256").update(value.replace(/\D/g, "")).digest("hex");
}

/**
 * Send the server-side Purchase event.
 *
 * Returns `false` when nothing was sent (no consent, or not configured) so the
 * caller can log the reason. Never throws on a tracking failure: analytics must
 * not be able to fail a payment webhook. A booking is confirmed whether or not
 * Meta ever hears about it.
 */
export async function sendPurchaseToMeta(
  payload: PurchasePayload,
  consent: PurchaseConsent,
  matchData: PurchaseMatchData = {},
): Promise<boolean> {
  // Gate one: no analytics consent, no event. Not a degraded event — none.
  if (!consent.analyticsConsent) return false;

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return false;

  // Gate two: personal data is attached only with separate marketing consent.
  const userData: Record<string, string[]> = {};
  if (consent.marketingConsent) {
    if (matchData.email) userData["em"] = [hashForMeta(matchData.email)];
    if (matchData.phone) userData["ph"] = [hashPhoneForMeta(matchData.phone)];
  }

  const body = {
    data: [
      {
        event_name: MetaStandardEvent.PURCHASE,
        event_time: Math.floor(Date.now() / 1000),
        // Must match the browser Pixel's eventID — see module comment.
        event_id: payload.bookingId,
        action_source: "website",
        user_data: userData,
        custom_data: buildPurchaseParams(payload),
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const err = appError(
        AppError.ANALYTICS.PURCHASE_DISPATCH_FAILED,
        FILE,
        "sendPurchaseToMeta",
      );
      console.error(`[${err.code}] ${err.file} → ${err.function}`);
      return false;
    }

    return true;
  } catch {
    const err = appError(
      AppError.ANALYTICS.PURCHASE_DISPATCH_FAILED,
      FILE,
      "sendPurchaseToMeta",
    );
    console.error(`[${err.code}] ${err.file} → ${err.function}`);
    return false;
  }
}
