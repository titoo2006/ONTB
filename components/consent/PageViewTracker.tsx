"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics/client";

/**
 * Fires Meta PageView on client-side navigations.
 *
 * The Pixel snippet fires PageView once when it initialises, so this
 * deliberately SKIPS the first render — otherwise the landing page counts twice.
 * From then on, App Router navigations don't reload the page, so each route
 * change needs an explicit event.
 *
 * No consent check here: without consent the snippet was never injected, so
 * `window.fbq` does not exist and trackPageView is already a no-op.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname, searchParams]);

  return null;
}
