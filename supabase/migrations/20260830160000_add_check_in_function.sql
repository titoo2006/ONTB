-- =============================================================================
-- Organizer check-in
--
-- NOT YET APPLIED. Rehearse before pushing (CLAUDE.md Rule 19):
--   begin; \i this_file.sql  rollback;
--
-- SECURITY.md §4 (P0) requires check-in to happen ONLY through a function that
-- validates: the booking exists, its trip is not already expired, it is not
-- already checked in, and the caller is an active organizer for that yacht.
-- Direct table UPDATE from a client is impossible under RLS — there is no
-- update policy on bookings for anyone, and this function is the only door.
--
-- context.md §6 — check-in covers the WHOLE booking, not per seat. A ten-guest
-- booking checks in as one action. The headcount is returned so the screen can
-- show it and the organizer can eyeball the group size.
--
-- =============================================================================
-- CLAUDE.md RULE 18 — WRITE SURFACE DECLARATION
--
-- WHO may trigger this: an AUTHENTICATED, ACTIVE ORGANIZER assigned to the
-- booking's yacht — or any yacht, if their assigned_yacht_id is null
-- (context.md §7). Enforced inside the function via organizer_covers_yacht(),
-- which reads the caller's own auth.uid(), so an organizer cannot check in a
-- booking for a boat they do not work on.
--
-- Explicitly NOT: guests, anonymous callers, or authenticated users who are not
-- in organizer_users. Admins are also excluded — Phase 1 has no admin override
-- (PRD_Phase1.md Screen 7: the organizer escalates manually), and quietly
-- allowing one here would create an undocumented capability.
--
-- WHY SECURITY DEFINER HERE, unlike reserve_seats_and_create_booking:
-- this one MUST be callable by the `authenticated` role, and that role has no
-- UPDATE grant on bookings and no update policy — by design (Rule 9, SECURITY.md
-- §3). The whole point is to let an organizer perform one narrow, validated state
-- transition they cannot otherwise perform. That is the textbook case for
-- definer. The reservation function had no such need: only the service role
-- called it, and service role already bypasses RLS, so invoker was strictly
-- safer there. Same rule, opposite answer, because the callers differ.
--
-- The authorisation check is INSIDE the function precisely because definer means
-- it runs with the owner's privileges: the grant lets an organizer call it, and
-- the body decides whether they may act.
-- =============================================================================

create or replace function public.check_in_booking(p_booking_code text)
returns table (
  booking_id      uuid,
  booking_code    text,
  guest_name      text,
  headcount       integer,
  checked_in_at   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id   uuid;
  v_status       public.booking_status;
  v_yacht_id     uuid;
  v_headcount    integer;
  v_guest_name   text;
  v_checked_at   timestamptz;
begin
  -- Lock the booking so two organizers scanning the same code at the same time
  -- cannot both record a check-in.
  select b.id, b.status, b.headcount, b.guest_name, t.yacht_id
    into v_booking_id, v_status, v_headcount, v_guest_name, v_yacht_id
  from public.bookings b
  join public.trip_instances t on t.id = b.trip_instance_id
  where b.booking_code = p_booking_code
  for update of b;

  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Authorisation before anything else is revealed or changed.
  if not public.organizer_covers_yacht(v_yacht_id) then
    raise exception 'NOT_AUTHORIZED' using errcode = 'P0001';
  end if;

  if v_status = 'checked_in' then
    raise exception 'ALREADY_CHECKED_IN' using errcode = 'P0001';
  end if;

  -- An expired or cancelled booking cannot board. PRD_Phase1.md Screen 7: the
  -- organizer escalates manually; there is no override in Phase 1.
  if v_status in ('expired', 'cancelled') then
    raise exception 'NOT_CHECKINABLE' using errcode = 'P0001';
  end if;

  -- Only a paid booking boards. pending_payment means the guest never completed
  -- payment, and letting one board would give away a seat.
  if v_status <> 'confirmed' then
    raise exception 'NOT_CONFIRMED' using errcode = 'P0001';
  end if;

  update public.bookings
     set status = 'checked_in',
         checked_in_at = now()
   where id = v_booking_id
  returning bookings.checked_in_at into v_checked_at;

  -- SECURITY.md audit cross-reference. actor is the organizer's auth id — this
  -- is what makes a disputed "I checked them in" investigable rather than
  -- argued from memory.
  insert into public.audit_log (actor, actor_type, action, entity, entity_id, meta)
  values (
    auth.uid(), 'organizer', 'booking.checked_in', 'bookings', v_booking_id,
    jsonb_build_object('headcount', v_headcount, 'yacht_id', v_yacht_id)
  );

  return query
    select v_booking_id, p_booking_code, v_guest_name, v_headcount, v_checked_at;
end;
$$;

comment on function public.check_in_booking is
  'Checks in an entire booking. Validates that the caller is an active organizer '
  'for the booking''s yacht and that the booking is confirmed and not already '
  'checked in. The only path by which a booking may become checked_in — see the '
  'Rule 18 declaration in the migration that created it.';

-- ---------------------------------------------------------------------------
-- Postgres grants EXECUTE to PUBLIC by default. Revoke, then grant only to the
-- roles that should be able to call it. anon must never reach this: check-in is
-- an authenticated action (SECURITY.md §2 — the search is not a public lookup).
-- ---------------------------------------------------------------------------
revoke all on function public.check_in_booking(text) from public, anon;
grant execute on function public.check_in_booking(text) to authenticated, service_role;
