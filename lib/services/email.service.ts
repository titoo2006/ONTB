import "server-only";
import { AppError, appError } from "@/lib/errors";
import { en } from "@/lib/i18n/en";
import { formatUsdCents } from "@/lib/money";
import { formatCairoDateLabel, formatDepartureTime } from "@/lib/time";

const FILE = "lib/services/email.service.ts";

/**
 * Booking confirmation email.
 *
 * PRD_Phase1.md Screen 5: "Ticket is also emailed to the guest at the address
 * they provided, so it's retrievable even if they don't download it."
 *
 * COMPOSITION IS IMPLEMENTED. SENDING IS NOT — no email provider has been chosen
 * (see context.md §8). This is a real decision, not an oversight: Resend,
 * Postmark, SES and SMTP-via-the-client's-own-domain have materially different
 * deliverability, cost, and data-residency stories, and ~90% of recipients are
 * abroad, so deliverability is not a detail.
 *
 * The transport is deliberately behind an interface so choosing one is a
 * one-file change and nothing above this layer cares.
 *
 * SECURITY.md §8 — this email is transactional: it exists to deliver a ticket the
 * guest paid for. It is NOT marketing, must carry no promotional content, and
 * must not be sent to anyone who did not just book. Marketing to these addresses
 * needs the separate opt-in, which this is not.
 */

export interface BookingConfirmationEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface ConfirmationEmailInput {
  guestName: string;
  guestEmail: string;
  bookingCode: string;
  yachtName: string;
  tripDate: string;
  departureTime: string;
  headcount: number;
  guestPriceUsdCents: number;
  /** Signed link so the guest can reopen the ticket without retyping anything. */
  ticketUrl: string;
  qrDataUrl: string;
}

/**
 * Build the email. Pure — no I/O, so it is testable and cannot fail at send time
 * for a formatting reason.
 *
 * Plain text is built alongside the HTML rather than as an afterthought: a
 * ticket that only renders in an HTML client is a ticket some guests cannot
 * read, and the booking code is the one thing they must be able to get at.
 */
export function buildBookingConfirmationEmail(
  input: ConfirmationEmailInput,
): BookingConfirmationEmail {
  const total = formatUsdCents(input.guestPriceUsdCents * input.headcount);
  const dateLabel = formatCairoDateLabel(input.tripDate);
  const timeLabel = formatDepartureTime(input.departureTime);

  const subject = `${en.ticket.emailSubject} — ${input.bookingCode}`;

  const text = [
    `${en.ticket.emailGreeting(input.guestName)}`,
    "",
    en.ticket.emailIntro,
    "",
    `${en.ticket.bookingCodeLabel}: ${input.bookingCode}`,
    `${en.ticket.yachtLabel}: ${input.yachtName}`,
    `${en.ticket.dateLabel}: ${dateLabel}`,
    `${en.ticket.departureLabel}: ${timeLabel} (${en.ticket.cairoTimeNote})`,
    `${en.ticket.guestsLabel}: ${input.headcount}`,
    `${en.ticket.totalLabel}: ${total}`,
    "",
    en.ticket.showAtBoarding,
    "",
    en.ticket.noRefundNotice,
    "",
    `${en.ticket.viewTicketLabel}: ${input.ticketUrl}`,
  ].join("\n");

  // Inline styles only — email clients strip <style> blocks, and a ticket that
  // arrives unstyled must still be readable, which is why the code is in a
  // <strong> and not merely a coloured div.
  const html = `
<div style="font-family: system-ui, sans-serif; color: #1A2B33; max-width: 560px;">
  <p>${escapeHtml(en.ticket.emailGreeting(input.guestName))}</p>
  <p>${escapeHtml(en.ticket.emailIntro)}</p>

  <div style="border: 1px solid #E4DDCC; border-radius: 10px; padding: 24px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 8px; font-size: 14px; color: #5B6B72;">${escapeHtml(en.ticket.bookingCodeLabel)}</p>
    <p style="margin: 0 0 16px; font-family: ui-monospace, monospace; font-size: 28px; font-weight: 600; letter-spacing: 2px; white-space: nowrap;">
      <strong>${escapeHtml(input.bookingCode)}</strong>
    </p>
    <img src="${input.qrDataUrl}" alt="${escapeHtml(en.ticket.qrAlt)}" width="200" height="200" style="display: block; margin: 0 auto;" />
  </div>

  <table cellpadding="0" cellspacing="0" style="font-size: 16px; line-height: 28px;">
    <tr><td style="color:#5B6B72; padding-right:16px;">${escapeHtml(en.ticket.yachtLabel)}</td><td>${escapeHtml(input.yachtName)}</td></tr>
    <tr><td style="color:#5B6B72; padding-right:16px;">${escapeHtml(en.ticket.dateLabel)}</td><td>${escapeHtml(dateLabel)}</td></tr>
    <tr><td style="color:#5B6B72; padding-right:16px;">${escapeHtml(en.ticket.departureLabel)}</td><td>${escapeHtml(timeLabel)} (${escapeHtml(en.ticket.cairoTimeNote)})</td></tr>
    <tr><td style="color:#5B6B72; padding-right:16px;">${escapeHtml(en.ticket.guestsLabel)}</td><td>${input.headcount}</td></tr>
    <tr><td style="color:#5B6B72; padding-right:16px;">${escapeHtml(en.ticket.totalLabel)}</td><td>${escapeHtml(total)}</td></tr>
  </table>

  <p style="margin-top: 24px;">${escapeHtml(en.ticket.showAtBoarding)}</p>

  <p style="margin-top: 24px; padding: 12px; background: #F1ECE0; border-radius: 6px; font-size: 14px;">
    ${escapeHtml(en.ticket.noRefundNotice)}
  </p>

  <p><a href="${escapeHtml(input.ticketUrl)}">${escapeHtml(en.ticket.viewTicketLabel)}</a></p>
</div>`.trim();

  return { to: input.guestEmail, subject, html, text };
}

/** Guest-supplied values reach this template, so nothing is interpolated raw. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send an already-composed email.
 *
 * ⚠️ SENDING IS DISABLED. This logs and returns; nothing leaves the system.
 *
 * Not a provider problem — a DOMAIN problem. There is no sending domain yet
 * (context.md §8). Guests booked with the client's brand, so mail has to come
 * from the client's domain with SPF, DKIM and DMARC on it, which needs DNS
 * access we do not have. Domain authentication matters more for whether a ticket
 * lands in the inbox than which provider sends it.
 *
 * Deliberately does NOT throw. A guest whose payment succeeded and whose email
 * was never sent still has a valid booking, and the ticket is retrievable from
 * the site — which is exactly why the ticket screen was built to stand alone.
 * Throwing here would risk failing a payment webhook over a notification.
 *
 * It logs through the registry rather than staying silent, so "no email arrived"
 * is visible in the logs instead of being a mystery.
 *
 * To enable: pick a provider, authenticate the sending domain, then replace this
 * body with the provider call. Nothing above this function changes.
 */
export async function sendEmail(email: BookingConfirmationEmail): Promise<void> {
  const err = appError(AppError.EMAIL.PROVIDER_NOT_CONFIGURED, FILE, "sendEmail");
  console.warn(
    `[${err.code}] ${err.file} → ${err.function} — email NOT sent (no sending domain). ` +
      `to=${email.to} subject=${JSON.stringify(email.subject)}`,
  );
}
