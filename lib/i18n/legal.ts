/**
 * Terms and Privacy copy.
 *
 * Kept in the translation layer per Rule 13, in its own module so en.ts stays
 * navigable. Same structure as any other locale file — if these are ever
 * translated, the shape is already right.
 *
 * ⚠️ THESE ARE DRAFTS FOR REVIEW, NOT LEGAL COPY. They are written to be
 * accurate about what the system actually does, which is the part an engineer
 * can get right. They have not been reviewed by a lawyer and must be before
 * launch.
 *
 * Every `reviewFlag` below marks something I could not determine from
 * context.md, PRD_Phase1.md, or SECURITY.md and have deliberately NOT invented.
 * They render visibly on the page so a reviewer cannot miss them, and the
 * DraftNotice plus every flag must be removed before these pages go live.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  /** Renders as a visible reviewer callout. Must be empty before launch. */
  reviewFlag?: string;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

export const legalDraftNotice = {
  label: "Draft",
  body: "This is an internal draft for review, not final legal copy. Highlighted notes mark points that still need a decision or a lawyer's input. Remove this notice and all notes before publishing.",
};

/** Placeholder used wherever the operating entity's details are still unknown. */
const ENTITY = "[LEGAL ENTITY NAME]";

export const termsDraft: LegalDocument = {
  title: "Terms and conditions",
  lastUpdated: "Draft — 30 August 2026",
  intro: `These terms apply when you book a Nile dinner cruise through this website, operated by ${ENTITY}. Please read the sections on boarding and on no-shows carefully, because they affect whether you get your money back.`,
  sections: [
    {
      heading: "1. Who you are contracting with",
      paragraphs: [
        `Bookings made on this website are with ${ENTITY}, registered in Egypt. The cruise itself is operated by the yacht owner.`,
      ],
      reviewFlag:
        "Unknown: the registered legal entity, its address, company number, and whether the contracting party is the platform or the yacht owner. This matters — it decides who the guest sues, and who owes the refund. Not inventable.",
    },
    {
      heading: "2. What you are booking",
      paragraphs: [
        "A two-hour dinner cruise on the Nile aboard a yacht with a capacity of up to 500 guests.",
        "Your ticket includes the cruise itself, an open buffet, live singing, and onboard entertainment.",
        "Sailing dates and departure times are shown at the time of booking. All times are local Egyptian time (Africa/Cairo), not the time zone of the device you are booking from.",
      ],
    },
    {
      heading: "3. Price and payment",
      paragraphs: [
        "The price is US$95 per person. This is the full price of the ticket, and covers everything described in section 2.",
        "Prices are shown in US dollars, but your card is charged in Egyptian pounds (EGP). The EGP amount is calculated at the exchange rate applying when you pay, and is shown to you before you confirm payment.",
        "Because your card is charged in EGP, the exact amount in your own currency depends on your card issuer's exchange rate and any fees they add. We do not control those.",
        "Payments are processed by Paymob. We do not receive or store your card details.",
      ],
    },
    {
      heading: "4. Your booking confirmation and ticket",
      paragraphs: [
        "Your booking is confirmed only once payment has been successfully completed and confirmed by the payment provider. Reaching the end of the checkout process is not by itself a confirmed booking.",
        "Once confirmed, you receive a booking code and a QR code by email. One booking code covers everyone in your booking.",
        "You must present your booking code or QR code at the boarding point.",
      ],
    },
    {
      heading: "5. Boarding, and what happens if you do not arrive",
      paragraphs: [
        "Please arrive at the boarding point in good time before your scheduled departure.",
        "If you have not checked in within 30 minutes after your scheduled departure time, your booking is marked as expired and you will not be able to board.",
        "No refund is given in that case. If you do not arrive, or arrive too late to board, you lose the full amount you paid.",
        "This applies however many guests are on the booking. If some of your party arrive and others do not, the booking is checked in as a whole and no partial refund is given for those who did not travel.",
      ],
    },
    {
      heading: "6. Changing or cancelling your booking",
      paragraphs: [
        "We have not yet set a policy for cancelling or changing a booking before departure. Nothing in these terms should be read as giving you a right to cancel, or as refusing one.",
        `If you need to change or cancel a booking, please contact ${ENTITY} directly and we will deal with your request individually.`,
        "This section will be replaced once a cancellation policy is agreed.",
      ],
      reviewFlag:
        "Deliberately open. context.md §8 lists cancellation-before-departure as an undecided policy, so this section states plainly that no policy exists rather than inventing one. Terms that accidentally grant or deny a cancellation right would create a policy by default — exactly what you asked me to avoid. This must be replaced, not shipped as-is.",
    },
    {
      heading: "7. If a sailing does not go ahead",
      paragraphs: [
        "A sailing may occasionally be cancelled or rescheduled for reasons including weather, river conditions, or operational or safety requirements.",
      ],
      reviewFlag:
        "Incomplete, and I have not guessed the rest. What happens when the OPERATOR cancels — full refund, transfer to another sailing, or credit — is not decided anywhere in context.md. This is different from the no-show rule and cannot inherit it: a guest who turns up to a cancelled cruise plainly has not no-showed. Needs a decision.",
    },
    {
      heading: "8. Behaviour on board and safety",
      paragraphs: [
        "You must follow the crew's instructions at all times while boarding and on board.",
        "The operator may refuse boarding, or require a guest to leave, where that is necessary for the safety of guests or crew.",
      ],
      reviewFlag:
        "Minimal on purpose. Whether refused boarding for conduct carries a refund, what the alcohol policy is, whether there are age restrictions, and whether children are priced differently are all unknown. The PRD collects headcount only, with no child pricing — worth confirming that is intended.",
    },
    {
      heading: "9. Your personal information",
      paragraphs: [
        "We collect and use your personal information as described in our privacy policy.",
      ],
    },
    {
      heading: "10. Governing law",
      paragraphs: ["These terms are governed by the laws of Egypt."],
      reviewFlag:
        "Assumed, not verified. Roughly 90% of guests are foreign tourists, and consumer-protection rules in a guest's home country can override a choice-of-law clause — particularly for EU consumers. A lawyer needs to confirm this clause is both correct and enforceable.",
    },
    {
      heading: "11. Contact",
      paragraphs: [`You can contact ${ENTITY} at [CONTACT EMAIL], [PHONE].`],
      reviewFlag: "Unknown: the real support email address and phone number.",
    },
  ],
};

