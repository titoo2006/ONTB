import { LegalPage } from "@/components/layout/LegalPage";
import { termsDraft } from "@/lib/i18n/legal";

/**
 * Terms and conditions — DRAFT.
 *
 * Linked from the footer and, once Screen 3 exists, must be linked next to the
 * pay button: the no-refund-on-no-show rule has to be stated before payment,
 * not merely findable afterwards (context.md §9).
 */
export const metadata = {
  title: "Terms and conditions — NileBook",
};

export default function TermsPage() {
  return <LegalPage document={termsDraft} />;
}
