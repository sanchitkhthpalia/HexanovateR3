"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ctaClasses } from "@/components/ui/ButtonLink";
import { ArrowRight } from "@/components/icons";

// Newsletter row (Figma 3008:9871). Validates the address; not wired to a system (optional per
// the brief) — a valid submit shows a confirmation. Any valid address is accepted here: the
// work-email rule applies to demo requests, not to newsletter sign-ups.
const emailSchema = z
  .string()
  .trim()
  .min(1, { error: "Please enter your email address." })
  .pipe(z.email({ error: "That doesn't look like a valid email address. Please check for typos." }));

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (value: string) => {
    const result = emailSchema.safeParse(value);
    setError(result.success ? undefined : result.error.issues[0].message);
    return result.success;
  };

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (validate(email)) setDone(true);
  }

  if (done) {
    return (
      <p role="status" className="flex h-11 flex-1 items-center justify-center rounded-pill bg-white/70 px-6 text-center text-[0.9375rem] font-medium text-brand-700">
        Thanks! You&apos;re subscribed to our newsletter.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex flex-col gap-2.5 sm:h-11 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="Enter your E-mail address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) validate(e.target.value);
          }}
          onBlur={() => {
            if (!email) return; // don't nag an empty field the user merely passed through
            setTouched(true);
            validate(email);
          }}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={`h-11 min-w-0 flex-1 rounded-pill border bg-white px-8 text-center text-base tracking-[-0.011em] text-black transition-[border-color,box-shadow] placeholder:font-light placeholder:text-ink-muted focus:ring-2 focus:outline-none sm:text-field ${
            error ? "border-danger focus:ring-danger/20" : "border-brand-500 focus:ring-brand-500/25"
          }`}
        />
        <button type="submit" className={`${ctaClasses("brand")} h-11 px-8`}>
          Subscribe
          <ArrowRight className="size-5 transition-transform duration-200 group-hover/cta:translate-x-1" />
        </button>
      </div>
      {error && (
        <p id="newsletter-error" className="px-8 text-[0.8125rem] leading-5 text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
