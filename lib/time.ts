/**
 * context.md §5.1 — THE ONLY PLACE "today" AND "now" ARE DEFINED.
 *
 * Every date/time comparison in this system is pinned to Africa/Cairo and computed
 * server-side, regardless of where the guest is or what their browser clock says.
 * ~90% of guests browse from another country, and this class of bug is invisible
 * when tested from Cairo.
 *
 * Do not call `new Date()` and compare it to a trip date anywhere else. Use these.
 */

export const CAIRO_TZ = "Africa/Cairo";

/** A calendar date in Cairo, as `YYYY-MM-DD` — the format `trip_date` uses. */
export type CairoDate = string;

/** A wall-clock time in Cairo, as `HH:MM:SS` — the format `departure_time` uses. */
export type CairoTime = string;

const DATE_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: CAIRO_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const TIME_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: CAIRO_TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * Today's calendar date in Cairo. `en-CA` formats as YYYY-MM-DD, which is exactly
 * the shape Postgres `date` columns compare against — no manual string assembly,
 * no off-by-one from a UTC round trip.
 */
export function cairoToday(now: Date = new Date()): CairoDate {
  return DATE_PARTS.format(now);
}

/** The current wall-clock time in Cairo, HH:MM:SS. */
export function cairoNowTime(now: Date = new Date()): CairoTime {
  return TIME_PARTS.format(now);
}

/**
 * `count` consecutive Cairo dates starting at `start`.
 * Steps by whole days at noon UTC so a DST shift can never skip or repeat a date.
 */
export function cairoDateRange(start: CairoDate, count: number): CairoDate[] {
  const dates: CairoDate[] = [];
  const [year, month, day] = start.split("-").map(Number);
  for (let offset = 0; offset < count; offset += 1) {
    const stepped = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + offset, 12));
    dates.push(DATE_PARTS.format(stepped));
  }
  return dates;
}

/** Whether a Cairo date+time is still in the future, judged in Cairo. */
export function isFutureInCairo(
  tripDate: CairoDate,
  departureTime: CairoTime,
  now: Date = new Date(),
): boolean {
  const today = cairoToday(now);
  if (tripDate > today) return true;
  if (tripDate < today) return false;
  return departureTime > cairoNowTime(now);
}

/** "Fri 29 Aug" — trip card and date filter label. Guest-facing, English (Rule 13). */
export function formatCairoDateLabel(date: CairoDate): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 12)));
}

/** "20:00" — departure times are shown in 24h, matching the client's schedule. */
export function formatDepartureTime(departureTime: CairoTime): string {
  return departureTime.slice(0, 5);
}
