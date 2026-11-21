"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { CountryCode } from "libphonenumber-js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { ctaClasses, CtaArrow } from "@/components/ui/ButtonLink";
import {
  DEFAULT_COUNTRY,
  DOCUMENT_VOLUMES,
  leadFormSchema,
  PAIN_POINT_MAX,
  SOLUTIONS,
  type LeadFormInput,
  type LeadFormValues,
} from "@/lib/validation/lead";
import { Field, FormSelect, fieldBorder, fieldBox } from "./fields";
import { PhoneField } from "./PhoneField";

// Lead form, Figma 3009:10095. Validation: lib/validation/lead.ts (shared with /api/lead).
// Errors show on blur, then update as the user types; submitting validates everything again and
// focuses the first problem. The button reads as disabled until the form is valid (aria-disabled,
// so clicking it still runs validation and shows what's missing).

type Status = "idle" | "submitting" | "success" | "error";

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));
const SOLUTION_OPTIONS = toOptions(SOLUTIONS);
// Full labels in the list; short ones in the closed 199px trigger so nothing truncates.
const DOCUMENT_SHORT = ["< 1K / month", "1K – 10K / month", "10K – 50K / month", "50K – 1L / month", "> 1L / month"];
const DOCUMENT_OPTIONS = DOCUMENT_VOLUMES.map((v, i) => ({ value: v, label: v, display: DOCUMENT_SHORT[i] }));
const COUNTER_FROM = 800;

