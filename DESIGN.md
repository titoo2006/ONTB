# DESIGN.md — Nile Booking Design System

> Proposed starting system, not final brand assets. If the client has an existing
> logo, brand colors, or yacht photography, replace §1 and §6 with those before
> Phase 1 ships — everything else in this file (spacing, components, states) holds
> regardless of final brand colors.

---

## 1. COLOR PALETTE

Theme direction: premium evening Nile cruise — deep blue (water/night), warm gold
(luxury, lighting), warm neutral backgrounds (not stark white — feels closer to the
hospitality/tourism category than a SaaS dashboard).

### Primary Colors
- `--color-primary` `#0B3B5C` — deep Nile blue. Primary buttons, headers, nav.
- `--color-primary-light` `#155E8A` — hover/active states of primary.
- `--color-accent` `#C89B3C` — warm gold. Price highlights, CTAs, badges — used
  sparingly, as an accent, never as a large fill.

### Background Colors
- `--color-bg` `#FAF7F1` — warm off-white, page background.
- `--color-surface` `#FFFFFF` — cards, modals.
- `--color-surface-alt` `#F1ECE0` — secondary surface (e.g. selected trip card).

### Text Colors
- `--color-text-primary` `#1A2B33`
- `--color-text-secondary` `#5B6B72`
- `--color-text-muted` `#8B979C`
- `--color-text-on-primary` `#FFFFFF` — text on the deep-blue primary color.
- `--color-text-on-accent` `#1A2B33` — text on the gold accent (dark text, not white —
  gold is too light for white text to pass contrast).

### Status Colors
- `--color-success` `#1E7A4C` — confirmed / checked-in.
- `--color-warning` `#B8792A` — pending payment / near-expiry.
- `--color-danger` `#B23A3A` — expired / cancelled / payment failed.
- Backgrounds for status badges use a ~10% tint of the same color, never the full
  saturated color as a fill behind text.

### Border & Divider
- `--color-border` `#E4DDCC`
- `--color-border-strong` `#C9BFA5`

---

## 2. TYPOGRAPHY

### Font Family
- UI/body: a clean geometric sans (e.g. Inter or similar) for legibility across 9+
  nationalities and varying device quality.
- No decorative/script font for body text — reserve any script/serif accent font for
  the marketing hero headline only, never for prices, booking codes, or form labels.

### Font Sizes
- `--text-xs` 12px — fine print, timestamps
- `--text-sm` 14px — secondary text, labels
- `--text-base` 16px — body
- `--text-lg` 18px — section subheads
- `--text-xl` 22px — card titles, prices
- `--text-2xl` 28px — page titles
- `--text-3xl` 36px — hero headline (marketing pages only)

### Font Weights
Two weights only: 400 (regular) and 600 (semibold). Never use a third weight — it adds
inconsistency without adding clarity.

### Booking codes and prices
Booking codes render in a monospace or tabular-figure font at minimum 18px — the
organizer reads these quickly, often in bright sunlight, on a small phone screen.
Never let a booking code wrap across two lines.

---

## 3. SPACING SYSTEM

4px base unit: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px,
`--space-6` 24px, `--space-8` 32px, `--space-12` 48px.

### Screen Padding
- Mobile: 16px horizontal
- Desktop: 24px horizontal, content max-width 1200px, centered

---

## 4. BORDER RADIUS
- `--radius-sm` 6px — inputs, small buttons
- `--radius-md` 10px — cards
- `--radius-lg` 16px — modals, hero image containers
- `--radius-full` — pills/badges only

---

## 5. COMPONENTS

### 5.1 Buttons
- Primary: `--color-primary` fill, white text, `--radius-sm`, 44px min height (touch
  target — many guests will book from mobile).
- Accent/CTA (e.g. "Book now", "Pay $95"): gold fill, dark text, used once per screen
  max — it loses meaning if every button is gold.
- Disabled state: 40% opacity, no hover effect, cursor not-allowed.

