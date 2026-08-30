"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/analytics/client";

/**
 * Fires Meta's ViewContent when a guest opens a trip (PRD_Phase1.md Screen 2).
 *
 * No consent check here by design: without marketing consent the Pixel snippet
 * was never injected (components/consent/ConsentScripts.tsx), so `window.fbq`
 * does not exist and trackViewContent is already a no-op. Adding a second check
 * would imply the first one is optional.
 *
 * Renders nothing. It exists only so a server component can fire a browser
 * event without becoming a client component itself.
 */
export function TripViewTracker({
  tripInstanceId,
  yachtName,
}: {
  tripInstanceId: string;
  yachtName: string;
}) {
  useEffect(() => {
    trackViewContent({ tripInstanceId, yachtName });
  }, [tripInstanceId, yachtName]);

  return null;
}
