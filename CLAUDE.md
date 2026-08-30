# CLAUDE.md — Mandatory Rules for Every Session
> Claude Code reads this file automatically at the start of every session.
> These rules are non-negotiable. Follow all of them on every task, every time.
> When in doubt between speed and following a rule — follow the rule.
>
> **CLAUDE.md governs how you work; `context.md` records what is true about the system.**
> A working rule belongs here. A fact about the schema, a decision already made, or a
> risk knowingly accepted belongs in context.md. When Rule 15 says to write something
> down, this is how you choose the file.

---

## WHO I AM AND WHAT WE ARE BUILDING

I am the CTO directing this project on behalf of a yacht operator client. I am not
writing code myself — Claude Code writes all code, I make product and business decisions.

The full project context — business model, roles, booking workflow, commission split,
database schema, and decisions already made — is in `context.md`. Read it before
starting any task if you haven't already.

**The business, in one paragraph:** the client owns 2 yachts (500-guest capacity each),
running 3 Nile dinner-cruise trips per day per yacht (6 trips/day total, 2 hours each,
with food, activities, and live entertainment). ~90% of guests are foreign tourists.
Today all bookings go through local trip offices with no online channel. We are building
a website so guests book and pay online directly, growing monthly guests from
10,000–15,000 to a 30,000–45,000 target. Guest price is $95/ticket; the client receives
$65, the platform (us) receives $30, per a partnership contract.

Tech stack: Next.js 14+ (App Router), TypeScript strict mode, Supabase (Postgres + Auth +
Row Level Security + Storage), Tailwind CSS, Paymob for payments, deployed on Vercel.

This project uses two AI tools:
- Claude.ai (Sonnet) → planning, documents, decisions
- Claude Code → all code writing and building
Never duplicate work between the two.

---

## RULE 1 — BEFORE YOU CHANGE ANYTHING, MAP THE IMPACT

Before editing any file, answer these three questions internally:

1. What other files import from the file I am about to change?
2. What other functions call the function I am about to change?
3. If I change this, what is the worst thing that could break elsewhere?

If the answer to question 3 touches booking, payment, or check-in logic — tell me before
making the change. Never make a silent cross-module change on money-adjacent or
capacity-adjacent code. Always announce it first.

---

## RULE 1B — A BUG FIX IS NOT DONE UNTIL YOU'VE TESTED THAT IT DIDN'T BREAK SOMETHING ELSE

Fixing the reported bug is only half the job. Before reporting any fix as complete:

1. **Identify what else touches the same code** — every route, hook, or table column
   that reads/writes the same thing you just changed.
2. **Actually test those things, not just the original bug.** Specifically probe the
   side effects — don't just confirm the fix works, confirm nothing around it changed
   behavior.
3. **State the test results explicitly** — "fixed X; also tested Y and Z, both
   unaffected" — not just "fixed X."
4. **Confirm RLS policies and grants survived** any function signature or return-type
   change — never assume they carried over.
5. **If testing side effects isn't possible this session, say so plainly** rather than
   reporting the fix as fully verified.

A fix that isn't tested against its own blast radius is a guess that happened to also
solve the original problem.

---

## RULE 2 — ONE THING AT A TIME

Never fix more than one bug in a single response.
Never refactor AND fix a bug in the same response.
Never add a feature AND fix a bug in the same response.

If you notice other issues while working:
- Fix the one thing I asked about
- List the other issues you noticed at the end
- Wait for me to decide what's next

---

## RULE 3 — NEVER SILENTLY REORGANIZE CODE

If fixing something requires moving code to a different file or renaming a function:
tell me first, explain exactly what's moving and why, and get confirmation before
making the change.

---

## RULE 4 — ALWAYS DELIVER COMPLETE FILES

Never deliver partial files. Never say "replace lines 45–67 with this."
Always deliver the complete file, top to bottom.

If the file is very long (500+ lines), tell me which exact functions changed and what
changed in them, then still deliver the complete file.

---

## RULE 5 — TYPESCRIPT STRICT MODE IS MANDATORY

Every file uses TypeScript. No `any`. No `// @ts-ignore`. No `as unknown as X`.

If a type error is blocking progress, tell me what the correct type should be and ask
me to confirm before defining it. Do not bypass the type system to make it compile.