### 5.2 Trip Card
- Yacht name, date/time, price, remaining-seats indicator (see 5.4), a short
  activities list, primary CTA. Image (or illustration if no photography yet)
  top of card, `--radius-md` corners.

### 5.3 Status Badges
Booking status renders as a colored pill using the tint backgrounds from §1:
`confirmed` → success tint, `pending_payment` → warning tint, `checked_in` → success
tint with a checkmark icon, `expired`/`cancelled` → danger tint.

### 5.4 Seat Availability Indicator
- \>20% capacity remaining: no urgency styling, plain text ("312 seats left").
- 5–20% remaining: warning-tinted text ("Only 38 seats left").
- <5% remaining: danger-tinted, bold ("Almost full — 9 seats left").
- Never show exact remaining seats below a floor of ~3 to avoid implying false
  precision when concurrent bookings are in flight — show "Almost full" instead once
  below that floor.

### 5.5 Empty States
Plain-language, no jargon: "No trips scheduled for this date — try another date" with
a date-picker shortcut, not a bare "No results."

### 5.6 Loading States
Skeleton screens for trip listings and the dashboard (not spinners) — content shape
should be visible while loading so the layout doesn't jump.

### 5.7 Toast Notifications
Used for booking confirmation, payment errors, and check-in confirmations on the
organizer screen. Auto-dismiss after 4s except errors, which require manual dismiss.

---

## 6. ORGANIZER CHECK-IN SCREEN — SPECIFIC RULES

This screen is used outdoors, quickly, often one-handed, by non-technical staff.
Design constraints specific to it, overriding general rules where they conflict:

- Minimum tap target 48px (larger than the 44px general minimum).
- High contrast only — no subtle gray-on-gray text; assume bright sunlight glare.
- Search input auto-focused on page load, large (24px) text.
- One primary action visible at a time: "Check in" — no secondary actions competing
  for attention on the result card.
- Confirmation of a check-in is immediate and unmistakable: full-width success-tinted
  banner with the headcount confirmed, not just a small badge change.

---

## 7. ACCESSIBILITY
- Minimum contrast ratio 4.5:1 for body text, 3:1 for large text (18px+) — verify the
  gold accent (§1) against both white and dark-blue backgrounds specifically, since
  gold-on-light often fails contrast at smaller sizes.
- All interactive elements reachable and operable by keyboard.
- Form errors announced via `aria-live`, not color alone.

---

## 8. WHAT MUST NEVER HAPPEN
- Never use the danger color for anything except error/expired/cancelled states —
  don't reuse red for decorative emphasis.
- Never let a card's price and currency disclosure ("charged in EGP") be different
  font sizes that make the disclosure easy to miss — it must be legible, not
  buried in fine print, per CLAUDE.md Rule 13.
- Never hardcode a hex color inline in a component — always reference the CSS
  variables/Tailwind tokens defined here.

---

## 9. HOMEPAGE COMPOSITION (added 2026-08-30)

The trip listing is the homepage, and it is the first thing a tourist ever sees.
A bare grid of cards under a heading is not enough to sell a $95 evening. The
homepage is composed as: **hero → trust strip → dated sailing grid**.

### 9.1 Photography is the load-bearing element
This layout is designed around imagery. Every image slot is optional in code and
falls back to a treated gradient, but the fallback is a holding position, not the
design — judge the page only once real photography is in.

- Hero image: `NEXT_PUBLIC_HERO_IMAGE_URL`, else the treatment.
- Card image: `yachts.image_url` per yacht, else the treatment.
- See `public/images/README.md` for sizes, licensing, and the remote-host caveat.
- **Never show photography of yachts that are not the client's two boats.** A
  guest who books what they saw and boards something else is a refund argument,
  and there is no cancellation policy to fall back on (context.md §8).

