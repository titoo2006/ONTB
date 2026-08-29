"use server";

/**
 * Screen 3 — checkout submission.
 *
 * Order of operations (PRD_Phase1.md Screen 3, context.md §5):
 *   1. validate booker input server-side (lib/validators.ts)
 *   2. re-verify seat availability inside a transaction
 *   3. only then create the pending_payment booking row + Paymob intent
 *
 * If seats are gone at submit time: do NOT create a booking row. Return
 * BOOKING.CHECKOUT.CAPACITY_EXCEEDED.
 *
 * SCAFFOLD STUB.
 */

// TODO(scaffold): submitCheckoutAction().
export {};
