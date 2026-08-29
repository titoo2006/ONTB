# lib/services — the only layer that talks to Supabase

CLAUDE.md Rule 6, restated as it applies here:

- A service **calls Supabase only**.
- A service **never** imports from `hooks/`, `app/`, or `components/`. If a service
  needs something a hook has, the argument is passed in — the dependency never
  points upward.
- Nothing above this layer touches Supabase directly. Pages call hooks or server
  actions; server actions call services; services call Supabase.

Services also own the transactional guarantees, because they are the only layer that
can: the capacity check at checkout (context.md §5) happens inside a database
transaction here, never as a read-then-write from a route.
