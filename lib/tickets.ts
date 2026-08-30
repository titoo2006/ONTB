import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError, appError } from "@/lib/errors";

const FILE = "lib/tickets.ts";

/**
 * Signed ticket-access tokens.
 *
 * SECURITY.md §2 is explicit that a booking code alone must NOT expose a
 * stranger's name, phone, or trip: "the guest-facing 'view my ticket' flow must
 * require the code *plus* a second factor (e.g. email used at booking), not the
 * code alone".
 *
 * So /booking/<code> has two ways in:
 *   1. A signed token in the URL — what the confirmation email links to. The
 *      guest already proved control of that inbox by receiving it.
 *   2. Entering the booking email — the second factor, for anyone typing the
 *      code in by hand.
 *
 * The token binds to one booking code and expires. It is not a session and
 * carries no privileges beyond viewing that one ticket.
 */

/** 30 days. Long enough to cover a trip booked well in advance, not forever. */
export const TICKET_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

interface TicketTokenPayload {
  code: string;
  exp: number;
}

function secret(): string {
  const value = process.env.TICKET_TOKEN_SECRET;
  if (!value || value.length < 32) {
    // Refusing a short secret is deliberate: a guessable signing key makes the
    // whole second factor decorative.
    throw appError(AppError.SYSTEM.CONFIG_MISSING, FILE, "secret");
  }
  return value;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createTicketToken(bookingCode: string): string {
  const payload: TicketTokenPayload = {
    code: bookingCode,
    exp: Math.floor(Date.now() / 1000) + TICKET_TOKEN_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/**
 * Verify a token against a booking code.
 *
 * Compares signatures with timingSafeEqual rather than `===` so the comparison
 * cannot be attacked by timing. Any malformed, mismatched, or expired token is
 * simply "no" — we never explain which, because the difference between "wrong
 * signature" and "expired" is information an attacker can use.
 */
export function verifyTicketToken(token: string, bookingCode: string): boolean {
  const parts = token.split(".");
  const body = parts[0];
  const providedSignature = parts[1];
  if (parts.length !== 2 || !body || !providedSignature) return false;

  let expectedSignature: string;
  try {
    expectedSignature = sign(body);
  } catch {
    return false;
  }

  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length) return false;
  if (!timingSafeEqual(provided, expected)) return false;

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    );
    if (typeof payload !== "object" || payload === null) return false;
    const candidate = payload as Record<string, unknown>;

    if (candidate["code"] !== bookingCode) return false;
    if (typeof candidate["exp"] !== "number") return false;
    if (candidate["exp"] < Math.floor(Date.now() / 1000)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Compare a submitted email against the one on the booking.
 *
 * Normalised the same way the checkout validator normalises it (trimmed,
 * lowercased) so a guest typing "Amelia@Example.com" is not locked out of their
 * own ticket. Constant-time to avoid leaking whether a prefix matched.
 */
export function emailMatches(submitted: string, stored: string): boolean {
  const a = Buffer.from(submitted.trim().toLowerCase());
  const b = Buffer.from(stored.trim().toLowerCase());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