---

## RULE 6 — ARCHITECTURE LAYERS MUST NEVER BE CROSSED

- Pages/routes only call hooks or server actions. Never import from `lib/services`
  directly inside a page component.
- Hooks and server actions call services. They never call Supabase directly.
- Services call Supabase only. Services never import from hooks or pages.
- Client-side state (React state/context) holds UI state only — no async logic and
  never the source of truth for booking capacity or payment status. That source of
  truth is always the database, read fresh.

If implementing a feature requires crossing these layers, tell me — don't just cross
them.

---

## RULE 7 — EVERY ERROR MUST USE THE ERROR CODE REGISTRY

All error handling uses the `AppError` registry in `lib/errors.ts`.

Never write:
```typescript
throw new Error("Something went wrong");
catch (err) { console.log(err) }
```

Always write:
```typescript
throw AppError.BOOKING.PAYMENT.CAPACITY_EXCEEDED;
catch (err) {
  console.error(`[${err.code}] ${err.file} → ${err.function}`);
  showToast(err.message);
}
```

If a new error needs to be added, add it to `lib/errors.ts` first, then use it. Never
define error messages inline in a service or route.

---

## RULE 8 — MONEY IS ALWAYS INTEGERS. NEVER FLOATS.

All prices, totals, and commission splits are stored and calculated as integers in the
smallest unit of the storage currency:
- Egyptian piasters for anything settled in EGP (1 EGP = 100 piasters).
- USD cents for the guest-facing display price ($95.00 = `9500`).

Never use `parseFloat`, `toFixed`, or decimal arithmetic on money values.

Every booking snapshots, at creation time, exactly three money fields:
`guest_price_usd_cents` (the quoted **per-guest** price — multiply by `headcount` for
the total, which is not stored separately), `charged_amount_piasters` (what the gateway
actually charged, in full), and `fx_rate_snapshot_micros` (the rate used). These are
**written once at booking time and never recalculated later** — if the FX rate changes
tomorrow, past bookings must not silently change value.

There is **no per-booking revenue split and no commission field** (amended 2026-08-30,
superseding the original `owner_share_piasters` / `platform_share_piasters`
requirement). The full guest payment settles into the client's single account; the
platform's $30 per guest is collected separately and offline by contract and never
passes through this system. Commission is a reporting calculation over `headcount`
against a constant — never a column, and never a division of a charge.

`Math.round()` once, at the point of calculation. Never round twice.

If a calculation would involve decimals and the rounding behavior isn't obvious, stop
and ask me before writing the code.

---

## RULE 9 — NEVER HARD DELETE. BOOKINGS AND PAYMENTS ARE APPEND-ONLY.

No `.delete()` on `bookings`, `payments`, `trip_instances`, or `audit_log`, ever —
not even during development, without my explicit permission.

Bookings move through a status field, never disappear:
`pending_payment → confirmed → checked_in` or `→ expired` or `→ cancelled`.

Belt and braces: the `authenticated` and `anon` roles should have no DELETE grant on
these tables at the database level — a hard delete should be impossible by privilege,
not merely by convention.

---

## RULE 10 — SECURITY RULES THAT CANNOT BE BYPASSED

**Roles (guest / organizer / admin):** always read from the authenticated Supabase
session, never from `localStorage`, route params, or query strings.

**Booking codes are not sequential and not guessable.** A booking code must never be
derivable from another booking's code, timestamp, or ID. See SECURITY.md §Booking Code
Design.

**API keys:** never hardcoded. All keys from `process.env` (server-only for secret
keys — Paymob secret key and Supabase service role key must never reach client bundles).

**RLS:** never suggest disabling Row Level Security to fix a bug. If a query is blocked
by RLS, the fix is to correct the policy — not to disable it.

**Admin and organizer routes:** return 404 for unauthorized access, not 403 — don't
reveal that a protected route exists to an unauthenticated caller.

**Input validation:** all user input (booker details, headcount, promo codes if added
later) validated server-side in `lib/validators.ts` before reaching a service. Never
trust client-side validation alone.

---

## RULE 11 — GIT COMMIT AFTER EVERY WORKING FEATURE

After a feature is tested and confirmed working, remind me to commit. Never let more
than one tested feature accumulate without a commit — this is the rollback safety net.

