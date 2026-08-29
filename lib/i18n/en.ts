/**
 * CLAUDE.md Rule 13 — all user-facing strings live here, never inline in a
 * component, even for the default language. Retrofitting i18n later is expensive;
 * starting with the structure is not.
 *
 * Guest-facing pages default to English (~90% of guests are foreign tourists).
 * Organizer/admin UI language is an OPEN QUESTION (context.md §8) — confirm with the
 * client before building those screens; do not assume English or Arabic.
 */

export const en = {
  common: {
    retry: "Try again",
    perPerson: "per person",
  },

  tripListing: {
    pageTitle: "Nile dinner cruises",
    pageSubtitle:
      "Two hours on the Nile with an open buffet, live music, and entertainment.",
    dateFilterLabel: "Choose a date",
    allUpcoming: "Next 7 days",

    /**
     * context.md §9 — the activities line is static copy for Phase 1, not a
     * database column. All 6 daily trips are the same product. If the client ever
     * differentiates the two yachts, this is promoted to yachts.activities_summary.
     */
    activitiesSummary: "Open buffet · Live singing · Onboard entertainment",
    durationSummary: "2 hours",

    seatsLeft: (count: number) => `${count} seats left`,
    onlySeatsLeft: (count: number) => `Only ${count} seats left`,
    almostFullWithCount: (count: number) => `Almost full — ${count} seats left`,
    /**
     * DESIGN.md §5.4 — below the precision floor we stop quoting a number at all,
     * rather than implying precision we don't have while bookings are in flight.
     */
    almostFull: "Almost full",
    soldOut: "Sold out",

    viewTrip: "View trip",

    emptyTitle: "No trips scheduled for this date",
    emptyBody: "Try another date — cruises run every day.",
    emptyNextAvailable: (dateLabel: string) => `Next available: ${dateLabel}`,
    emptyShowAll: "Show the next 7 days",

    errorTitle: "We couldn't load the trips",
    errorBody:
      "Something went wrong at our end. Your booking hasn't been affected.",
  },

  tripDetails: {},

  checkout: {
    // DESIGN.md §8 / Rule 13 — this disclosure must be legible next to the price,
    // never buried in fine print at a smaller size.
    egpDisclosure: "Charged in EGP at checkout",
  },

  ticket: {},
  organizer: {},
  admin: {},
} as const;

export type Translations = typeof en;
