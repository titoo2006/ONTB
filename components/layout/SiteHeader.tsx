import Link from "next/link";
import { en } from "@/lib/i18n/en";

/**
 * Site header for guest-facing pages.
 *
 * Deliberately minimal: Phase 1 has no destinations, blog, or about pages to
 * navigate to (PRD_Phase1.md, out of scope), so a full nav bar would be links to
 * nothing. It carries identity and the reservations phone number, which is the
 * one thing a hesitant guest actually looks for.
 *
 * Transparent over the hero, so the header sits on the photography rather than
 * cutting a band across the top of it.
 */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base font-semibold text-text-on-accent"
          >
            N
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-text-on-primary">
              {en.siteHeader.brand}
            </span>
            <span className="text-xs text-text-on-primary/80">
              {en.siteHeader.brandTagline}
            </span>
          </span>
        </Link>

        <div className="hidden flex-col items-end leading-tight sm:flex">
          <span className="text-xs text-text-on-primary/80">
            {en.siteHeader.needHelp}
          </span>
          <a
            href={`tel:${en.siteHeader.phone.replace(/\s/g, "")}`}
            className="text-base font-semibold text-text-on-primary hover:text-accent"
          >
            {en.siteHeader.phone}
          </a>
        </div>
      </div>
    </header>
  );
}
