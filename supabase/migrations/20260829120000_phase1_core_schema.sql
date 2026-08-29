-- =============================================================================
-- Phase 1 — core schema
-- Source of truth: context.md §7. RLS design intent: SECURITY.md §3.
--
-- NOT YET APPLIED. Rehearse before pushing (CLAUDE.md Rule 19):
--   begin; \i this_file.sql  rollback;
-- against a dev branch, then `supabase db push`.
--
-- Design rules enforced structurally in this file:
--   Rule 8  — all money is BIGINT in the smallest unit. No numeric/float anywhere.
--   Rule 9  — bookings/payments/trip_instances/audit_log are append-only to clients:
--             DELETE is revoked at the privilege level, not merely by convention.
--   Rule 18 — every write-capable policy states who may trigger it and why.
--   SEC §3  — RLS is enabled on every table in this migration, no exceptions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Enums
-- -----------------------------------------------------------------------------

-- context.md §7 — a booking never disappears, it only moves through these.
create type public.booking_status as enum (
  'pending_payment',
  'confirmed',
  'checked_in',
  'expired',
  'cancelled'
);

create type public.trip_instance_status as enum (
  'scheduled',
  'departed',
  'cancelled'
);

create type public.payment_status as enum (
  'initiated',
  'succeeded',
  'failed'
);

create type public.admin_role as enum (
  'super_admin',
  'staff'
);


-- -----------------------------------------------------------------------------
-- 1. yachts
-- -----------------------------------------------------------------------------
-- context.md §5 — capacity is a property of the yacht. 500 is never hardcoded.

create table public.yachts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  capacity    integer not null check (capacity > 0),

  -- Nullable on purpose: no yacht photography exists yet (decided 2026-08-29,
  -- context.md §9). Trip cards render a treated placeholder while this is null,
  -- so dropping in real photos later is a data update, not a migration.
  image_url   text,

  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on column public.yachts.capacity is
  'Current guest capacity. Trip instances snapshot this at creation so a later '
  'refit never retroactively changes the capacity of a trip that already ran.';


-- -----------------------------------------------------------------------------
-- 2. trip_instances
-- -----------------------------------------------------------------------------
-- One yacht, one date, one departure slot. 6 rows per operating day (context.md §5).

create table public.trip_instances (
  id              uuid primary key default gen_random_uuid(),
  yacht_id        uuid not null references public.yachts (id) on delete restrict,
  trip_date       date not null,
  departure_time  time not null,

  -- Snapshot of yachts.capacity at creation time. See comment on yachts.capacity.
  capacity        integer not null check (capacity > 0),

  -- Denormalised seat counter. Counts headcount of every booking holding a seat:
  -- pending_payment + confirmed + checked_in. Released when a booking moves to
  -- expired or cancelled. Only ever mutated inside the checkout transaction
  -- (context.md §5) — never by a client, never by a plain UPDATE from a route.
  seats_booked    integer not null default 0 check (seats_booked >= 0),

  status          public.trip_instance_status not null default 'scheduled',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- The overselling backstop. Even if application logic is wrong, the database
  -- refuses to record more seats than the trip has.
  constraint trip_instance_not_oversold check (seats_booked <= capacity),

  -- One trip instance per yacht per slot — no accidental duplicates.
  constraint trip_instance_unique_slot unique (yacht_id, trip_date, departure_time)
);

-- Screen 1 lists today + next 6 days, scheduled only.
create index trip_instances_date_status_idx
  on public.trip_instances (trip_date, status);


-- -----------------------------------------------------------------------------
-- 3. bookings
-- -----------------------------------------------------------------------------
-- CLAUDE.md Rule 9 — append-only. Status transitions only, never a DELETE.

