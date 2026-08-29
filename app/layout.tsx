import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NileBook — Nile Dinner Cruise Booking",
  description: "Book a Nile dinner-cruise yacht trip in Egypt.",
};

/**
 * Guest-facing pages default to English (CLAUDE.md Rule 13).
 * SCAFFOLD STUB — font wiring (next/font → --font-sans / --font-mono) and the
 * shared header/footer come with Screen 1.
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
