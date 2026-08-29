-- =============================================================================
-- Seed data — development only. Never run against production.
--
-- ############################################################################
-- ##  EVERY VALUE IN THIS FILE IS A PLACEHOLDER.                            ##
-- ##  Search this file for "PLACEHOLDER" to find everything needing the     ##
-- ##  client's real data before launch:                                     ##
-- ##    - the two yacht names                                               ##
-- ##    - the three daily departure times                                   ##
-- ##    - the 500-guest capacity figure                                     ##
-- ############################################################################
--
-- Idempotent: safe to re-run. It inserts nothing that already exists and never
-- deletes (CLAUDE.md Rule 9 — no hard deletes on trip_instances).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Yachts — PLACEHOLDER names, PLACEHOLDER capacity
-- -----------------------------------------------------------------------------
-- image_url is left null: no yacht photography exists yet (context.md §9), so
-- trip cards render the treated placeholder.

insert into public.yachts (name, capacity, image_url, active)
select 'Nile Empress', 500, null, true   -- PLACEHOLDER name / PLACEHOLDER capacity
where not exists (select 1 from public.yachts where name = 'Nile Empress');

insert into public.yachts (name, capacity, image_url, active)
select 'Nile Sultana', 500, null, true   -- PLACEHOLDER name / PLACEHOLDER capacity
where not exists (select 1 from public.yachts where name = 'Nile Sultana');


-- -----------------------------------------------------------------------------
-- Trip instances — 3 departures per yacht per day, 6/day across the fleet
-- -----------------------------------------------------------------------------
-- PLACEHOLDER departure times: 12:00, 17:00, 20:00. Confirm the real schedule.
--
-- Seeds today plus the next 13 days, which covers Screen 1's "today + next 6
-- days" window with room to test paging past the end of it.
--
-- context.md §5.1 — dates are generated in Africa/Cairo, never in the server's
-- local zone or UTC. `now() at time zone 'Africa/Cairo'` is the only correct
-- source of "today" anywhere in this system.
--
-- capacity is snapshotted from the yacht at creation (context.md §9), it is not
-- a live reference to yachts.capacity.

insert into public.trip_instances
  (yacht_id, trip_date, departure_time, capacity, seats_booked, status)
select
  y.id,
  d.trip_date,
  t.departure_time,
  y.capacity,
  0,
  'scheduled'
from public.yachts y
cross join generate_series(
  (now() at time zone 'Africa/Cairo')::date,
  (now() at time zone 'Africa/Cairo')::date + interval '13 days',
  interval '1 day'
) as d(trip_date)
cross join (values
  ('12:00'::time),   -- PLACEHOLDER departure time
  ('17:00'::time),   -- PLACEHOLDER departure time
  ('20:00'::time)    -- PLACEHOLDER departure time
) as t(departure_time)
where y.active
  and not exists (
    select 1 from public.trip_instances existing
    where existing.yacht_id = y.id
      and existing.trip_date = d.trip_date::date
      and existing.departure_time = t.departure_time
  );
