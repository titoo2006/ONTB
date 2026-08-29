/**
 * SCREEN 4 — Payment Processing. PRD_Phase1.md §Screen 4.
 *
 * This page NEVER confirms a booking. It polls (~2s, up to ~20s) for the status the
 * webhook wrote. If the webhook hasn't landed yet, it shows "still confirming, check
 * your email shortly" — a timeout is not a failure and must not read like one.
 *
 * SCAFFOLD STUB — not built yet.
 */
export default function PaymentProcessingPage() {
  return null;
}
