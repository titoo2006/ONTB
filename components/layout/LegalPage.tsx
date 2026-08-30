import { legalDraftNotice, type LegalDocument } from "@/lib/i18n/legal";

/**
 * Shared renderer for Terms and Privacy.
 *
 * Renders the draft notice and every `reviewFlag` visibly rather than hiding
 * them in comments. A reviewer opening the page should see exactly what is
 * unresolved without reading the source — and an unfinished legal page should be
 * impossible to publish by accident.
 */
export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div
        role="note"
        className="mb-8 rounded-md border border-warning bg-warning-tint p-4"
      >
        <p className="text-sm font-semibold text-text-primary">
          {legalDraftNotice.label}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {legalDraftNotice.body}
        </p>
      </div>

      <h1 className="text-2xl font-semibold text-text-primary">
        {document.title}
      </h1>
      <p className="mt-2 text-sm text-text-muted">{document.lastUpdated}</p>
      <p className="mt-6 text-base text-text-secondary">{document.intro}</p>

      <div className="mt-8 flex flex-col gap-8">
        {document.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-text-primary">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base text-text-secondary">
                {paragraph}
              </p>
            ))}
            {section.reviewFlag ? (
              <p className="rounded-sm border-l-4 border-warning bg-warning-tint p-3 text-sm text-text-primary">
                <span className="font-semibold">Needs review: </span>
                {section.reviewFlag}
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
