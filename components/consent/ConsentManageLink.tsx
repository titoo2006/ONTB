"use client";

import {
  CONSENT_COOKIE_NAME,
  serialiseConsentCookie,
  DENY_ALL,
} from "@/lib/analytics/consent";
import { en } from "@/lib/i18n/en";

/**
 * The persistent "change your mind" control — a GDPR requirement, not a nicety.
 * Consent that cannot be withdrawn as easily as it was given is not valid
 * consent, so this sits in the footer of every page.
 *
 * Withdrawal resets the decision to DENY_ALL and does a FULL page reload rather
 * than router.refresh(). A soft refresh re-renders the server components, but
 * any vendor script already executing in this tab keeps running — a reload is
 * what actually stops it. Withdrawal has to take effect immediately, not at the
 * guest's next navigation.
 */
export function ConsentManageLink() {
  function reopen() {
    document.cookie = [
      `${CONSENT_COOKIE_NAME}=${serialiseConsentCookie(DENY_ALL)}`,
      "path=/",
      "max-age=0",
      "SameSite=Lax",
    ].join("; ");
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={reopen}
      className="text-sm text-text-on-primary/80 underline underline-offset-4 hover:text-text-on-primary"
    >
      {en.consent.manageLink}
    </button>
  );
}
