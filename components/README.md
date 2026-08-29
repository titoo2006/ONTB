# components

Presentational components, grouped by the surface they serve.

- `ui/` — shared primitives: Button, StatusBadge, Skeleton, Toast, Input, Select.
- `trips/` — TripCard, SeatAvailabilityIndicator, DateFilter (Screens 1–2).
- `booking/` — order summary, booker form fields, BookingCode, QR, ticket (3–5).
- `organizer/` — check-in search field, result card, success banner (7–8).
- `admin/` — stat tiles, trip table, nationality breakdown (10).
- `layout/` — header, footer, page shell.

Two standing rules:

1. **No hardcoded hex colors** (DESIGN.md §8). Use the Tailwind tokens, which point
   at the CSS variables in `app/globals.css`.
2. **No inline user-facing strings** (Rule 13). Every string comes from
   `lib/i18n/en.ts`, including in the default language.

Components never call services or Supabase — data arrives as props, or via a hook.
