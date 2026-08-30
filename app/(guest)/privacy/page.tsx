import { LegalPage } from "@/components/layout/LegalPage";
import { privacyDraft } from "@/lib/i18n/legal";

/**
 * Privacy policy — DRAFT.
 *
 * Must stay in step with what the site actually loads. If a processor is added
 * or removed — a new analytics vendor, a different payment gateway — this page
 * changes in the same commit, not later.
 */
export const metadata = {
  title: "Privacy policy — Nile Booking",
};

export default function PrivacyPage() {
  return <LegalPage document={privacyDraft} />;
}
