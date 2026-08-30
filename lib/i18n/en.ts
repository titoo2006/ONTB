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

  siteHeader: {
    brand: "NileBook",
    brandTagline: "Nile Dinner Cruises",
    needHelp: "Need help?",
    /** PLACEHOLDER — replace with the client's real reservations number. */
    phone: "+20 000 000 0000",
  },

  hero: {
    eyebrow: "Cairo · Nile River · Nightly",
    titleLine1: "Dinner on the Nile,",
    /** Rendered in the accent script style — DESIGN.md §2 allows it here only. */
    titleLine2: "every evening",
    body: "Two hours aboard a 500-guest yacht, with an open buffet, live singing, and Cairo lit up on both banks.",
    primaryCta: "See tonight's sailings",
    priceFrom: "From",
    priceUnit: "per person",
  },

  trust: {
    securePayment: "Secure card payment",
    securePaymentBody: "Paid online, confirmed instantly.",
    instantTicket: "Instant e-ticket",
    instantTicketBody: "QR code to your inbox — no printing.",
    included: "Buffet and show included",
    includedBody: "One price, nothing added at the pier.",
    boarding: "Simple boarding",
    boardingBody: "Show your code, the whole group boards at once.",
  },

  tripListing: {
    pageTitle: "Choose your sailing",
    pageSubtitle:
      "Two hours on the Nile with an open buffet, live music, and entertainment.",
    dateFilterLabel: "Choose a date",
    allUpcoming: "Next 7 days",

    /** Card badges — all derived from data, never asserted about the product. */
    badgeTonight: "Tonight",
    badgeTomorrow: "Tomorrow",
    badgeFillingFast: "Filling fast",

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

  tripDetails: {
    backToListing: "All sailings",
    aboutHeading: "About this cruise",
    aboutBody:
      "Two hours on the Nile aboard a 500-guest yacht. Dinner is an open buffet, with live singing and onboard entertainment throughout the cruise.",
    includedHeading: "What's included",
    included: [
      "Two-hour Nile cruise",
      "Open buffet dinner",
      "Live singing",
      "Onboard entertainment",
    ],

    departureHeading: "Departure",
    durationLabel: "Duration",
    durationValue: "2 hours",
    yachtLabel: "Yacht",
    priceLabel: "Price",

    guestsLabel: "Guests",
    guestsHint: (max: number) => `Up to ${max} guests per booking`,
    totalLabel: "Total",
    bookNow: "Book now",
    booking: "Checking availability…",

    soldOutTitle: "This trip just sold out",
    soldOutBody:
      "Someone booked the last seats while this page was open. Nothing has been charged.",
    alternativesHeading: "Other sailings with room for your group",
    noAlternatives:
      "No other sailings have room for your group in the next few days.",

    notFoundTitle: "We couldn't find that trip",
    notFoundBody:
      "It may have already sailed, or the link may be wrong. Here's everything coming up.",

    errorTitle: "We couldn't load this trip",
    errorBody:
      "Something went wrong at our end. Your booking hasn't been affected.",
  },

  checkout: {
    // DESIGN.md §8 / Rule 13 — this disclosure must be legible next to the price,
    // never buried in fine print at a smaller size.
    egpDisclosure: "Charged in EGP at checkout",
  },

  ticket: {},
  organizer: {},
  admin: {},

  consent: {
    title: "Your privacy choices",
    body: "We use cookies to run this site. We'd also like to measure how it's used, and to measure our advertising — but only if you agree. You can change this at any time.",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    customise: "Choose what to allow",
    save: "Save choices",
    cancel: "Back",

    necessaryTitle: "Strictly necessary",
    necessaryBody:
      "Needed for booking and payment to work. These can't be switched off.",
    necessaryAlways: "Always on",

    analyticsTitle: "Analytics",
    analyticsBody:
      "Helps us see which trips people look at and where the booking process is confusing.",

    marketingTitle: "Advertising",
    marketingBody:
      "Lets us measure our ads. If you accept, we share a scrambled version of your email and phone with Meta so they can match your booking to an ad.",

    manageLink: "Privacy choices",
    updated: "Your privacy choices have been saved.",
  },

  footer: {
    tagline: "Nile dinner cruises, booked online.",
    contact: "Contact",
    legal: "Legal",
    terms: "Terms and conditions",
    privacy: "Privacy policy",
    rights: "All rights reserved.",
    /** Rule 13 / DESIGN.md §8 — the EGP disclosure follows the price everywhere. */
    priceNote: "All prices in USD. Charged in EGP at checkout.",
  },
} as const;

export type Translations = typeof en;
