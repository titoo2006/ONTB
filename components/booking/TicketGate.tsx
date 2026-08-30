"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestTicketTokenAction } from "@/lib/actions/booking.actions";
import { en } from "@/lib/i18n/en";

/**
 * The second factor — SECURITY.md §2.
 *
 * A booking code alone must not reveal a stranger's name, phone, or trip, so
 * reaching a ticket by typing a code requires the email used at booking. Guests
 * arriving from the confirmation email skip this entirely: that link carries a
 * signed token, and receiving it already proved control of the inbox.
 *
 * On success it puts the token in the URL so a refresh or bookmark still works
 * without retyping. The token is scoped to this one booking and expires.
 */
export function TicketGate({ bookingCode }: { bookingCode: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [denied, setDenied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setDenied(false);
    startTransition(async () => {
      const result = await requestTicketTokenAction(bookingCode, email);
      if (result.ok) {
        router.replace(
          `/booking/${bookingCode}?t=${encodeURIComponent(result.token)}`,
        );
        return;
      }
      setDenied(true);
    });
  }

  return (
    <div className="mx-auto max-w-md rounded-md border border-border bg-surface p-8 shadow-card">
      <h1 className="text-2xl font-semibold text-text-primary">
        {en.ticket.gateTitle}
      </h1>
      <p className="mt-2 text-base text-text-secondary">{en.ticket.gateBody}</p>

      <label className="mt-6 flex flex-col gap-2" htmlFor="ticket-email">
        <span className="text-sm font-semibold text-text-primary">
          {en.ticket.gateEmailLabel}
        </span>
        <input
          id="ticket-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          aria-invalid={denied}
          className="min-h-touch rounded-sm border border-border bg-surface px-3 text-base text-text-primary"
        />
      </label>

      {/*
        One message for every failure — wrong email, unknown code, expired token.
        Distinguishing them would confirm whether a stranger's booking exists.
      */}
      {denied ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {en.ticket.gateDenied}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="mt-6 flex min-h-touch w-full items-center justify-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? en.ticket.gateChecking : en.ticket.gateSubmit}
      </button>
    </div>
  );
}
