-- =============================================================================
-- Atomic seat reservation + booking creation
--
-- NOT YET APPLIED. Rehearse before pushing (CLAUDE.md Rule 19):
--   begin; \i this_file.sql  rollback;
--
-- This is the function context.md §5 has been pointing at from the beginning:
-- "the authoritative check happens server-side at the moment of payment
-- confirmation, inside a transaction, comparing current seats_booked against
-- capacity before finalizing the booking. Two guests racing for the last seats
-- must not both succeed."
--
-- HOW THE RACE IS ACTUALLY PREVENTED
-- `select ... for update` takes a row lock on the trip_instance. A second
-- concurrent call blocks there until the first commits, then re-reads
-- seats_booked and sees the updated value. Without that lock, both callers would
-- read the same stale count and both would pass — which is the entire bug this
-- exists to prevent. A plain read-then-write from application code cannot do
-- this, no matter how carefully it is written.
--
-- The `trip_instance_not_oversold` CHECK constraint remains the backstop beneath
-- it: even if this logic were wrong, the database refuses to record more seats
-- than the trip has.
--
-- =============================================================================
-- CLAUDE.md RULE 18 — WRITE SURFACE DECLARATION
--
-- WHO may trigger this: the SERVICE ROLE only, called from
-- lib/actions/checkout.actions.ts on the server. Nothing else.
--
-- Explicitly NOT: guests, anonymous callers, authenticated users, organizers, or
-- admins. EXECUTE is revoked from public, anon and authenticated below and
-- granted only to service_role, so there is no path from a browser to this
-- function — direct, indirect, or via a forgotten default grant.
--
-- WHY: this function is the only thing in the system that both takes seats and
-- creates a booking. A client-reachable version would let anyone hold seats on
-- any sailing without paying, which SECURITY.md §5 identifies as a real attack
-- (seat-hoarding to make a trip appear sold out), and would let them write
-- arbitrary money values onto a booking row.
--
-- WHY SECURITY INVOKER RATHER THAN DEFINER: the revokes below are the primary
-- protection, but they are not the only thing that could go wrong. With EXECUTE
-- restricted to service_role — which already bypasses RLS — definer buys nothing
-- today. What it would change is the failure mode: if EXECUTE were ever granted
-- more widely by mistake, a definer function runs with the OWNER's privileges,
-- while an invoker function stays constrained by the caller's own rights and RLS.
-- Definer fails open, invoker fails safe. Chosen as defence in depth against a
-- future mistake, not against today's risk.
-- =============================================================================

create or replace function public.reserve_seats_and_create_booking(
  p_trip_instance_id        uuid,
  p_booking_code            text,
  p_guest_name              text,
  p_guest_email             text,
  p_guest_phone             text,
  p_nationality             char(2),
  p_headcount               integer,
  p_guest_price_usd_cents   bigint,
  p_charged_amount_piasters bigint,
  p_fx_rate_snapshot_micros bigint,
  p_analytics_consent       boolean,
  p_marketing_consent       boolean,
  p_expires_at              timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_capacity     integer;
  v_seats_booked integer;
  v_status       public.trip_instance_status;
  v_booking_id   uuid;
begin
  if p_headcount is null or p_headcount < 1 then
    raise exception 'INVALID_HEADCOUNT' using errcode = 'P0001';
  end if;

  -- The lock. Everything below is serialized against other callers for this
  -- trip, and only for this trip — bookings on other sailings are unaffected.
  select capacity, seats_booked, status
    into v_capacity, v_seats_booked, v_status
  from public.trip_instances
  where id = p_trip_instance_id
  for update;

  if not found then
    raise exception 'TRIP_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_status <> 'scheduled' then
    raise exception 'TRIP_NOT_BOOKABLE' using errcode = 'P0001';
  end if;

  -- Re-read, not re-use: this is the authoritative check, and it is reading a
  -- value that may have changed while we waited for the lock.
  if v_capacity - v_seats_booked < p_headcount then
    raise exception 'CAPACITY_EXCEEDED' using errcode = 'P0001';
  end if;

  update public.trip_instances
     set seats_booked = seats_booked + p_headcount
   where id = p_trip_instance_id;

  -- Money fields are written once here and never recalculated (Rule 8). There is
  -- no split and no commission field — the full charge settles to the client and
  -- our commission is settled offline (context.md §4).
  insert into public.bookings (
    booking_code, trip_instance_id,
    guest_name, guest_email, guest_phone, nationality, headcount,
    guest_price_usd_cents, charged_amount_piasters, fx_rate_snapshot_micros,
    status, expires_at,
    analytics_consent, marketing_consent, consent_recorded_at
  ) values (
    p_booking_code, p_trip_instance_id,
    p_guest_name, p_guest_email, p_guest_phone, p_nationality, p_headcount,
    p_guest_price_usd_cents, p_charged_amount_piasters, p_fx_rate_snapshot_micros,
    'pending_payment', p_expires_at,
    coalesce(p_analytics_consent, false), coalesce(p_marketing_consent, false), now()
  )
  returning id into v_booking_id;

  -- SECURITY.md "Cross-Reference: Audit Logging" — booking creation is a
  -- state-changing action and leaves a trail. actor is null because no human is
  -- authenticated: the guest is anonymous and the caller is the system.
  insert into public.audit_log (actor, actor_type, action, entity, entity_id, meta)
  values (
    null, 'system', 'booking.created', 'bookings', v_booking_id,
    jsonb_build_object(
      'trip_instance_id', p_trip_instance_id,
      'headcount', p_headcount,
      'charged_amount_piasters', p_charged_amount_piasters,
      'fx_rate_snapshot_micros', p_fx_rate_snapshot_micros
    )
  );

  return v_booking_id;
end;
$$;

comment on function public.reserve_seats_and_create_booking is
  'Atomically reserves seats and creates a pending_payment booking. Locks the '
  'trip_instance row FOR UPDATE so two guests racing for the last seats cannot '
  'both succeed (context.md §5). SERVICE ROLE ONLY — see Rule 18 declaration in '
  'the migration that created it.';

-- ---------------------------------------------------------------------------
-- Lock it down. Postgres grants EXECUTE on new functions to PUBLIC by default,
-- so the revoke is not optional — without it this is reachable by anon.
-- ---------------------------------------------------------------------------
revoke all on function public.reserve_seats_and_create_booking(
  uuid, text, text, text, text, char(2), integer,
  bigint, bigint, bigint, boolean, boolean, timestamptz
) from public, anon, authenticated;

grant execute on function public.reserve_seats_and_create_booking(
  uuid, text, text, text, text, char(2), integer,
  bigint, bigint, bigint, boolean, boolean, timestamptz
) to service_role;
