import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { SignInForm } from "@/components/organizer/SignInForm";
import { getOrganizerIdentity } from "@/lib/services/organizer.service";
import { en } from "@/lib/i18n/en";

/**
 * SCREEN 6 — Organizer Login. PRD_Phase1.md §Screen 6.
 *
 * An organizer who is already signed in is sent straight to the check-in screen
 * rather than shown a login form they don't need — mid-shift, reopening the tab
 * should land on the search field.
 */
export default async function OrganizerLoginPage() {
  noStore();

  const organizer = await getOrganizerIdentity();
  if (organizer) redirect("/organizer/check-in");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">
        {en.organizer.signInTitle}
      </h1>
      <p className="mb-8 mt-2 text-base text-text-secondary">
        {en.organizer.signInBody}
      </p>
      <SignInForm />
    </main>
  );
}
