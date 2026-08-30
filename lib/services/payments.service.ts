import "server-only";
import { AppError, appError } from "@/lib/errors";

const FILE = "lib/services/payments.service.ts";

/**
 * Paymob payment intent creation and webhook settlement.
 *
 * SECURITY.md §1 — the webhook is the ONLY thing that marks a booking confirmed.
 * The client-side redirect back from Paymob confirms nothing. Before confirming:
 *   - verify the HMAC signature; reject AND LOG failures (never silently drop)
 *   - compare the webhook's charged amount against the pending_payment row; a
 *     mismatch is rejected and flagged for manual review, never accepted
 *   - be idempotent — a retried webhook must not double-send email or
 *     double-write anything
 *
 * CLAUDE.md Rule 9 — payments are append-only. No .delete(), ever.
 */

/**
 * Whether Paymob is configured well enough to attempt a payment.
 *
 * Checked BEFORE any booking is created. Reserving seats we cannot then charge
 * for would hold inventory against a booking that can never complete — the hold
 * would expire eventually (SECURITY.md §5), but taking seats we know we can't
 * sell is avoidable, so we avoid it.
 */
export function isPaymobConfigured(): boolean {
  return Boolean(
    process.env.PAYMOB_API_KEY &&
      process.env.PAYMOB_INTEGRATION_ID &&
      process.env.PAYMOB_HMAC_SECRET,
  );
}

export interface PaymentIntentInput {
  bookingId: string;
  bookingCode: string;
  amountPiasters: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}

export interface PaymentIntent {
  /** Where to send the guest to pay. */
  redirectUrl: string;
  /** Gateway's own reference, stored on the payments row. */
  gatewayReference: string;
}

/**
 * Create a Paymob payment intent and return where to send the guest.
 *
 * NOT IMPLEMENTED — blocked on Paymob credentials, which is the only remaining
 * dependency for checkout. Everything before this point is wired and tested.
 *
 * When credentials arrive, the flow is:
 *   1. POST /api/auth/tokens with PAYMOB_API_KEY -> auth token
 *   2. POST /api/ecommerce/orders with amount_cents (PIASTERS — Paymob is
 *      EGP-denominated; see context.md §9, 2026-08-30) and merchant_order_id set
 *      to our booking id, which is what makes their side idempotent too
 *   3. POST /api/acceptance/payment_keys with the order id, billing data, and
 *      PAYMOB_INTEGRATION_ID -> payment key
 *   4. Return the hosted checkout / iframe URL built from that key
 *
 * Also write a `payments` row with status 'initiated' and the gateway reference,
 * so the webhook has something to reconcile against.
 */
export async function createPaymentIntent(
  _input: PaymentIntentInput,
): Promise<PaymentIntent> {
  throw appError(
    AppError.BOOKING.CHECKOUT.PAYMENT_UNAVAILABLE,
    FILE,
    "createPaymentIntent",
  );
}
