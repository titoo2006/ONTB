"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { en } from "@/lib/i18n/en";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  customConsent,
  grantAll,
  hasDecided,
  parseConsentCookie,
  rejectAll,
  serialiseConsentCookie,
  type ConsentState,
} from "@/lib/analytics/consent";

/**
 * Cookie consent banner.
 *
 * Two rules this component exists to honour, both of which are requirements
 * rather than preferences:
 *
 * 1. "Reject all" is exactly as prominent as "Accept all" — same size, same
 *    weight, same position, no visual demotion into a link. EU regulators treat
 *    a buried reject as no consent at all, and ~90% of guests are foreign
 *    tourists with many EU residents among them.
 * 2. Nothing non-essential runs until a guest actively chooses. The banner does
 *    not pre-tick anything and closing it grants nothing — there is no dismiss
 *    affordance, because a dismissal is not consent.
 *
 * Writing the cookie then calls router.refresh(), which re-runs the server
 * layout so ConsentScripts can inject the vendor snippets that were previously
 * withheld. The scripts arrive because consent was given, not the reverse.
 */
export function ConsentBanner() {
  const router = useRouter();
  const [decided, setDecided] = useState(true);
  const [customising, setCustomising] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Read on the client so the banner's visibility is never cached in HTML.
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
      ?.split("=")[1];
    setDecided(hasDecided(parseConsentCookie(raw)));
  }, []);

  function persist(state: ConsentState) {
    document.cookie = [
      `${CONSENT_COOKIE_NAME}=${serialiseConsentCookie(state)}`,
      "path=/",
      `max-age=${CONSENT_MAX_AGE_SECONDS}`,
      "SameSite=Lax",
    ].join("; ");
    setDecided(true);
    router.refresh();
  }

  if (decided) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={en.consent.title}
      className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface shadow-overlay"
    >
      <div className="mx-auto max-w-content px-4 py-6 md:px-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {en.consent.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary">
          {en.consent.body}
        </p>

        {customising ? (
          <div className="mt-4 flex flex-col gap-3">
            <CategoryRow
              title={en.consent.necessaryTitle}
              body={en.consent.necessaryBody}
              locked
            />
            <CategoryRow
              title={en.consent.analyticsTitle}
              body={en.consent.analyticsBody}
              checked={analytics}
              onChange={setAnalytics}
            />
            <CategoryRow
              title={en.consent.marketingTitle}
              body={en.consent.marketingBody}
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Accept and Reject are deliberately identical in weight and size. */}
          <button
            type="button"
            onClick={() => persist(grantAll())}
            className="flex min-h-touch items-center justify-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
          >
            {en.consent.acceptAll}
          </button>
          <button
            type="button"
            onClick={() => persist(rejectAll())}
            className="flex min-h-touch items-center justify-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light active:translate-y-px"
          >
            {en.consent.rejectAll}
          </button>

          {customising ? (
            <button
              type="button"
              onClick={() => persist(customConsent({ analytics, marketing }))}
              className="flex min-h-touch items-center justify-center rounded-sm border border-border-strong px-6 text-base font-semibold text-text-primary hover:bg-surface-alt active:translate-y-px"
            >
              {en.consent.save}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCustomising(true)}
              className="flex min-h-touch items-center justify-center rounded-sm border border-border-strong px-6 text-base text-text-primary hover:bg-surface-alt active:translate-y-px"
            >
              {en.consent.customise}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  title,
  body,
  checked,
  onChange,
  locked = false,
}: {
  title: string;
  body: string;
  checked?: boolean;
  onChange?: (next: boolean) => void;
  locked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-sm border border-border bg-bg p-3">
      <input
        type="checkbox"
        checked={locked ? true : checked === true}
        disabled={locked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[color:var(--color-primary)]"
      />
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-text-primary">
          {title}
          {locked ? (
            <span className="ml-2 text-xs text-text-muted">
              {en.consent.necessaryAlways}
            </span>
          ) : null}
        </span>
        <span className="text-sm text-text-secondary">{body}</span>
      </span>
    </label>
  );
}
