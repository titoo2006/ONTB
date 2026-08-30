import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nile Booking — Nile Dinner Cruise Booking",
  description: "Book a Nile dinner-cruise yacht trip in Egypt.",
};

/**
 * Root layout — deliberately almost empty.
 *
 * Only the root layout may render <html> and <body>, so this holds those and
 * nothing else. Everything with a policy attached to it lives one level down:
 *
 *   app/(guest)/layout.tsx  — consent scripts, PageView tracking, public footer
 *   app/(staff)/layout.tsx  — none of the above
 *
 * Route groups do not appear in URLs, so /organizer and /admin are unchanged.
 * The split exists so a tracking script CANNOT be rendered on a staff route by
 * accident: it is not that the staff layout disables tracking, it is that the
 * component which injects it is not in that tree at all.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
