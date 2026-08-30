"use server";

import { AppError, toAppError } from "@/lib/errors";
import {
  getBookingForTicket,
  getBookingStatusByCode,
  type TicketView,
} from "@/lib/services/bookings.service";
import { createTicketToken, emailMatches, verifyTicketToken } from "@/lib/tickets";
import { isValidBookingCode } from "@/lib/booking-code";
import type { BookingStatus } from "@/types/domain";

/**
 * Screens 4 and 5 — payment status polling and the digital ticket.
 *
 * The second-factor gate for ticket access lives here and ONLY here
 * (SECURITY.md §2). bookings.service.getBookingForTicket returns PII to whoever
 * asks, because it has no way to know how the caller arrived — so there must be
 * exactly one door, and this is it.
 */

export type BookingStatusResult =
  | { found: true; status: BookingStatus }
  | { found: false };

/**
 * Screen 4 polling. Returns status ONLY — never PII — because this is reachable
 * with a booking code alone.
 */
export async function getBookingStatusAction(
  bookingCode: string,
): Promise<BookingStatusResult> {
  if (!isValidBookingCode(bookingCode)) return { found: false };

  try {
    const view = await getBookingStatusByCode(bookingCode);
    if (!view) return { found: false };
    return { found: true, status: view.status };
  } catch (err) {
    const appErr = toAppError(err);
    console.error(`[${appErr.code}] ${appErr.file} → ${appErr.function}`);
    return { found: false };
  }
}

export type TicketAccessResult =
  | { ok: true; ticket: TicketView }
  | { ok: false; code: string };

/**
 * Fetch a ticket, given proof of the second factor.
 *
 * Accepts EITHER a valid signed token (what the confirmation email links to) or
 * the email address used at booking. Anything else is refused.
 *
 * Failures are deliberately indistinguishable: a wrong email, an unknown code,
 * and an expired token all return the same error. Telling someone "that code
 * exists but the email is wrong" would confirm the existence of a stranger's
 * booking, which is precisely what SECURITY.md §2 is protecting against.
 */
export async function getTicketAction(
  bookingCode: string,
  proof: { token?: string; email?: string },
): Promise<TicketAccessResult> {
  const deny = {
    ok: false as const,
    code: AppError.BOOKING.TICKET.ACCESS_DENIED.code,
  };

  if (!isValidBookingCode(bookingCode)) return deny;

  try {
    const ticket = await getBookingForTicket(bookingCode);
    if (!ticket) return deny;

    const tokenOk =
      typeof proof.token === "string" &&
      proof.token.length > 0 &&
      verifyTicketToken(proof.token, bookingCode);

    const emailOk =
      typeof proof.email === "string" &&
      proof.email.length > 0 &&
      emailMatches(proof.email, ticket.guestEmail);

    if (!tokenOk && !emailOk) return deny;

    return { ok: true, ticket };
  } catch (err) {
    const appErr = toAppError(err);
    console.error(`[${appErr.code}] ${appErr.file} → ${appErr.function}`);
    return deny;
  }
}

/**
 * Exchange a correct booking email for a signed token, so the guest does not
 * have to retype it on every visit. Returns the token, never the ticket — the
 * caller re-enters through getTicketAction with it.
 */
export async function requestTicketTokenAction(
  bookingCode: string,
  email: string,
): Promise<{ ok: true; token: string } | { ok: false; code: string }> {
  const result = await getTicketAction(bookingCode, { email });
  if (!result.ok) return { ok: false, code: result.code };
  return { ok: true, token: createTicketToken(bookingCode) };
}
