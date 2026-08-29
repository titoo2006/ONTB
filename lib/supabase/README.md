# lib/supabase — client factories (infrastructure only)

Per CLAUDE.md Rule 6, **only `lib/services/*` imports from this folder.** Pages,
hooks, server actions, and components must never construct a Supabase client.

Three clients, three different privilege levels — picking the wrong one is a
security bug, not a style issue:

| File | Key used | Runs where | Bypasses RLS? |
|---|---|---|---|
| `browser.ts` | anon / public | Browser | No |
| `server.ts` | anon / public, with the user's session cookie | Server | No — acts as the signed-in user |
| `service-role.ts` | **service role** | Server only, never imported into a client component | **Yes** |

`service-role.ts` bypasses Row Level Security entirely. It is the correct client for
booking creation, the Paymob webhook, and the expiry job (SECURITY.md §3 — guests
have no direct table access). It is never the correct client for reading data on
behalf of a signed-in organizer or admin: those go through `server.ts` so RLS still
applies.