export const privacyDraft: LegalDocument = {
  title: "Privacy policy",
  lastUpdated: "Draft — 30 August 2026",
  intro: `This policy explains what we do with your personal information when you book a Nile dinner cruise through this website. The data controller is ${ENTITY}.`,
  sections: [
    {
      heading: "1. What we collect",
      paragraphs: [
        "When you book, we collect your name, email address, phone number, nationality, and the number of guests in your booking.",
        "We collect nationality because the operator reports on where guests travel from. We do not collect passport or identity document details.",
        "We do not receive or store your card details. Payment is handled by Paymob, who process the card data themselves.",
        "If you accept analytics or advertising cookies, we also collect information about how you use the site — see sections 4 and 5.",
      ],
    },
    {
      heading: "2. Why we use it, and on what basis",
      paragraphs: [
        "We use your booking details to take your booking, send your ticket, check you in at the boarding point, and provide support. We need this information to provide the service you have asked for.",
        "We use analytics and advertising data only where you have given consent, and you can withdraw that consent at any time using the 'Privacy choices' link in the footer of every page.",
      ],
      reviewFlag:
        "The legal-basis wording here is deliberately plain rather than citing GDPR articles. Which basis applies to which processing (contract vs legitimate interest vs consent) should be stated precisely by a lawyer. I have not guessed at article references.",
    },
    {
      heading: "3. Your two separate cookie choices",
      paragraphs: [
        "Cookies that are strictly necessary for booking and payment to work are always on and cannot be switched off.",
        "Beyond those, you have two separate choices, and accepting one never implies the other:",
        "Analytics — helps us understand which trips people look at and where the booking process is confusing. This loads PostHog.",
        "Advertising — lets us measure our advertising. This loads the Meta Pixel, and allows us to share a scrambled (hashed) version of your email address and phone number with Meta.",
        "If you do not accept a category, the relevant script is never loaded onto the page at all. It is not loaded and then switched off.",
      ],
    },
    {
      heading: "4. Meta (Facebook)",
      paragraphs: [
        "If you accept advertising cookies, we use Meta's advertising tools to measure how well our ads work.",
        "We send Meta information about actions you take on the site: pages viewed, trips viewed, when checkout is started, and when a booking is completed, including the value of the booking and an internal reference number for it.",
        "We also send a hashed version of your email address and phone number, so Meta can match your booking to an advert you saw. Hashing means the values are scrambled before they are sent. This is only ever sent if you have accepted advertising cookies — never with analytics consent alone.",
        "If you do not accept advertising cookies, none of your contact details are sent to Meta.",
        "Meta's own privacy policy: https://www.facebook.com/privacy/policy/",
      ],
      reviewFlag:
        "International transfers not addressed. Meta processes data in the United States, and transfers out of the EEA need a stated safeguard (currently the EU–US Data Privacy Framework). A lawyer should write that paragraph — I am not confident enough in the current state of that framework to draft it.",
    },
    {
      heading: "5. PostHog",
      paragraphs: [
        "If you accept analytics cookies, we use PostHog to understand how the site is used — which pages are visited, what is clicked, and how far down pages people scroll.",
        "We use PostHog's European hosting, so this data is stored in the EU.",
        "Text typed into forms is masked before it reaches PostHog. This means the details you enter at checkout — your name, email address, and phone number — are not captured by our analytics.",
        "PostHog's own privacy policy: https://posthog.com/privacy",
      ],
    },
    {
      heading: "6. Who else processes your data",
      paragraphs: [
        "Supabase — hosts our database and handles staff sign-in.",
        "Vercel — hosts and serves the website.",
        "Paymob — processes your card payment.",
      ],
      reviewFlag:
        "Each of these needs its own privacy-policy link and, in most cases, a signed data processing agreement. I have not included their policy URLs because I could not verify them, and a wrong link in a privacy policy is worse than none. Also unconfirmed: which region the Supabase project will run in — that decides where guest data physically lives, and it should be an EU region given the guest mix.",
    },
    {
      heading: "7. How long we keep it",
      paragraphs: [
        "We keep booking records for as long as we need them for accounting, tax, and dispute purposes.",
      ],
      reviewFlag:
        "No retention period is decided anywhere in the project docs, so I have not invented a number. Egyptian tax law will set a minimum for financial records; analytics data should have a much shorter, separately stated period. Both need deciding.",
    },
    {
      heading: "8. Your rights",
      paragraphs: [
        "You can ask us for a copy of the personal information we hold about you, ask us to correct it, or ask us to delete it.",
        "You can withdraw your cookie consent at any time using the 'Privacy choices' link in the footer of every page. Withdrawing takes effect immediately.",
        "If you are in the EU or UK, you also have the right to complain to your national data protection authority.",
        "To make any of these requests, contact us at [CONTACT EMAIL].",
      ],
      reviewFlag:
        "Deleting a booking record conflicts with Rule 9, which makes bookings append-only, and with the tax retention in section 7. How an erasure request is actually honoured — anonymising guest fields while keeping the financial record, most likely — is a real design decision we have not made, and this page currently promises something the system cannot yet do.",
    },
    {
      heading: "9. Contact",
      paragraphs: [
        `${ENTITY}, [ADDRESS]. Email [CONTACT EMAIL].`,
      ],
      reviewFlag:
        "Unknown: entity, address, contact email, and whether a Data Protection Officer or EU representative is required given the volume of EU guests.",
    },
  ],
};
