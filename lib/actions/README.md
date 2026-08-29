# lib/actions — server actions

The layer between routes and services (CLAUDE.md Rule 6). A server action:

- is called by a page/route or a hook — never by another service
- calls services; **never** touches Supabase directly
- is the place where the caller's role is established, read from the authenticated
  Supabase session and nowhere else — never from `localStorage`, a route param, or a
  query string (Rule 10)
- validates its input through `lib/validators.ts` before calling a service
  (SECURITY.md §6), regardless of any client-side validation that already ran

Every file here starts with `"use server"`.
