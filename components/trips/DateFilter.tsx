import Link from "next/link";
import { en } from "@/lib/i18n/en";
import { formatCairoDateLabel } from "@/lib/time";
import type { CairoDate } from "@/lib/time";

/**
 * Date filter for Screen 1.
 *
 * Deliberately links, not client-side state: selecting a date re-runs the server
 * read, so the seat counts a guest sees are fetched fresh rather than filtered from
 * a snapshot that may be minutes old (Rule 14). It also keeps the whole screen a
 * server component — no client JS, which matters for tourists on hotel wifi.
 */
interface DateFilterProps {
  dates: CairoDate[];
  /** `| undefined` is required by exactOptionalPropertyTypes in tsconfig. */
  selected?: CairoDate | undefined;
}

export function DateFilter({ dates, selected }: DateFilterProps) {
  return (
    <nav aria-label={en.tripListing.dateFilterLabel}>
      <ul className="flex list-none gap-2 overflow-x-auto pb-2">
        <li>
          <FilterPill href="/" active={selected === undefined}>
            {en.tripListing.allUpcoming}
          </FilterPill>
        </li>
        {dates.map((date) => (
          <li key={date}>
            <FilterPill href={`/?date=${date}`} active={selected === date}>
              {formatCairoDateLabel(date)}
            </FilterPill>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-h-touch items-center whitespace-nowrap rounded-full border px-4 text-sm",
        active
          ? "border-primary bg-primary font-semibold text-text-on-primary shadow-card"
          : "border-border bg-surface text-text-primary hover:border-border-strong hover:bg-surface-alt",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