export default function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [firstName, setFirstName] = useState("");
  const honeypotRef = useRef<HTMLInputElement>(null);
  const renderedAt = useRef(0);
  const successRef = useRef<HTMLHeadingElement>(null);

  // Set after hydration: the page is prerendered, so a value computed during render would be build time.
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<LeadFormInput, unknown, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    // onTouched: a field is first validated when it loses focus, then on every change, so errors
    // clear as soon as they're fixed. (reValidateMode only applies after the first submit.)
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: { country: DEFAULT_COUNTRY, number: "" },
      email: "",
      painPoint: "",
    },
  });

  const painPointLength = useWatch({ control, name: "painPoint" })?.length ?? 0;

  async function send(values: LeadFormValues) {
    setStatus("submitting");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypotRef.current?.value ?? "", renderedAt: renderedAt.current }),
        signal: AbortSignal.timeout(15000),
      });
      const data: { ok?: boolean; fields?: Record<string, string> } | null = await response.json().catch(() => null);

      if (response.ok && data?.ok) {
        setFirstName(values.name.split(/\s+/)[0]);
        setStatus("success");
        return;
      }
      // The server re-validates with the same schema; show anything it rejects against the field.
      if (response.status === 400 && data?.fields) {
        for (const [path, message] of Object.entries(data.fields)) {
          setError(path as FieldPath<LeadFormInput>, { message }, { shouldFocus: true });
        }
        setStatus("idle");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const submitting = status === "submitting";
  const err = (path: string) => `lead-${path}-error`;

  if (status === "success") {
    return (
      <div role="status" className="flex w-full max-w-[412px] flex-col items-end gap-3 text-right lg:w-[412px] lg:max-w-none">
        <Image src="/icons/check-badge.svg" alt="" width={40} height={40} />
        <h3 ref={successRef} tabIndex={-1} className="font-display text-[1.375rem] leading-8 font-semibold text-black outline-none">
          Thanks{firstName ? `, ${firstName}` : ""}! We&apos;ve got your details.
        </h3>
        <p className="text-body text-ink-body">
          Our team will reach out within one business day to set up your free live demo.
        </p>
      </div>
    );
  }

  return (
    // lg: exactly 412px, wider than the panel's 348px content box, so it overhangs the left panel by ~33px
    // — the design's "folds" fill that overhang (Figma 3009:10095 sits at x=565 while the panel starts at 598).
    <form
      onSubmit={(event) => handleSubmit(send)(event)}
      noValidate
      aria-label="Request a free live demo"
      className="w-full max-w-[412px] lg:w-[412px] lg:max-w-none lg:shrink-0"
    >
      <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Field errorId={err("name")} error={errors.name?.message}>
            <label htmlFor="lead-name" className="sr-only">
              Name
            </label>
            <input
              id="lead-name"
              type="text"
              autoComplete="name"
              placeholder="Name*"
              maxLength={80}
              aria-invalid={!!errors.name || undefined}
              aria-describedby={errors.name ? err("name") : undefined}
              className={`${fieldBox} ${fieldBorder(!!errors.name)} px-5 py-3 tracking-[-0.011em]`}
              {...register("name")}
            />
          </Field>

          <Field errorId={err("phone")} error={errors.phone?.number?.message ?? errors.phone?.country?.message}>
            <Controller
              control={control}
              name="phone.country"
              render={({ field: countryField }) => (
                <PhoneField
                  id="lead-phone"
                  country={countryField.value as CountryCode}
                  onCountryChange={countryField.onChange}
                  invalid={!!errors.phone}
                  errorId={err("phone")}
                  maxLength={20}
                  {...register("phone.number")}
                />
              )}
            />
          </Field>

          <Field errorId={err("email")} error={errors.email?.message}>
            <label htmlFor="lead-email" className="sr-only">
              Work email
            </label>
            <input
              id="lead-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Email ID*"
              maxLength={254}
              aria-invalid={!!errors.email || undefined}
              aria-describedby={errors.email ? err("email") : undefined}
              className={`${fieldBox} ${fieldBorder(!!errors.email)} px-5 py-3 tracking-[-0.011em]`}
              {...register("email")}
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Field errorId={err("solution")} error={errors.solution?.message} className="sm:flex-1">
              <Controller
                control={control}
                name="solution"
                render={({ field }) => (
                  <FormSelect
                    ref={field.ref}
                    id="lead-solution"
                    label="Solution required"
                    placeholder="Solution Required*"
                    options={SOLUTION_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    onClose={field.onBlur}
                    invalid={!!errors.solution}
                    errorId={err("solution")}
                  />
                )}
              />
            </Field>
            <Field errorId={err("documents")} error={errors.documents?.message} className="sm:w-[205px] sm:shrink-0">
              <Controller
                control={control}
                name="documents"
                render={({ field }) => (
                  <FormSelect
                    ref={field.ref}
                    id="lead-documents"
                    label="Number of documents per month"
                    placeholder="No. of Documents*"
                    options={DOCUMENT_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    onClose={field.onBlur}
                    invalid={!!errors.documents}
                    errorId={err("documents")}
                  />
                )}
              />
            </Field>
          </div>

          <Field errorId={err("painPoint")} error={errors.painPoint?.message}>
            <label htmlFor="lead-pain-point" className="sr-only">
              Pain point and expectations (optional)
            </label>
            <textarea
              id="lead-pain-point"
              placeholder="Pain Point and Expectations (optional)"
              maxLength={PAIN_POINT_MAX}
              aria-invalid={!!errors.painPoint || undefined}
              aria-describedby={[errors.painPoint && err("painPoint"), painPointLength >= COUNTER_FROM && "lead-pain-count"]
                .filter(Boolean)
                .join(" ") || undefined}
              className={`${fieldBox} ${fieldBorder(!!errors.painPoint)} block h-[106px] resize-none px-5 py-3.5 tracking-[-0.011em]`}
              {...register("painPoint")}
            />
          </Field>
          {painPointLength >= COUNTER_FROM && (
            <p id="lead-pain-count" className="-mt-1 text-right text-xs text-ink-muted" aria-live="polite">
              {painPointLength.toLocaleString("en-IN")} / {PAIN_POINT_MAX.toLocaleString("en-IN")}
            </p>
          )}
        </div>

        {/* Honeypot: off-screen and skipped by keyboard/AT. People leave it empty; bots fill it. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="lead-website">Website</label>
          <input ref={honeypotRef} id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {status === "error" && (
          <div role="alert" className="flex flex-col items-end gap-1 text-right text-[0.875rem] leading-5 text-danger">
            <p className="font-semibold">We couldn&apos;t send your details.</p>
            <p>Nothing you typed has been lost. Please check your connection and try again.</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            aria-disabled={!isValid || undefined}
            className={`${ctaClasses("brand")} w-[209px] px-8 aria-disabled:cursor-not-allowed aria-disabled:opacity-70 aria-disabled:hover:translate-y-0 aria-disabled:hover:shadow-none aria-disabled:hover:brightness-100 disabled:cursor-wait`}
          >
            {submitting ? (
              <>
                <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Submitting…
              </>
            ) : status === "error" ? (
              <>
                Try again
                <CtaArrow />
              </>
            ) : (
              <>
                Free Live Demo
                <CtaArrow />
              </>
            )}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