### 9.2 Scrims are a contrast requirement, not decoration
White text over an arbitrary photograph cannot be assumed to clear the 4.5:1 in
§7. Every text-over-image surface carries a scrim gradient
(`--color-scrim-strong` → `--color-scrim-none`) so contrast holds regardless of
which image is dropped in later. Never place text directly on an image without
one. `--color-deep` sits behind imagery so white text still clears contrast even
if an image fails to load entirely.

### 9.3 Badges must be derived from data, never asserted
Reference designs in this category lean on "Bestseller", "Popular", "Trending".
We do not use those. We have no sales ranking, and manufactured urgency a guest
cannot verify is a trust problem. Permitted badges are computed from rows we
hold: `Tonight`, `Tomorrow`, `Filling fast`, `Sold out`. `Filling fast` uses the
same 20% threshold as the §5.4 warning band so the badge and the seat line can
never contradict each other.

### 9.4 Claims in the trust strip must be things we actually do
Only capabilities Phase 1 genuinely ships: card payment, emailed QR ticket,
all-inclusive price, single-code group boarding. Explicitly not: refunds or free
cancellation (no policy exists — context.md §8), price matching, or 24/7 support
(there is no staffed line to promise).

### 9.6 See §10 for elevation and motion
Cards, buttons, and filter pills all draw their shadows and transitions from the
single system in §10. Do not introduce a one-off shadow or duration on a screen.

### 9.5 Gold is for the price
§1 reserves the accent for prices, CTAs, and badges. On a card, the price is the
one number a browsing guest is hunting for — it renders in `--color-accent` over
the image scrim. Do not spend gold on anything else on the card.

---

## 10. ELEVATION & MOTION (added 2026-08-30)

Three shadows and one easing curve for the entire site. A screen that needs a
fourth shadow or a different curve is a special case to be argued for, not
invented inline — the point of a small set is that the site feels like one
product rather than a collection of separately-styled pages.

### 10.1 Elevation
| Token | Use |
|---|---|
| `shadow-card` | Resting state of cards, active filter pills, primary CTAs |
| `shadow-card-hover` | Hover state of an interactive card or CTA |
| `shadow-overlay` | Modals and popovers only |

Shadows are tinted with `--color-deep`, never neutral black. A black shadow on
the warm `--color-bg` reads as grey dirt rather than depth. They are deliberately
shallow: this is a booking page, not a stack of floating panels.

### 10.2 Motion
| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Colour, border, and shadow changes |
| `duration-base` | 200ms | Card lift, composite hover states |
| `duration-slow` | 400ms | Image zoom inside a card |
| `ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Everything |

`globals.css` gives every `a`, `button`, `[role="button"]`, and `summary` these
transitions automatically, so no component has to remember to add them.

### 10.3 Hover and press conventions
- **Cards** lift by 2px (`hover:-translate-y-0.5`), deepen their shadow, and
  strengthen their border. 2px reads as responsive; more makes a grid bounce.
- **Images inside cards** scale to 1.03 — perceptible, not a zoom effect.
- **Buttons** change colour and take `active:translate-y-px`, so a press feels
  mechanical. Important on mobile, where there is no hover to confirm a tap.
- **Only animate cheap properties**: colour, background, border, shadow,
  opacity, transform. Never width, height, top, or left — they force layout on
  every frame and stutter on the mid-range phones many guests will be using.

### 10.4 Focus is part of this system, not an afterthought
`globals.css` puts a 2px `--color-accent` `:focus-visible` outline on every
interactive element site-wide. This is a §7 requirement, and doing it centrally
means no component can ship without one. Never remove an outline without
replacing it with something equally visible.

### 10.5 Reduced motion is honoured globally
`@media (prefers-reduced-motion: reduce)` collapses every animation and
transition to ~0ms, including the loading skeleton's pulse. State changes still
happen — only the animation is removed, so nothing becomes invisible. Hover lifts
and image zooms are decorative, and are not worth a vestibular headache for a
guest who has asked their OS for less movement.