create table public.bookings (
  id                 uuid primary key default gen_random_uuid(),

  -- SECURITY.md §2 — random, non-sequential, unambiguous charset, generated in
  -- lib/booking-code.ts. NOT derived from this row's id, timestamp, or guest data.
  booking_code       text not null,

  trip_instance_id   uuid not null references public.trip_instances (id) on delete restrict,

  -- SECURITY.md §8 — PII is limited to what is operationally needed. No passport
  -- or ID document fields. Do not add fields "in case they're needed later".
  guest_name         text not null check (length(btrim(guest_name)) > 0),
  guest_email        text not null check (length(btrim(guest_email)) > 0),
  guest_phone        text not null check (length(btrim(guest_phone)) > 0),
  nationality        char(2) not null,        -- ISO 3166-1 alpha-2

  headcount          integer not null check (headcount > 0),

  -- ---- Money snapshot (CLAUDE.md Rule 8) -----------------------------------
  -- Written ONCE at booking creation, never recalculated. If the commission rule
  -- or the FX rate changes tomorrow, past bookings must not silently change value.
  -- All BIGINT, smallest unit. No float, no numeric, ever.
  guest_price_usd_cents     bigint not null check (guest_price_usd_cents  >= 0),
  charged_amount_piasters   bigint not null check (charged_amount_piasters >= 0),
  fx_rate_snapshot_micros   bigint not null check (fx_rate_snapshot_micros > 0),
  owner_share_piasters      bigint not null check (owner_share_piasters    >= 0),
  platform_share_piasters   bigint not null check (platform_share_piasters >= 0),
  -- --------------------------------------------------------------------------

  status             public.booking_status not null default 'pending_payment',

  -- SECURITY.md §5 — the unpaid-hold deadline for a pending_payment row (~15 min),
  -- after which the held seats are released.
  --
  -- This is the ONLY thing this column means. The 30-minute no-show cutoff is
  -- never stored: the expiry job derives it as departure_time + 30 min each time
  -- it runs (decided 2026-08-29, context.md §9). Do not add a second column for it.
  expires_at         timestamptz,

  checked_in_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Rule 8 rounding rule, fixed 2026-08-29 (context.md §9): the USD total is
  -- converted to EGP ONCE, then that converted total is split 65/30, with any
  -- remainder piaster going to the owner. The two shares therefore always sum to
  -- the amount actually charged — so reconciliation against Paymob's settlement is
  -- exact, and a split that drifts by a piaster is rejected by the database rather
  -- than discovered in a month-end report.
  constraint booking_split_sums_to_charge check (
    owner_share_piasters + platform_share_piasters = charged_amount_piasters
  ),

  constraint booking_code_unique unique (booking_code),
  -- Must stay in step with BOOKING_CODE_ALPHABET in lib/booking-code.ts:
  -- 2-9 and A-Z excluding I, L, O (ambiguous when read off a phone outdoors).
  constraint booking_code_shape check (booking_code ~ '^[2-9A-HJKMNP-Z]{8}$'),

  -- A booking is checked in if and only if it carries a check-in timestamp.
  constraint checked_in_at_matches_status check (
    (status = 'checked_in' and checked_in_at is not null) or
    (status <> 'checked_in' and checked_in_at is null)
  )
);

comment on column public.bookings.fx_rate_snapshot_micros is
  'USD->EGP rate at booking time, x1,000,000, stored as an integer so no float '
  'arithmetic touches a money path (Rule 8). 48.75 EGP/USD = 48750000.';

create index bookings_trip_instance_idx on public.bookings (trip_instance_id);
create index bookings_status_idx        on public.bookings (status);
-- Screen 7: the organizer looks up by code, constantly, on a phone.
create index bookings_code_idx          on public.bookings (booking_code);


-- -----------------------------------------------------------------------------
-- 4. payments
-- -----------------------------------------------------------------------------
-- SECURITY.md §3 — no client-side access of any kind. Service role only.

create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            uuid not null references public.bookings (id) on delete restrict,
  gateway               text not null default 'paymob',
  gateway_reference     text not null,
  amount_piasters       bigint not null check (amount_piasters >= 0),
  status                public.payment_status not null default 'initiated',
  raw_gateway_response  jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- SECURITY.md §1 — the idempotency backbone. A retried webhook for a reference
  -- already recorded cannot insert a second row, so the confirmation email and the
  -- commission split cannot be double-written even if handler logic slips.
  constraint payment_gateway_reference_unique unique (gateway, gateway_reference)
);

create index payments_booking_idx on public.payments (booking_id);


-- -----------------------------------------------------------------------------
-- 5. organizer_users / admin_users
-- -----------------------------------------------------------------------------
-- Roles are read from the authenticated Supabase session and these tables only —
-- never from localStorage, a route param, or a query string (Rule 10).

create table public.organizer_users (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  assigned_yacht_id  uuid references public.yachts (id) on delete set null,  -- null = all yachts
  active             boolean not null default true,
  created_at         timestamptz not null default now(),

  constraint organizer_user_unique unique (user_id)
);

create table public.admin_users (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.admin_role not null default 'staff',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),

  constraint admin_user_unique unique (user_id)
);


-- -----------------------------------------------------------------------------
-- 6. audit_log
-- -----------------------------------------------------------------------------
-- SECURITY.md "Cross-Reference: Audit Logging" — every state-changing action on a
-- booking lands here: creation, payment confirmation, check-in, expiry.
-- Insert-only from server-side code. Never updated, never deleted.

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor       uuid,          -- auth.users id, or null for system/cron/webhook actors
  actor_type  text not null, -- 'guest' | 'organizer' | 'admin' | 'system'
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index audit_log_entity_idx     on public.audit_log (entity, entity_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);


