import { en } from "@/lib/i18n/en";

/**
 * Reassurance strip beneath the hero — DESIGN.md §9.
 *
 * Every claim here is one the platform actually delivers in Phase 1: card
 * payment, an emailed QR ticket, an all-inclusive price, and group boarding on a
 * single code (context.md §6). Nothing about refunds, price matching, or 24/7
 * support — we have no refund policy for cancellations yet (context.md §8) and
 * no staffed support line to promise.
 */

interface TrustItem {
  title: string;
  body: string;
  icon: React.ReactNode;
}

const iconClass = "h-5 w-5";

const items: TrustItem[] = [
  {
    title: en.trust.securePayment,
    body: en.trust.securePaymentBody,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" />
        <path d="M9.5 12l1.8 1.8 3.4-3.6" />
      </svg>
    ),
  },
  {
    title: en.trust.instantTicket,
    body: en.trust.instantTicketBody,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h4v4H7zM15 9h2M15 13h2M7 16h10" />
      </svg>
    ),
  },
  {
    title: en.trust.included,
    body: en.trust.includedBody,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M5 10h14l-1.2 8.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 10z" />
        <path d="M8 10V7a4 4 0 018 0v3" />
      </svg>
    ),
  },
  {
    title: en.trust.boarding,
    body: en.trust.boardingBody,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M3 17c1.8 1 3.2 1 5 0s3.2-1 5 0 3.2 1 5 0" />
        <path d="M5 13V7a2 2 0 012-2h10a2 2 0 012 2v6" />
        <path d="M9 5V3h6v2" />
      </svg>
    ),
  },
];

export function TrustStrip() {
  return (
    <section className="border-b border-border bg-surface">
      <ul className="mx-auto grid max-w-content list-none grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt text-primary"
            >
              {item.icon}
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-base font-semibold text-text-primary">
                {item.title}
              </span>
              <span className="text-sm text-text-secondary">{item.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
