"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics/client";

/**
 * Fires Meta PageView on client-side navigations.
 *
 * The Pixel snippet fires PageView once when it initialises, so this
 * deliberately SKIPS the first render — otherwise the landing page counts twice.
 * From then on, App Router navigations don't reload the page, so each route
 * change needs an explicit event.
 *
 * Tracks `usePathname` only, NOT `useSearchParams`: a query-string change on the
 * listing is a date filter, not a new page. Counting every filter click as a
 * PageView would inflate the metric and tell us nothing. Dropping it also
 * removes the Suspense boundary useSearchParams would otherwise require.
 *
 * No consent check: without consent the snippet was never injected, so
 * `window.fbq` does not exist and trackPageView is already a no-op.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  return null;
}
