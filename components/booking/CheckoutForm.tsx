"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitCheckoutAction } from "@/lib/actions/checkout.actions";
import type { CheckoutResult } from "@/lib/actions/checkout.actions";
import { trackInitiateCheckout } from "@/lib/analytics/client";
import { getCountryOptions } from "@/lib/countries";
import { en } from "@/lib/i18n/en";
import { formatUsdCents } from "@/lib/money";
import { bookerDetailsSchema } from "@/lib/validators";
import type { TripListingItem } from "@/types/domain";

/**
 * Booker details form — PRD_Phase1.md §Screen 3.
 *
 * Client-side validation exists ONLY for immediate feedback. The same zod schema
 * runs again server-side in submitCheckoutAction, and that run is the one that
 * counts (SECURITY.md §6). Sharing the schema means the two cannot drift apart.
 *
 * Double-submit is prevented by disabling the button for the whole transition —
 * on a slow connection a guest will press twice, and this is a payment path.
 */
export function CheckoutForm({
  trip,
  headcount,
}: {
  trip: TripListingItem;
  headcount: number;
}) {
  const [values, setValues] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    nationality: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const countries = getCountryOptions();
  const totalUsdCents = trip.pricePerGuestUsdCents * headcount;

  function update(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function submit() {
    setResult(null);

    const localCheck = bookerDetailsSchema.safeParse(values);
    if (!localCheck.success) {
      const errors: Record<string, string> = {};
      for (const issue of localCheck.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // Meta InitiateCheckout — fired when the guest commits, before handoff.
    // A no-op without marketing consent, since the Pixel was never injected.
    trackInitiateCheckout({ tripInstanceId: trip.id, headcount });

    startTransition(async () => {
      const outcome = await submitCheckoutAction({
        ...localCheck.data,
        tripInstanceId: trip.id,
        headcount,
      });

      if (outcome.ok) {
        window.location.href = outcome.redirectTo;
        return;
      }

      setFieldErrors(outcome.fieldErrors);
      setResult(outcome);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {en.checkout.detailsHeading}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {en.checkout.detailsBody}
          </p>
        </div>

        <Field
          id="guestName"
          label={en.checkout.nameLabel}
          placeholder={en.checkout.namePlaceholder}
          value={values.guestName}
          error={fieldErrors["guestName"]}
          autoComplete="name"
          onChange={(v) => update("guestName", v)}
        />
        <Field
          id="guestEmail"
          label={en.checkout.emailLabel}
          type="email"
          value={values.guestEmail}
          error={fieldErrors["guestEmail"]}
          autoComplete="email"
          onChange={(v) => update("guestEmail", v)}
        />
        <Field
          id="guestPhone"
          label={en.checkout.phoneLabel}
          type="tel"
          hint={en.checkout.phoneHint}
          value={values.guestPhone}
          error={fieldErrors["guestPhone"]}
          autoComplete="tel"
          onChange={(v) => update("guestPhone", v)}
        />

        <label className="flex flex-col gap-2" htmlFor="nationality">
          <span className="text-sm font-semibold text-text-primary">
            {en.checkout.nationalityLabel}
          </span>
          <select
            id="nationality"
            value={values.nationality}
            onChange={(event) => update("nationality", event.target.value)}
            aria-invalid={Boolean(fieldErrors["nationality"])}
            className="min-h-touch rounded-sm border border-border bg-surface px-3 text-base text-text-primary"
          >
            <option value="">{en.checkout.nationalityPlaceholder}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {fieldErrors["nationality"] ? (
            <span role="alert" className="text-sm text-danger">
              {fieldErrors["nationality"]}
            </span>
          ) : null}
        </label>
      </section>

      {/*
        context.md §9 — the no-refund rule is stated HERE, above the pay button,
        not only afterwards on the ticket. A guest must not discover it later.
      */}
      <section className="rounded-sm border border-border bg-surface-alt p-4">
        <h3 className="text-sm font-semibold text-text-primary">
          {en.checkout.policyHeading}
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          {en.checkout.policyNoRefund}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          {en.checkout.policyTerms}{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-text-primary"
          >
            {en.checkout.policyTermsLink}
          </Link>
        </p>
      </section>

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="flex min-h-touch items-center justify-center rounded-sm bg-accent px-6 text-base font-semibold text-text-on-accent hover:opacity-90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending
          ? en.checkout.paying
          : en.checkout.payButton(formatUsdCents(totalUsdCents))}
      </button>

      <p className="text-sm text-text-secondary">{en.checkout.egpDisclosure}</p>

      {result && !result.ok ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-sm border border-danger bg-danger-tint p-4"
        >
          <p className="text-base font-semibold text-text-primary">
            {result.code === "TRIP.DETAILS.SOLD_OUT"
              ? en.checkout.soldOutTitle
              : en.checkout.errorTitle}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {result.code === "TRIP.DETAILS.SOLD_OUT"
              ? en.checkout.soldOutBody
              : en.checkout.errorBody}
          </p>
          {result.code === "TRIP.DETAILS.SOLD_OUT" ? (
            <Link
              href="/"
              className="mt-4 inline-flex min-h-touch items-center rounded-sm bg-primary px-6 text-base font-semibold text-text-on-primary hover:bg-primary-light"
            >
              {en.checkout.backToTrip}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: string | undefined;
  type?: string;
  placeholder?: string | undefined;
  autoComplete?: string | undefined;
}) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-touch rounded-sm border border-border bg-surface px-3 text-base text-text-primary"
      />
      {hint ? (
        <span id={`${id}-hint`} className="text-sm text-text-secondary">
          {hint}
        </span>
      ) : null}
      {/* DESIGN.md §7 — errors announced via aria-live, never colour alone. */}
      {error ? (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