---

## RULE 12 — TELL ME WHAT YOU CHANGED AND WHY

At the end of every response where you changed code, include a brief summary of what
changed, in which files, and why. This is what lets a code review happen without
reading every line, and tells me exactly what to test.

---

## RULE 13 — LOCALIZATION IS NOT AN AFTERTHOUGHT

Guest-facing pages (browse, checkout, ticket) default to English, since ~90% of guests
are foreign tourists, with the price always shown in USD alongside "charged in EGP at
checkout" disclosure language near the payment button.

Organizer and admin interfaces default to whatever language the client's staff actually
use day to day — confirm this before building those screens; don't assume.

All user-facing strings live in a translation file, never hardcoded inline in a
component, even for the "default" language — retrofitting i18n later is expensive,
starting with the structure is not.

---

## RULE 14 — LOADING, EMPTY, AND ERROR STATES ARE MANDATORY

Every screen that fetches data needs three states: loading (skeleton/spinner), empty
(clear message — e.g. "No trips available for this date"), and error (using the error
code system). If I ask for "just the trip listing," that includes all three states.

**Trip capacity is a special case of "loading state":** the seat count shown to a guest
must be re-verified server-side at the moment of checkout, not trusted from a page that
may have been open for several minutes. Two guests can be looking at "12 seats left"
simultaneously.

---

## RULE 15 — RULES GET WRITTEN DOWN THE SAME SESSION THEY'RE AGREED

Whenever a new rule, workflow change, or standing decision gets agreed during a
session — the kind of thing that belongs in CLAUDE.md rather than just being mentioned
in conversation — update CLAUDE.md yourself, in the same response, rather than waiting
to be told. If it's a fact about the system rather than a rule about how to work, it
goes in context.md's decision log instead. If unsure which, ask — but default to
writing it down, since an unwritten rule is indistinguishable from no rule once the
conversation that produced it is gone.

---

## RULE 16 — NEVER WRITE FILE CONTENT THROUGH THE SHELL

Use the Write and Edit tools for file content. Do not route content through bash — not
via heredocs, not via `node -e "...fs.writeFileSync..."`, not via `sed` on prose. The
shell expands backticks and `$NAME` before your content ever reaches the file, and it
fails silently — the command reports success while a word or clause is simply gone.

Bash remains correct for what it's for: running commands, reading files, searching,
git, migrations, builds. The rule is only about writing file content.

---

## RULE 17 — WHAT A PASSING CHECK DOES NOT MEAN

When you run `npm run build`, `tsc --noEmit`, or lint and it passes green, report
exactly which checks ran — not "verified." A passing type check proves types, not
behavior. A passing build proves it compiles, not that the booking flow, payment
webhook, or check-in expiry logic behaves correctly under real conditions. Say what
you actually tested, separately from what merely didn't error.

---

## RULE 18 — A NEW WRITE SURFACE MUST DECIDE ABOUT AUTHORIZATION, IN WRITING

Any new RLS policy that can write (`insert`/`update`/`delete`, or no `for` clause), or
any `security definer` function that writes, must state in a comment directly above it
who is allowed to trigger it and why — guest, organizer, admin, or system/webhook only.
An unstated write surface is a bug waiting to be found in production, not a stylistic
gap. If you can't state why a given role may perform a write, that's the answer: guard
it, or ask me.

This matters more than usual here because the check-in flow, the no-show expiry job,
and the payment webhook are all write surfaces that must be system/admin-only and
never guest-triggerable, even indirectly.

---

## RULE 19 — MIGRATIONS GO THROUGH THE SUPABASE CLI, APPLIED FOR REAL

Use `supabase migration new <name>` to create a migration file, write it by hand,
rehearse it in a transaction (`begin; ...; rollback;`) against a dev branch first, then
apply with `supabase db push`. Migration files are the readable, committed record —
keep local files and the remote database in step at all times. Never apply a migration
only through an ad-hoc console query that isn't captured in a file.

---

## THE MOST IMPORTANT RULE

**Every session starts with reading `context.md`.**

If context.md and these rules conflict on any point, context.md wins.
If a task requires violating any rule above, stop and tell me before proceeding.

The goal: a codebase any developer can open, understand, and maintain without needing
to call me or ask Claude anything. That is the definition of success.
