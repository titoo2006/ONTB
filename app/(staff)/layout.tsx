/**
 * Staff layout — organizer check-in and admin dashboard.
 *
 * NO TRACKING, DELIBERATELY. There is no ConsentScripts, no PageViewTracker, and
 * no consent banner here, and none should ever be added:
 *
 *  - These are internal tools used by the client's boarding staff. Feeding their
 *    behaviour into an ad platform is useless for optimisation and wrong on
 *    principle.
 *  - Rule 10 says an unauthorised caller gets a 404 and is never told a
 *    protected route exists. A Meta Pixel firing a PageView for /organizer/login
 *    would announce that route to a third party on every visit.
 *  - The organizer screen is used outdoors on a phone all shift (DESIGN.md §6).
 *    It should carry no payload it does not need.
 *
 * No public footer either — the marketing footer and its consent link belong to
 * the guest site, not to a check-in screen mid-shift.
 */
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
