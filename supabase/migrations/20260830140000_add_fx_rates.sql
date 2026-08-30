-- =============================================================================
-- USD -> EGP rate, with a margin buffer
--
-- NOT YET APPLIED. Rehearse before pushing (CLAUDE.md Rule 19):
--   begin; \i this_file.sql  rollback;
--
-- WHY A TABLE AND NOT AN ENV VAR
-- Paymob is EGP-denominated and requires the amount in piasters at handoff, so we
-- must convert USD to EGP ourselves — the gateway does not do it for us
-- (context.md §9, 2026-08-30). Phase 1 uses a fixed rate we set and review, not a
-- live FX API: a booking that fails because a rates API timed out is a worse
-- problem than a rate that is a few days stale.
--
-- That rate has to be changeable without a deploy, and its changes have to be
-- dated. An environment variable is neither: on Vercel it needs a redeploy to
-- take effect, and it carries no history, so "log it when you change it" would
-- depend on someone remembering — exactly the discipline that fails over months.
--
-- APPEND-ONLY BY DESIGN. Changing the rate means INSERTING a row, never updating
-- one. The table therefore *is* the change log: every rate we have ever used,
-- with the date it took effect and a note saying why. Nothing separate to
-- maintain, and nothing to forget.
--
-- It also makes staleness detectable, which an env var cannot do. The admin
-- dashboard reads the newest row's age and warns past 14 days. The failure mode
-- being defended against is nobody noticing, not the number being slightly off.
--
-- THE BUFFER
-- buffer_bps is a margin added on top of the raw rate, in basis points
-- (300 = 3%). It absorbs ordinary EGP drift between weekly reviews.
--
-- Note whose margin it protects: the full charge settles to the CLIENT, and our
-- $30 is contractual and settled offline (context.md §4). So the buffer protects
-- the client's revenue against the currency moving, not ours. That is a
-- commercial fact the client should understand is happening, not something done
-- quietly on their behalf.
--
-- Raw rate and buffer are stored SEPARATELY rather than pre-multiplied, so the
-- margin is visible and auditable instead of baked into one opaque number.
--
-- CLAUDE.md Rule 18 — write surface: system/admin only.
-- WHO may insert: nobody through the application. There is no insert policy and
-- no grant to anon or authenticated. Rows are added by an admin via SQL/Studio,
-- or by the service role, which bypasses RLS. WHY: this value directly determines
-- what every guest is charged. A write path reachable from a browser would be a
-- way to alter prices, so there is deliberately no such path. Reads are
-- service-role only too — the rate is internal pricing config and the browser has
-- no reason to see it.
-- =============================================================================

create table public.fx_rates (
  id            uuid primary key default gen_random_uuid(),

  -- EGP per 1 USD, x1,000,000, stored as an integer so no float arithmetic ever
  -- touches a money path (Rule 8). 48.75 EGP/USD = 48750000.
  rate_micros   bigint not null check (rate_micros > 0),

  -- Margin buffer in basis points. 300 = 3%. Capped well below anything sane so
  -- a typo cannot quietly double what guests are charged.
  buffer_bps    integer not null default 300
                  check (buffer_bps >= 0 and buffer_bps <= 2000),

  effective_from timestamptz not null default now(),

  -- Why this rate was set. Free text, and worth filling in: this column is what
  -- makes the history readable a year later.
  note          text,

  created_at    timestamptz not null default now()
);

-- The service reads the newest applicable rate on every checkout.
create index fx_rates_effective_from_idx
  on public.fx_rates (effective_from desc);

comment on table public.fx_rates is
  'Append-only history of the USD->EGP rate used at checkout. Never UPDATE or '
  'DELETE a row — insert a new one. The table is the change log.';

comment on column public.fx_rates.buffer_bps is
  'Margin buffer in basis points added on top of rate_micros (300 = 3%). '
  'Protects the client''s revenue against currency drift between reviews, since '
  'the full charge settles to them.';

-- ---------------------------------------------------------------------------
-- RLS — SECURITY.md §3 pattern for internal tables.
-- Enabled with NO policies and NO grants: that denies everything to anon and
-- authenticated by default. Only the service role reaches this table.
-- ---------------------------------------------------------------------------
alter table public.fx_rates enable row level security;

revoke all on public.fx_rates from anon, authenticated;
