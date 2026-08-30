-- =============================================================================
-- Consent snapshot on bookings
--
-- NOT YET APPLIED. Rehearse before pushing (CLAUDE.md Rule 19):
--   begin; \i this_file.sql  rollback;
--
-- WHY THIS EXISTS
-- The Meta Purchase event fires from the Paymob webhook — a server-to-server
-- request that arrives minutes after the guest has gone, carrying no cookies and
-- no browser. At that moment there is no way to ask whether this guest consented
-- to tracking. Without a snapshot on the row, consent on our highest-value
-- conversion event is simply unenforceable.
--
-- So the decision is captured at booking creation, next to the money snapshot,
-- and read back by the webhook before anything is sent to Meta.
--
-- Two categories, gated independently:
--   analytics_consent — behavioural analytics (PostHog)
--   marketing_consent — advertising, INCLUDING sending hashed email/phone to
--                       Meta for ad matching. SECURITY.md §8 restricts guest
--                       contact details to booking and support use unless there
--                       is a separate explicit opt-in — this column is that
--                       opt-in, which is why it is not merged with analytics.
--
-- Both default FALSE: absent an affirmative decision, we do not track. Deny by
-- default is the required posture, not a conservative preference.
--
-- CLAUDE.md Rule 18 — write surface: these columns are written ONLY by the
-- booking-creation path, which runs under the service role (SECURITY.md §3:
-- guests have no direct table access). No new RLS policy is added, and no role
-- gains any write capability it did not already have. The webhook reads them;
-- nothing else writes them.
--
-- Like the money snapshot (Rule 8), these are written once at creation and never
-- recalculated. A guest who later changes their cookie preferences does not
-- retroactively alter what was lawful to send for a booking already made — that
-- is what withdrawal is for, going forward.
-- =============================================================================

alter table public.bookings
  add column analytics_consent boolean not null default false,
  add column marketing_consent boolean not null default false,
  add column consent_recorded_at timestamptz;

comment on column public.bookings.analytics_consent is
  'Guest consent to behavioural analytics, snapshotted at booking creation. '
  'Read by the payment webhook before emitting any analytics event.';

comment on column public.bookings.marketing_consent is
  'Guest consent to advertising use, including hashed email/phone sent to Meta '
  'for ad matching (SECURITY.md §8). Never inferred from analytics_consent.';

comment on column public.bookings.consent_recorded_at is
  'When the consent decision was captured. GDPR requires being able to show '
  'that consent was given, and when — a boolean alone cannot evidence that.';
