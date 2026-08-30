/**
 * Badge pill for trip cards — DESIGN.md §5.3 / §9.
 *
 * Every badge is derived from data we hold (the trip's date, its seat count).
 * None of them assert anything about the product we cannot back up — there is no
 * "Bestseller" or "Popular" here, because we have no sales ranking and inventing
 * urgency a guest can't verify is a trust problem, not a design flourish.
 */

export type TripBadgeTone = "neutral" | "accent" | "warning" | "danger";

const toneClasses: Record<TripBadgeTone, string> = {
  neutral: "bg-surface text-text-primary",
  accent: "bg-accent text-text-on-accent",
  warning: "bg-warning text-text-on-primary",
  danger: "bg-danger text-text-on-primary",
};

export function TripBadge({
  tone = "neutral",
  children,
}: {
  tone?: TripBadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
