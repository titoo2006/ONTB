"use client";

import { useTransition } from "react";
import { signOutOrganizerAction } from "@/lib/actions/organizer.actions";
import { en } from "@/lib/i18n/en";

/**
 * Sign out.
 *
 * Deliberately small and low-contrast relative to everything else on the screen:
 * DESIGN.md §6 wants one primary action visible at a time, and an organizer
 * mid-shift tapping this by accident is a genuine cost — they'd have to find
 * their password at the pier, in the dark.
 */
export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOutOrganizerAction())}
      disabled={isPending}
      className="shrink-0 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary disabled:opacity-40"
    >
      {en.organizer.signOut}
    </button>
  );
}
