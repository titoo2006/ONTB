/**
 * Consent state — the single gate every tracking call passes through.
 *
 * Stored in a first-party cookie rather than localStorage for one specific
 * reason: the server must be able to read it. That is what lets the layout
 * decide whether to put the Pixel and PostHog snippets into the HTML *at all*.
 * Loading a tracker and then telling it not to track is not consent-gating —
 * the script has already run, set cookies, and phoned home. With a cookie the
 * script is never served in the first place.
 *
 * Two independent categories. Marketing is never inferred from analytics:
 * sending hashed email/phone to Meta for ad matching is a different processing
 * purpose than counting page views, and SECURITY.md §8 requires its own opt-in.
 */

export const CONSENT_COOKIE_NAME = "nb_consent";

/** Bumping this invalidates stored decisions and re-prompts every guest. Do it
 *  whenever the categories or the vendors behind them change materially. */
export const CONSENT_VERSION = 1;

/** One year. Long enough not to nag, short enough to be a periodic re-ask. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface ConsentState {
  version: number;
  /** Behavioural analytics — PostHog. */
  analytics: boolean;
  /** Advertising, including hashed PII sent to Meta for matching. */
  marketing: boolean;
  /** ISO timestamp of the decision. GDPR requires evidencing when consent was
   *  given, which a bare boolean cannot do. */
  decidedAt: string;
}

/**
 * The state before any decision: everything off.
 *
 * Deny by default is the requirement, not a cautious preference. ~90% of guests
 * are foreign tourists and many are EU residents, so pre-ticked or
 * assumed consent is not lawful. Nothing non-essential runs until a guest has
 * actively chosen.
 */
export const DENY_ALL: ConsentState = {
  version: CONSENT_VERSION,
  analytics: false,
  marketing: false,
  decidedAt: "",
};

export function grantAll(): ConsentState {
  return {
    version: CONSENT_VERSION,
    analytics: true,
    marketing: true,
    decidedAt: new Date().toISOString(),
  };
}

export function rejectAll(): ConsentState {
  return {
    version: CONSENT_VERSION,
    analytics: false,
    marketing: false,
    decidedAt: new Date().toISOString(),
  };
}

export function customConsent(choice: {
  analytics: boolean;
  marketing: boolean;
}): ConsentState {
  return {
    version: CONSENT_VERSION,
    analytics: choice.analytics,
    marketing: choice.marketing,
    decidedAt: new Date().toISOString(),
  };
}

/**
 * Parse a cookie value into consent state.
 *
 * Anything unparseable, or from an older consent version, is treated as no
 * decision at all — we re-ask rather than assume. A malformed cookie must never
 * fail open into tracking.
 */
export function parseConsentCookie(raw: string | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null) return null;

    const candidate = parsed as Record<string, unknown>;
    if (candidate["version"] !== CONSENT_VERSION) return null;
    if (
      typeof candidate["analytics"] !== "boolean" ||
      typeof candidate["marketing"] !== "boolean"
    ) {
      return null;
    }

    return {
      version: CONSENT_VERSION,
      analytics: candidate["analytics"],
      marketing: candidate["marketing"],
      decidedAt:
        typeof candidate["decidedAt"] === "string" ? candidate["decidedAt"] : "",
    };
  } catch {
    return null;
  }
}

export function serialiseConsentCookie(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}

/** True once the guest has actively decided — used to hide the banner. */
export function hasDecided(state: ConsentState | null): state is ConsentState {
  return state !== null && state.decidedAt.length > 0;
}