-- -----------------------------------------------------------------------------
-- 7. updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trip_instances_set_updated_at
  before update on public.trip_instances
  for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 8. Role predicates
-- -----------------------------------------------------------------------------
-- security definer so a policy on `bookings` can consult `organizer_users` without
-- recursively triggering that table's own RLS. These functions READ ONLY — they
-- write nothing, so Rule 18's write-surface declaration does not apply to them.

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = auth.uid() and a.active
  );
$$;

-- True when the caller is an active organizer entitled to this yacht.
-- A null assigned_yacht_id means "all yachts" (context.md §7).
create or replace function public.organizer_covers_yacht(target_yacht_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizer_users o
    where o.user_id = auth.uid()
      and o.active
      and (o.assigned_yacht_id is null or o.assigned_yacht_id = target_yacht_id)
  );
$$;


-- =============================================================================
-- 9. ROW LEVEL SECURITY
-- =============================================================================
-- SECURITY.md §3 — enabled on every table, from the first migration.
--
-- WRITE SURFACES IN THIS MIGRATION: none. Deliberately.
-- Rule 18 requires every write-capable policy to name who may trigger it. This
-- migration grants NO insert/update/delete policy to anon or authenticated on any
-- table. Every Phase 1 write is either:
--   (a) service-role, which bypasses RLS entirely — booking creation, the Paymob
--       webhook, the no-show expiry job; or
--   (b) a `security definer` function that enforces its own transition rules —
--       check-in (SECURITY.md §4).
-- The check-in function lands in its own migration with its Rule 18 declaration
-- attached. Until then there is no path by which a browser can write these tables.

alter table public.yachts          enable row level security;
alter table public.trip_instances  enable row level security;
alter table public.bookings        enable row level security;
alter table public.payments        enable row level security;
alter table public.organizer_users enable row level security;
alter table public.admin_users     enable row level security;
alter table public.audit_log       enable row level security;

-- Belt and braces (Rule 9): a hard delete must be impossible by privilege, not
-- merely absent by convention. Revoke first, then grant back only what is needed.
revoke all on public.yachts,
              public.trip_instances,
              public.bookings,
              public.payments,
              public.organizer_users,
              public.admin_users,
              public.audit_log
  from anon, authenticated;

-- ---- yachts ----------------------------------------------------------------
-- Public read: the trip listing shows yacht names (Screen 1). Writes are admin-only
-- and happen through the service role; no write policy exists here.
grant select on public.yachts to anon, authenticated;

create policy "yachts are publicly readable"
  on public.yachts for select
  to anon, authenticated
  using (true);

-- ---- trip_instances --------------------------------------------------------
-- SECURITY.md §3 — public select (Screens 1 and 2 need it), writes admin-only.
grant select on public.trip_instances to anon, authenticated;

create policy "scheduled trips are publicly readable"
  on public.trip_instances for select
  to anon, authenticated
  using (true);

-- ---- bookings --------------------------------------------------------------
-- SECURITY.md §3 — guests have NO direct table access. There is deliberately no
-- policy for anon: a guest reaches their booking only through a server action.
grant select on public.bookings to authenticated;

-- An organizer sees bookings only for trips at the yacht they are assigned to
-- (or all yachts, if unassigned).
create policy "organizers read bookings for their yacht"
  on public.bookings for select
  to authenticated
  using (
    public.organizer_covers_yacht(
      (select t.yacht_id from public.trip_instances t
        where t.id = bookings.trip_instance_id)
    )
  );

-- Admins read all bookings for the dashboard. Read only — no update/delete policy
-- exists for admins either; Phase 1 has no admin write surface at all.
create policy "admins read all bookings"
  on public.bookings for select
  to authenticated
  using (public.is_active_admin());

-- ---- payments --------------------------------------------------------------
-- SECURITY.md §3 — no client-side access at all, service role only.
-- No grant, no policy. RLS with zero policies denies everything by default.

-- ---- organizer_users / admin_users -----------------------------------------
-- A user may confirm their own role row; nothing more. This is what lets the login
-- screens decide between "proceed" and "404" (Rule 10) without exposing the roster.
grant select on public.organizer_users to authenticated;
grant select on public.admin_users     to authenticated;

create policy "organizers read their own record"
  on public.organizer_users for select
  to authenticated
  using (user_id = auth.uid());

create policy "admins read their own record"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

create policy "admins read the organizer roster"
  on public.organizer_users for select
  to authenticated
  using (public.is_active_admin());

-- ---- audit_log -------------------------------------------------------------
-- SECURITY.md §3 — insert-only from server-side actions (service role), select
-- restricted to admin. No insert policy here: the browser must not write audit rows.
grant select on public.audit_log to authenticated;

create policy "admins read the audit log"
  on public.audit_log for select
  to authenticated
  using (public.is_active_admin());
