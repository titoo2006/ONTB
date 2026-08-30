"use client";

import { en } from "@/lib/i18n/en";

/**
 * "Print this ticket" — which is also how a guest saves a PDF, since every
 * mobile and desktop print dialogue offers Save as PDF. Phase 1 ships no PDF
 * generator by decision (2026-08-30).
 *
 * Carries `no-print` so the button doesn't appear on the printed sheet.
 */
export function PrintTicketButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print flex min-h-touch items-center justify-center rounded-sm border border-border-strong px-6 text-base font-semibold text-text-primary hover:bg-surface-alt active:translate-y-px"
    >
      {en.ticket.printLabel}
    </button>
  );
}
