import { AppError, appError, toAppError } from "@/lib/errors";
import { verifyPaymobHmac, parsePaymobCallback } from "@/lib/services/payments.service";

/**
 * Paymob payment webhook — the ONLY authoritative confirmation path.
 * SECURITY.md §1 (P0). PRD_Phase1.md Screen 4.
 *
 * CLAUDE.md Rule 18 — who may trigger this write surface: Paymob's servers only,
 * proven by HMAC signature. Never a guest, never a browser, never the redirect.
 *
 * ORDER OF CHECKS — none of these are optional and the order matters:
 *   1. Verify the HMAC signature. Reject AND LOG on failure — never silently
 *      drop, because a stream of failures is either an attack or a
 *      misconfiguration and both need to be visible.
 *   2. Look up the pending_payment booking.
 *   3. Compare the payload's amount against the amount stored on that row. A
 *      mismatch is rejected and flagged for manual review, never accepted. This
 *      is why charged_amount_piasters is NOT NULL at creation — a null here
 *      would make this check a no-op (context.md §9, 2026-08-30).
 *   4. Idempotency: an already-confirmed booking short-circuits. No second
 *      email, no second Purchase event, no second payments row.
 *
 * Always returns 200 for anything Paymob should not retry, and a non-2xx only
 * where a retry could genuinely help. A webhook endpoint that 500s on its own
 * bugs turns one problem into a retry storm.
 */

export async function POST(request: Request): Promise<Response> {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // ---- 1. Signature -------------------------------------------------------
  // Verified against the RAW body, before parsing: parsing first and
  // re-serialising would verify a different byte sequence than the one signed.
  const signatureValid = verifyPaymobHmac(rawBody, request.headers);

  if (!signatureValid) {
    const err = appError(
      AppError.PAYMENT.WEBHOOK_SIGNATURE_INVALID,
      "app/api/webhooks/paymob/route.ts",
      "POST",
    );
    // Logged, never silently dropped (SECURITY.md §1).
    console.error(`[${err.code}] ${err.file} → ${err.function}`);
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const _callback = parsePaymobCallback(rawBody);

    // =======================================================================
    // NOT IMPLEMENTED BELOW — blocked on Paymob credentials and their documented
    // payload shape. Deliberately not guessed at: inventing field names here
    // would produce code that looks finished and silently fails to confirm real
    // bookings, which is worse than an obvious stub.
    //
    // Once credentials and the payload spec are in hand:
    //   2. getBookingByPaymobReference(callback.merchantOrderId)
    //        -> merchant_order_id is set to our booking id at intent creation,
    //           which is what makes their side idempotent too.
    //   3. if (callback.amountPiasters !== booking.charged_amount_piasters)
    //        -> reject, write an audit_log row, flag for manual review. Do NOT
    //           confirm. An amount mismatch is either tampering or a bug and
    //           must never be quietly accepted.
    //   4. if (booking.status === 'confirmed') return 200 immediately.
    //   5. In ONE transaction (a confirm_booking_payment database function,
    //      mirroring reserve_seats_and_create_booking):
    //        - insert the payments row (unique on gateway + gateway_reference,
    //          which is the idempotency backbone)
    //        - move the booking pending_payment -> confirmed
    //        - write the audit_log row
    //      That migration is NOT yet written. It waits on the payload shape,
    //      because which fields the callback actually carries determines what
    //      the function needs to store and compare.
    //   6. After the transaction, best-effort and never fatal:
    //        - sendEmail(buildBookingConfirmationEmail(...))
    //        - sendPurchaseToMeta(..., { analyticsConsent, marketingConsent })
    //          reading the consent snapshot off the booking row, with event_id
    //          = booking id so it deduplicates against the browser Pixel event.
    //      A failure in either must not fail the webhook: the guest has paid and
    //      the booking is confirmed regardless of whether Meta or the mail
    //      provider heard about it.
    // =======================================================================

    return new Response("Not implemented", { status: 501 });
  } catch (err) {
    const appErr = toAppError(err);
    console.error(`[${appErr.code}] ${appErr.file} → ${appErr.function}`);
    // 200 on our own bug: Paymob retrying will not fix it, and a retry storm
    // would bury the original error.
    return new Response("Acknowledged", { status: 200 });
  }
}
