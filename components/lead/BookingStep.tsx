"use client";

import { useEffect, useRef, useState } from "react";
import { ctaClasses, CtaArrow } from "@/components/ui/ButtonLink";
import { formatDay, formatTime, groupByDay } from "@/lib/booking/slots";

// Calendar step after a successful submission (no Figma design; styled like the form): pick a day,
// pick a 30-minute slot, confirm. Times are shown in IST, the team's calendar. Slots come from
// /api/slots and booking goes to /api/book, both authorised by the token /api/lead returned.

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "picking"; slots: number[]; notice?: string }
  | { kind: "booking"; slots: number[]; start: number }
  | { kind: "booked"; start: number }
  | { kind: "closed"; message: string };

const MESSAGES = {
  load: "We couldn't load available times. Please try again.",
  book: "We couldn't book that time. Please try again.",
  taken: "Sorry, that time was just taken. Please pick another.",
  expired: "This booking link has expired. Our team will email you to find a time.",
  already: "You've already booked a demo. Check your inbox for the invite.",
  none: "No times are open in the next two weeks. Our team will email you to find a time.",
};

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; slots?: string[] } | null;
  return { status: res.status, data };
}

/** Fetches open slots and turns the answer into the next phase. */
async function fetchSlots(token: string, notice?: string): Promise<Phase> {
  try {
    const { status, data } = await post("/api/slots", { token });
    if (status === 401) return { kind: "closed", message: MESSAGES.expired };
    if (!data?.ok || !data.slots) return { kind: "error", message: MESSAGES.load };
    if (!data.slots.length) return { kind: "closed", message: MESSAGES.none };
    return { kind: "picking", slots: data.slots.map((s) => Date.parse(s)), notice };
  } catch {
    return { kind: "error", message: MESSAGES.load };
  }
}

export default function BookingStep({ token, email }: { token: string; email: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [day, setDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const confirmationRef = useRef<HTMLParagraphElement>(null);

  async function loadSlots(notice?: string) {
    setPhase({ kind: "loading" });
    setSelected(null);
    setPhase(await fetchSlots(token, notice));
  }

  // Load once on mount (state starts as "loading", so nothing is set synchronously here).
  useEffect(() => {
    let cancelled = false;
    fetchSlots(token).then((next) => !cancelled && setPhase(next));
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (phase.kind === "booked") confirmationRef.current?.focus();
  }, [phase.kind]);

  async function book(slots: number[], start: number) {
    setPhase({ kind: "booking", slots, start });
    try {
      const { status, data } = await post("/api/book", { token, start: new Date(start).toISOString() });
      if (status === 200 && data?.ok) return setPhase({ kind: "booked", start });
      if (status === 401) return setPhase({ kind: "closed", message: MESSAGES.expired });
      if (data?.error === "already_booked") return setPhase({ kind: "closed", message: MESSAGES.already });
      if (data?.error === "slot_taken" || data?.error === "invalid_slot") return loadSlots(MESSAGES.taken);
      setPhase({ kind: "picking", slots, notice: MESSAGES.book });
    } catch {
      setPhase({ kind: "picking", slots, notice: MESSAGES.book });
    }
  }

  const heading = (
    <h4 className="font-display text-[1.125rem] leading-7 font-semibold text-black">Book your demo call</h4>
  );

  if (phase.kind === "loading") {
    return (
      <section aria-label="Book your demo call" className="flex w-full flex-col gap-3 text-left" aria-busy="true">
        {heading}
        <p className="flex items-center gap-2 text-body text-ink-body" role="status">
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
          Loading available times…
        </p>
      </section>
    );
  }

  if (phase.kind === "error") {
    return (
      <section aria-label="Book your demo call" className="flex w-full flex-col gap-3 text-left">
        {heading}
        <p role="alert" className="text-[0.875rem] leading-5 text-danger">
          {phase.message}
        </p>
        <button type="button" onClick={() => loadSlots()} className={`${ctaClasses("outline")} self-start`}>
          Try again
        </button>
      </section>
    );
  }

  if (phase.kind === "closed") {
    return (
      <section aria-label="Book your demo call" className="flex w-full flex-col gap-2 text-left">
        {heading}
        <p role="status" className="text-body text-ink-body">
          {phase.message}
        </p>
      </section>
    );
  }

  if (phase.kind === "booked") {
    return (
      <section aria-label="Demo call booked" className="flex w-full flex-col gap-2 rounded-field border border-success/30 bg-white p-4 text-left">
        <p ref={confirmationRef} tabIndex={-1} role="status" className="font-display text-[1.125rem] leading-7 font-semibold text-black outline-none">
          You&apos;re booked: {formatDay(phase.start)}, {formatTime(phase.start)} IST
        </p>
        <p className="text-body text-ink-body">
          A calendar invite is on its way to <span className="font-medium text-black">{email}</span>.
        </p>
      </section>
    );
  }

  // picking / booking
  const days = groupByDay(phase.slots);
  const activeDay = days.find((d) => d.key === day) ?? days[0];
  const busy = phase.kind === "booking";

  return (
    <section aria-label="Book your demo call" className="flex w-full flex-col gap-3 text-left">
      <div>
        {heading}
        <p className="text-[0.875rem] leading-5 text-ink-body">A 30-minute call with our team. Times are in IST (GMT+5:30).</p>
      </div>

      {phase.kind === "picking" && phase.notice && (
        <p role="alert" className="text-[0.875rem] leading-5 text-danger">
          {phase.notice}
        </p>
      )}

      <fieldset disabled={busy} className="flex min-w-0 flex-col gap-3">
        <legend className="sr-only">Day</legend>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((d) => {
            const active = d.key === activeDay.key;
            return (
              <button
                key={d.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setDay(d.key);
                  setSelected(null);
                }}
                className={`shrink-0 rounded-pill border px-3 py-1.5 text-[0.8125rem] leading-5 font-medium whitespace-nowrap transition-colors ${
                  active ? "border-brand-500 bg-brand-500 text-white" : "border-field-border bg-white text-ink-body hover:border-brand-500 hover:text-brand-700"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={busy} className="min-w-0">
        <legend className="sr-only">Time on {activeDay.label}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {activeDay.slots.map((s) => {
            const active = s === selected;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(s)}
                className={`rounded-field border px-2 py-2 text-[0.8125rem] leading-5 font-medium tabular-nums transition-colors ${
                  active ? "border-brand-500 bg-brand-500 text-white" : "border-field-border bg-white text-black hover:border-brand-500 hover:bg-nublue-200"
                }`}
              >
                {formatTime(s)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <button
          type="button"
          aria-disabled={selected === null || undefined}
          disabled={busy}
          onClick={() => selected !== null && book(phase.slots, selected)}
          className={`${ctaClasses("brand")} px-6 aria-disabled:cursor-not-allowed aria-disabled:opacity-70 aria-disabled:hover:translate-y-0 aria-disabled:hover:shadow-none aria-disabled:hover:brightness-100 disabled:cursor-wait`}
        >
          {busy ? (
            <>
              <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Booking…
            </>
          ) : (
            <>
              {selected === null ? "Pick a time" : `Book ${formatTime(selected)}`}
              <CtaArrow />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
