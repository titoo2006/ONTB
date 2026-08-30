import Link from "next/link";
import { ConsentManageLink } from "@/components/consent/ConsentManageLink";
import { en } from "@/lib/i18n/en";

/**
 * Site footer.
 *
 * Built now because consent withdrawal has to live somewhere permanent — GDPR
 * requires that changing your mind is as easy as consenting in the first place,
 * so "Privacy choices" must be reachable from every page, not only from a banner
 * that disappears once answered.
 *
 * Terms and Privacy are linked but NOT yet written. They are legally required
 * before taking real payments: the no-refund-on-no-show policy has to be stated
 * in the terms a guest accepts at checkout (context.md §9), and the privacy
 * policy has to name Meta and PostHog as processors now that we load them.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print mt-12 bg-primary">
      <div className="mx-auto max-w-content px-4 py-12 md:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-lg font-semibold text-text-on-primary">
              {en.siteHeader.brand}
            </span>
            <span className="text-sm text-text-on-primary/80">
              {en.footer.tagline}
            </span>
            <span className="mt-2 text-sm text-text-on-primary/80">
              {en.footer.priceNote}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-text-on-primary">
              {en.footer.contact}
            </span>
            <a
              href={`tel:${en.siteHeader.phone.replace(/\s/g, "")}`}
              className="text-sm text-text-on-primary/80 hover:text-text-on-primary"
            >
              {en.siteHeader.phone}
            </a>
          </div>

          <div className="flex flex-col items-start gap-2">
            <span className="text-sm font-semibold text-text-on-primary">
              {en.footer.legal}
            </span>
            <Link
              href="/terms"
              className="text-sm text-text-on-primary/80 hover:text-text-on-primary"
            >
              {en.footer.terms}
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-text-on-primary/80 hover:text-text-on-primary"
            >
              {en.footer.privacy}
            </Link>
            <ConsentManageLink />
          </div>
        </div>

        <p className="mt-8 border-t border-text-on-primary/20 pt-6 text-sm text-text-on-primary/70">
          © {year} {en.siteHeader.brand}. {en.footer.rights}
        </p>
      </div>
    </footer>
  );
}
