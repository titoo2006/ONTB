# hooks — client-side state and server-action callers

CLAUDE.md Rule 6:

- Hooks call **server actions**. A hook never calls a service and never touches
  Supabase.
- React state and context here hold **UI state only**. They are never the source of
  truth for booking capacity or payment status — that is always the database, read
  fresh (Rule 14: a seat count on a page open for five minutes is stale by
  definition).

Empty until Screen 1 introduces the first client component.
