"use client";

import * as Select from "@radix-ui/react-select";
import { useEffect, useState } from "react";
import ButtonLink from "@/components/ui/ButtonLink";
import { SelectContent, SelectItem } from "@/components/ui/select";
import {
  calculateRoi,
  DOCUMENT_TYPES,
  SALARY_MAX,
  SALARY_MIN,
  SHEET_DEFAULT_INPUT,
  VOLUME_STEPS,
  type DocumentType,
  type Model,
} from "@/lib/roi/calculate";
import { formatCount, formatInr, formatMonths, formatPages, formatResources } from "@/lib/roi/format";
import ModelToggle from "./ModelToggle";
import RangeSlider from "./RangeSlider";

// ROI calculator (Figma 3008:9582 — a raster, rebuilt from measurements; docs/design/SPEC.md).
// All maths is calculateRoi (lib/roi/calculate.ts, tested against the sheet); all number display is
// lib/roi/format.ts. This component only holds the four inputs and lays out the results.
// First load = the sheet's own default inputs (Bank Cheques, Single, 36,000 pages, ₹30,000).

const SALARY_STEP = 1000;
const DEFAULT_VOLUME_INDEX = VOLUME_STEPS.indexOf(SHEET_DEFAULT_INPUT.annualVolume as (typeof VOLUME_STEPS)[number]);

