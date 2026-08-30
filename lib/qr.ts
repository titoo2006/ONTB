import "server-only";
import QRCode from "qrcode";

/**
 * QR code generation for the digital ticket.
 *
 * context.md §6 — the QR encodes the BOOKING CODE itself, not a signed token.
 * PRD_Phase1.md Screen 5 settles this for Phase 1: "default to online lookup only
 * for Phase 1 given organizer will have connectivity at the boarding point".
 *
 * That means the organizer's scanner reads a plain code and looks it up against
 * an authenticated, server-side check-in screen — the QR is a convenience over
 * typing, not a credential. It carries no PII and grants nothing on its own:
 * scanning someone else's ticket photo gets you a code, and the check-in screen
 * behind it still requires an authenticated organizer (SECURITY.md §2).
 *
 * If offline scanning is ever needed, this becomes a signed token and the
 * organizer app verifies the signature locally. Not Phase 1.
 *
 * Rendered as a data URI so the ticket page and the email both work without an
 * image host, and so nothing about a booking is fetched from a third party.
 */
export async function generateBookingQrDataUrl(
  bookingCode: string,
): Promise<string> {
  return QRCode.toDataURL(bookingCode, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: {
      // Deep Nile blue on white — DESIGN.md §1. High contrast matters here:
      // this is scanned outdoors, at night, off a phone screen (DESIGN.md §6).
      dark: "#0B3B5CFF",
      light: "#FFFFFFFF",
    },
  });
}
