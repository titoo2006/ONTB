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
    /** The client's own trading brand, not a working title (context.md §9). */
    brand: "Nile Booking",
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
    ctaPrimary: "View trips",
    ctaSecondary: "Book tonight",
    priceFrom: "From",
    priceUnit: "per person",
  },

  heroSearch: {
    dateLabel: "Date",
    anyDate: "Any date",
    guestsLabel: "Guests",
    guestsOption: (n: number) => `${n} ${n === 1 ? "guest" : "guests"}`,
    searchButton: "Search",
    searching: "Searching…",
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
    /** With a party-size filter on, say WHY it's empty — "no sailings" and "none
     *  big enough for 12" are different problems with different next steps. */
    emptyTitleForParty: (guests: number) =>
      `No sailings with room for ${guests} ${guests === 1 ? "guest" : "guests"}`,
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

    pageTitle: "Complete your booking",
    summaryHeading: "Your booking",
    yachtLabel: "Yacht",
    dateLabel: "Date",
    departureLabel: "Departure",
    durationLabel: "Duration",
    guestsLabel: "Guests",
    perGuestLabel: "Price per guest",
    totalLabel: "Total",

    detailsHeading: "Your details",
    detailsBody:
      "We'll send your ticket to this email address. Please double-check it.",
    nameLabel: "Full name",
    namePlaceholder: "As you'd like it on the ticket",
    emailLabel: "Email address",
    phoneLabel: "Phone number",
    phoneHint: "In case we need to reach you about your sailing.",
    nationalityLabel: "Nationality",
    nationalityPlaceholder: "Select your nationality",

    payButton: (total: string) => `Pay ${total}`,
    paying: "Taking you to payment…",

    /**
     * context.md §9 — the no-refund rule must be stated clearly BEFORE payment,
     * not only afterwards on the ticket. This sits directly above the pay button.
     */
    policyHeading: "Before you pay",
    policyNoRefund:
      "If you don't check in within 30 minutes of departure, your booking expires and no refund is given.",
    policyTerms: "By paying you accept our terms and conditions.",
    policyTermsLink: "Read the terms",

    soldOutTitle: "Sorry, this trip just sold out",
    soldOutBody:
      "The last seats went while you were filling this in. Nothing has been charged.",
    backToTrip: "Choose another sailing",

    invalidTitle: "We couldn't start that booking",
    invalidBody:
      "The link may be incomplete or out of date. Please pick your sailing again.",

    errorTitle: "Something went wrong",
    errorBody: "Nothing has been charged. Please try again.",
  },

  payment: {
    confirmingTitle: "Confirming your payment…",
    confirmingBody:
      "This usually takes a few seconds. Please don't close this page.",

    failedTitle: "Your payment didn't go through",
    failedBody: "You have not been charged. You can try booking again.",
    failedCta: "Back to sailings",

    /**
     * PRD_Phase1.md Screen 4 — a timeout is NOT a failure and must not read like
     * one. The webhook may simply be slow; the booking may well confirm a moment
     * later, and telling the guest it failed would be wrong.
     */
    timeoutTitle: "Still confirming your booking",
    timeoutBody:
      "Your payment is being processed. We'll email your ticket as soon as it's confirmed — there's no need to pay again.",
    timeoutCta: "Check your email",

    expiredTitle: "This booking expired before payment",
    expiredBody:
      "The seats were released. You have not been charged — please book again.",
  },

  ticket: {
    pageTitle: "Your ticket",
    bookingCodeLabel: "Booking code",
    qrAlt: "QR code containing your booking code",
    yachtLabel: "Yacht",
    dateLabel: "Date",
    departureLabel: "Departure",
    cairoTimeLabel: "Departure (Cairo time)",
    cairoTimeNote: "local time in Egypt",
    guestsLabel: "Guests",
    totalLabel: "Total paid",
    statusLabel: "Status",

    showAtBoarding:
      "Show this booking code or QR code at the yacht boarding point. One code covers everyone in your booking.",
    arriveEarly: "Please arrive in good time before departure.",

    /** context.md §9 — stated on the ticket as well as before payment. */
    noRefundNotice:
      "If you don't check in within 30 minutes of departure, your booking expires and no refund is given.",

    printLabel: "Print this ticket",

    // Second-factor gate — SECURITY.md §2
    gateTitle: "View your ticket",
    gateBody:
      "For your privacy, please enter the email address you used when booking.",
    gateEmailLabel: "Email address",
    gateSubmit: "View ticket",
    gateChecking: "Checking…",
    gateDenied:
      "We couldn't find a booking matching those details. Please check the booking code and email address.",

    // Email
    emailSubject: "Your Nile dinner cruise ticket",
    emailGreeting: (name: string) => `Hello ${name},`,
    emailIntro:
      "Your booking is confirmed. Here is your ticket — you'll need the booking code below at the boarding point.",
    viewTicketLabel: "View your ticket online",
  },

  /**
   * Organizer screens — English, confirmed 2026-08-30 with the client: their
   * boarding staff work in English day to day (CLAUDE.md Rule 13 required this
   * be confirmed rather than assumed). LTR only; no RTL support is built.
   */
  organizer: {
    signInTitle: "Organizer sign in",
    signInBody: "Sign in to check guests in at the boarding point.",
    emailLabel: "Email",
    passwordLabel: "Password",
    signInButton: "Sign in",
    signingIn: "Signing in…",
    signInError: "Those sign-in details didn't work. Please try again.",
    signOut: "Sign out",

    searchTitle: "Check in",
    searchLabel: "Booking code",
    searchPlaceholder: "e.g. 7GZX594C",
    searchButton: "Find booking",
    searching: "Searching…",

    todayHeading: "Today's sailings",
    todayEmpty: "No sailings scheduled today.",
    expectedLabel: "Expected",
    checkedInLabel: "Checked in",

    notFoundTitle: "Booking code not found",
    notFoundBody: "Double-check the code and try again.",

    guestLabel: "Guest",
    guestsLabel: "Guests",
    yachtLabel: "Yacht",
    departureLabel: "Departure",
    statusLabel: "Status",

    checkInButton: (count: number) =>
      `Check in ${count} ${count === 1 ? "guest" : "guests"}`,
    checkingIn: "Checking in…",

    successTitle: "Checked in",
    successBody: (count: number, name: string) =>
      `${count} ${count === 1 ? "guest" : "guests"} — ${name}`,
    nextBooking: "Next booking",

    alreadyTitle: "Already checked in",
    alreadyBody: (when: string) => `Checked in at ${when}.`,

    expiredTitle: "Cannot check in",
    expiredBody:
      "This booking has expired or been cancelled. Contact the office — there is no override on this screen.",
    unpaidBody:
      "This booking was never paid for, so it cannot board. Contact the office.",

    errorTitle: "Something went wrong",
    errorBody: "Please try again.",
    retry: "Try again",
  },
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
