"use client";

import { useState, useTransition } from "react";
import { signInOrganizerAction } from "@/lib/actions/organizer.actions";
import { en } from "@/lib/i18n/en";

/**
 * SCREEN 6 — organizer sign-in form.
 *
 * DESIGN.md §6 governs this screen, overriding general rules: 48px minimum tap
 * targets, high contrast only, large text. It is used outdoors, often
 * one-handed, by non-technical staff, possibly in glare.
 *
 * The error is deliberately generic. Distinguishing "wrong password" from "not
 * an organizer" would let anyone with the URL discover which addresses are staff
 * accounts.
 */
export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFailed(false);
    startTransition(async () => {
      const result = await signInOrganizerAction(email, password);
      // A success redirects and never returns.
      if (!result.ok) setFailed(true);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2" htmlFor="email">
        <span className="text-base font-semibold text-text-primary">
          {en.organizer.emailLabel}
        </span>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          required
          className="min-h-touch-organizer rounded-sm border-2 border-border-strong bg-surface px-4 text-lg text-text-primary"
        />
      </label>

      <label className="flex flex-col gap-2" htmlFor="password">
        <span className="text-base font-semibold text-text-primary">
          {en.organizer.passwordLabel}
        </span>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="min-h-touch-organizer rounded-sm border-2 border-border-strong bg-surface px-4 text-lg text-text-primary"
        />
      </label>

      {failed ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-sm border-2 border-danger bg-danger-tint p-4 text-base font-semibold text-text-primary"
        >
          {en.organizer.signInError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-touch-organizer items-center justify-center rounded-sm bg-primary px-6 text-lg font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px disabled:opacity-40"
      >
        {isPending ? en.organizer.signingIn : en.organizer.signInButton}
      </button>
    </form>
  );
}
