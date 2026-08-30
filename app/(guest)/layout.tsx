import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { ConsentScripts } from "@/components/consent/ConsentScripts";
import { PageViewTracker } from "@/components/consent/PageViewTracker";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Guest-facing layout — the ONLY place tracking is mounted.
 *
 * ConsentScripts reads the consent cookie server-side and emits vendor snippets
 * only for categories the guest accepted, so with no decision, or a rejection,
 * no third-party script reaches the browser at all.
 *
 * The staff layout does not import any of this. That is the point of the route
 * group: the Pixel cannot appear on /organizer or /admin even if a staff member
 * has accepted cookies on the public site, because the component that injects it
 * does not exist in that tree.
 */
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ConsentScripts />
      {/* No Suspense boundary here, deliberately. Wrapping this in Suspense made
          every guest response a streamed one, which commits the HTTP status
          before rendering finishes — notFound() then returned the 404 page with
          a 200. PageViewTracker tracks pathname only so it needs no boundary. */}
      <PageViewTracker />

      <div className="flex-1">{children}</div>

      <SiteFooter />
      <ConsentBanner />
    </div>
  );
}