export default function RoiCalculator() {
  const [documentType, setDocumentType] = useState<DocumentType>(SHEET_DEFAULT_INPUT.documentType as DocumentType);
  const [model, setModel] = useState<Model>(SHEET_DEFAULT_INPUT.model);
  const [volumeIndex, setVolumeIndex] = useState(DEFAULT_VOLUME_INDEX);
  const [salary, setSalary] = useState(SHEET_DEFAULT_INPUT.monthlySalary);

  const annualVolume = VOLUME_STEPS[volumeIndex];
  const result = calculateRoi({ documentType, model, annualVolume, monthlySalary: salary });
  const out = result.outputs;

  // Results update on every input change; the screen-reader summary waits for the user to pause.
  const summary = out
    ? `Net monthly savings ${formatInr(out.netMonthlySavings)}, annual savings ${formatInr(out.annualSavings)}, equivalent resources ${formatCount(out.equivalentResources)}.`
    : notReadyMessage(result.status, documentType);
  const [announced, setAnnounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(summary), 700);
    return () => clearTimeout(timer);
  }, [summary]);

  return (
    <section id="roi-calculator" aria-labelledby="roi-title" className="container-content">
      <div className="rounded-roi border border-roi-border bg-roi-bg px-4 py-8 sm:px-[29px] sm:pt-9 sm:pb-9">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 id="roi-title" className="font-display text-[1.625rem] leading-8 font-bold text-roi-ink">
              Calculate Your Savings
            </h2>
            <p className="mt-0.5 text-[0.8125rem] leading-[18px] text-roi-muted">
              See how much time and money you can save with KlearStack AI.
            </p>
          </div>
          <div className="md:mt-[13px]">
            <ModelToggle value={model} onChange={setModel} />
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-8 rounded-2xl border border-roi-card-line bg-white px-4 pt-6 pb-7 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:mt-[37px] sm:px-[21px] sm:pb-10">
          <label
            id="roi-doc-label"
            htmlFor="roi-doc-type"
            className="block text-[0.6875rem] leading-4 font-bold tracking-[0.06em] text-roi-muted uppercase"
          >
            Document Type
          </label>
          <Select.Root value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
            <Select.Trigger
              id="roi-doc-type"
              className="group mt-2 flex h-[38px] w-full items-center justify-between rounded-lg border border-roi-line bg-roi-bg px-[13px] text-left text-[0.8125rem] font-semibold text-roi-ink transition-colors hover:border-roi-subtle focus-visible:border-roi-blue focus-visible:ring-2 focus-visible:ring-roi-blue/25 focus-visible:outline-none"
            >
              <Select.Value placeholder="Select Document Type" />
              <Select.Icon asChild>
                {/* Solid caret, as in the design */}
                <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden className="text-roi-muted transition-transform duration-200 group-data-[state=open]:rotate-180">
                  <path d="M0 0h10L5 6z" fill="currentColor" />
                </svg>
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select.Portal>
          </Select.Root>

          <div className="mt-4 grid gap-y-6 md:grid-cols-2 md:gap-x-[43px]">
            <RangeSlider
              id="roi-volume"
              label={
                <>
                  Document Volume (Pages)
                  <InfoTip text="Total pages your team processes per year." />
                </>
              }
              value={volumeIndex}
              min={0}
              max={VOLUME_STEPS.length - 1}
              step={1}
              onChange={setVolumeIndex}
              valueText={formatPages(annualVolume)}
            />
            <RangeSlider
              id="roi-salary"
              label="Average Monthly Salary per Resource"
              value={salary}
              min={SALARY_MIN}
              max={SALARY_MAX}
              step={SALARY_STEP}
              onChange={setSalary}
              valueText={formatInr(salary)}
            />
          </div>
        </div>

        {/* Outputs — update live as inputs change */}
        <div className="mt-6 grid gap-[15px] sm:mt-[26px] md:grid-cols-3">
          <ResultCard
            label="Net Monthly Savings"
            caption="Compared to manual labor"
            value={out ? formatInr(out.netMonthlySavings) : formatInr(0)}
            tone="blue"
            negative={!!out && out.netMonthlySavings < 0}
          />
          <ResultCard
            label="Annual Savings"
            caption="Total saved per year"
            value={out ? formatInr(out.annualSavings) : formatInr(0)}
            tone="ink"
            negative={!!out && out.annualSavings < 0}
          />
          <ResultCard
            label="Equivalent Resources"
            caption="People replaced by KlearStack"
            value={out ? formatCount(out.equivalentResources) : "0"}
            tone="muted"
          />
        </div>

        {!out && (
          <p role="status" className="mt-4 text-center text-[0.8125rem] font-semibold text-danger">
            {notReadyMessage(result.status, documentType)}
          </p>
        )}
        {out && out.netMonthlySavings < 0 && (
          <p className="mt-4 text-center text-[0.8125rem] text-roi-muted">
            At this volume and salary, manual processing still costs less. Savings start at higher volumes.
          </p>
        )}
        <p className="sr-only" aria-live="polite">
          {announced}
        </p>

        <p className="mt-[13px] text-center text-[0.625rem] font-semibold text-roi-muted">
          * 15% lesser price in the Annual Plan
        </p>

        {out && (
          <details className="group mx-auto mt-3 max-w-md text-[0.8125rem] text-roi-muted">
            <summary className="mx-auto w-fit cursor-pointer list-none rounded px-2 text-center font-semibold text-brand-700 underline-offset-2 hover:underline">
              View calculation details
            </summary>
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 rounded-xl border border-roi-card-line bg-white p-4">
              <Detail term="Resources needed" value={formatResources(out.resourcesNeeded)} />
              <Detail term="Monthly manual cost" value={formatInr(out.monthlyManualCost)} />
              <Detail term="KlearStack annual cost" value={formatInr(out.annualCost)} />
              <Detail term="KlearStack monthly cost" value={formatInr(out.monthlyCost)} />
              <Detail term="Net monthly savings" value={formatInr(out.netMonthlySavings)} />
              <Detail term="Annual savings" value={formatInr(out.annualSavings)} />
              <Detail term="Equivalent resources" value={formatCount(out.equivalentResources)} />
              <Detail term="Payback (months)" value={formatMonths(out.paybackMonths)} />
            </dl>
          </details>
        )}

        <div className="mt-[23px] flex justify-center">
          <ButtonLink href="#demo" className="w-full max-w-[371px] px-8">
            Automate your workflows with us
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function notReadyMessage(status: string, documentType: DocumentType) {
  if (status === "tier3Multi") {
    return `Multi-Shot isn't available for ${documentType} (Tier 3 supports Single only). Switch to Single-Shot to see your savings.`;
  }
  return "Complete all inputs to see your savings.";
}

// Labels: the design's #3E93FC is 3.1:1 at 11px, so the blue label uses brand-500 (4.6:1); the 26px
// value keeps #3E93FC (large text needs 3:1). Captions use slate-500 instead of the design's
// #94A3B8 (2.6:1) — assumptions Q7.
const TONES = { blue: "text-brand-500", ink: "text-roi-ink", muted: "text-roi-muted" } as const;

// Result card (ROI raster): 114px tall, centred label / value / caption. The first card's label and
// value are blue, the second's label dark, the third's label slate; values are dark unless blue.
function ResultCard({
  label,
  caption,
  value,
  tone,
  negative = false,
}: {
  label: string;
  caption: string;
  value: string;
  tone: keyof typeof TONES;
  negative?: boolean;
}) {
  const valueTone = negative ? "text-danger" : tone === "blue" ? "text-roi-blue" : TONES.ink;
  return (
    <div className="flex min-h-[114px] flex-col items-center justify-center rounded-2xl border border-roi-card-line bg-white px-3 py-4 text-center shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
      <p className={`text-[0.6875rem] leading-4 font-bold tracking-[0.06em] uppercase ${TONES[tone]}`}>{label}</p>
      <p className={`mt-2.5 font-display text-[1.625rem] leading-8 font-bold tabular-nums ${valueTone}`}>{value}</p>
      <p className="mt-2 text-[0.625rem] leading-[14px] font-semibold tracking-[0.04em] text-roi-muted uppercase">{caption}</p>
    </div>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <>
      <dt>{term}</dt>
      <dd className="text-right font-semibold text-roi-ink tabular-nums">{value}</dd>
    </>
  );
}

// "ⓘ" next to the volume label: shows its hint on hover and keyboard focus.
function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex normal-case">
      <button
        type="button"
        aria-label={text}
        className="flex size-3.5 items-center justify-center rounded-full border border-roi-subtle text-[0.5625rem] leading-none font-bold text-roi-subtle focus-visible:ring-2 focus-visible:ring-roi-blue/40 focus-visible:outline-none"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-56 -translate-x-1/2 rounded-md bg-roi-ink px-2.5 py-1.5 text-[0.6875rem] font-medium tracking-normal text-white opacity-0 transition-opacity group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
