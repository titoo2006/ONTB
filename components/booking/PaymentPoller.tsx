"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBookingStatusAction } from "@/lib/actions/booking.actions";
import { trackPurchase } from "@/lib/analytics/client";
import { en } from "@/lib/i18n/en";
import type { BookingStatus } from "@/types/domain";

/**
 * SCREEN 4 — Payment Processing. PRD_Phase1.md §Screen 4.
 *
 * This component CANNOT confirm a booking and does not try. It only reads the
 * status the webhook wrote. SECURITY.md §1: the redirect back from Paymob can be
 * spoofed or simply never arrive, so the webhook is the single source of truth.
 * Everything here is observation.
 *
 * Polls every 2s for up to ~20s, then falls back to a reassuring message rather
 * than an error — a slow webhook is not a failed payment, and telling a guest who
 * has just been charged that something failed is the worst possible outcome.
 */

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 20000;

type PollState = "polling" | "timeout" | BookingStatus | "not_found";

export function PaymentPoller({
  bookingCode,
  headcount,
  tripInstanceId,
}: {
  bookingCode: string;
  headcount: number;
  tripInstanceId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<PollState>("polling");
  const purchaseTracked = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      if (cancelled) return;

      const result = await getBookingStatusAction(bookingCode);

      if (cancelled) return;

      if (result.found && result.status !== "pending_payment") {
        setState(result.status);

        if (result.status === "confirmed" && !purchaseTracked.current) {
          purchaseTracked.current = true;
          // The browser half of the Purchase event. The authoritative half is
          // sent server-side from the webhook with the SAME event id, so Meta
          // deduplicates them into one conversion rather than counting two.
          // A no-op without marketing consent — the Pixel was never injected.
          trackPurchase({ bookingId: bookingCode, tripInstanceId, headcount });
        }
        return;
      }

      if (Date.now() - startedAt >= MAX_POLL_MS) {
        setState(result.found ? "timeout" : "not_found");
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [bookingCode, headcount, tripInstanceId]);

  useEffect(() => {
    if (state === "confirmed") {
      router.push(`/booking/${bookingCode}`);
    }
  }, [state, bookingCode, router]);

  if (state === "polling" || state === "confirmed") {
    return (
      <Panel>
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4"
        >
          <div
            aria-hidden="true"
            className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"
          />
          <h1 className="text-2xl font-semibold text-text-primary">
            {en.payment.confirmingTitle}
          </h1>
          <p className="text-base text-text-secondary">
            {en.payment.confirmingBody}
          </p>
        </div>
      </Panel>
    );
  }

  if (state === "cancelled") {
    return (
      <Panel>
        <h1 className="text-2xl font-semibold text-text-primary">
          {en.payment.failedTitle}
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          {en.payment.failedBody}
        </p>
        <HomeLink label={en.payment.failedCta} />
      </Panel>
    );
  }

  if (state === "expired") {
    return (
      <Panel>
        <h1 className="text-2xl font-semibold text-text-primary">
          {en.payment.expiredTitle}
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          {en.payment.expiredBody}
        </p>
        <HomeLink label={en.payment.failedCta} />
      </Panel>
    );
  }

  // timeout, not_found, or any other status: reassure, never imply failure.
  return (
    <Panel>
      <h1 className="text-2xl font-semibold text-text-primary">
        {en.payment.timeoutTitle}
      </h1>
      <p className="mt-2 text-base text-text-secondary">
        {en.payment.timeoutBody}
      </p>
      <p className="mt-4 text-sm text-text-muted">{en.payment.timeoutCta}</p>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-md border border-border bg-surface p-8 text-center shadow-card">
      {children}
    </div>
  );
}

function HomeLink({ label }: { label: string }) {
  return (
    <Link
      href="/"
      className="mt-6 inline-flex min-h-touch items-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
    >
      {label}
    </Link>
  );
}
