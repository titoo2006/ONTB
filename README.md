# Nile Booking

Online booking platform for Nile dinner-cruise yacht trips in Egypt.

## Read these first

| File | What it governs |
|---|---|
| `CLAUDE.md` | How we work. Non-negotiable rules. |
| `context.md` | What is true about the system. Wins over CLAUDE.md on conflicts. |
| `DESIGN.md` | Visual system — colors, type, spacing, components. |
| `PRD_Phase1.md` | What Phase 1 is, screen by screen. |
| `SECURITY.md` | Security requirements, in force from the first commit. |

## Stack

Next.js 14 (App Router) · TypeScript strict · Supabase (Postgres + Auth + RLS +
Storage) · Tailwind CSS · Paymob · Vercel.

## Architecture layers (CLAUDE.md Rule 6)

```
app/          routes and pages   → call hooks or server actions only
hooks/        client state       → call server actions only
lib/actions/  server actions     → call services only
lib/services/ services           → the only layer that calls Supabase
lib/supabase/ client factories   → imported by services only
```

Dependencies point one direction. A service never imports from a hook or a page.

## Directory map

```
app/                       10 Phase 1 screens + the Paymob webhook route
components/                presentational only — no data fetching
lib/errors.ts              the error registry (Rule 7) — every thrown error
lib/validators.ts          server-side input validation (SECURITY.md §6)
lib/money.ts               integer money helpers (Rule 8) — never floats
lib/booking-code.ts        non-enumerable booking codes (SECURITY.md §2)
lib/i18n/en.ts             all user-facing strings (Rule 13)
types/database.ts          GENERATED — `npm run db:types`, never hand-edited
supabase/migrations/       the committed record of the schema (Rule 19)
supabase/functions/        cron-triggered no-show expiry job
```

## Setup

Nothing is installed yet — this is scaffold only.

```bash
npm install
cp .env.example .env.local   # then fill it in; never commit .env.local
npm run dev
```

## Database changes

Rule 19 — migrations go through the CLI and get applied for real. Prove every
change against the local stack before it reaches a real project:

```bash
# 1. Start the local stack (needs Docker Desktop running)
npx supabase start

# 2. Write the migration by hand
npx supabase migration new <name>

# 3. Rehearse it — must end in ROLLBACK with no errors
{ echo "begin;"; cat supabase/migrations/<file>.sql; echo "rollback;"; } \
  | docker exec -i supabase_db_ONTB psql -v ON_ERROR_STOP=1 -U postgres -d postgres

# 4. Apply locally for real, re-running migrations + seed from scratch
npm run db:reset

# 5. Regenerate types from the LOCAL database
npm run db:types:local

# 6. Only once it is proven locally, push to the linked cloud project
npm run db:push
npm run db:types                # regenerates from the linked project
```

`db:types` (`--linked`) targets the real cloud project; `db:types:local`
(`--local`) targets the local stack. Both overwrite `types/database.ts`, which is
generated and never hand-edited.

Local endpoints: API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`,
Inbucket (captured emails) `http://127.0.0.1:54324`. Copy the anon and service
role keys from `npx supabase status` into `.env.local`.

Never apply a schema change through an ad-hoc console query that isn't captured in
a committed migration file.
