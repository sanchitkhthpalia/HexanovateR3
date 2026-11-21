"use client";

import { useRef, type KeyboardEvent } from "react";
import type { Model } from "@/lib/roi/calculate";

// Segmented "Single-Shot Model / Multi-Shot Model" toggle (ROI raster, top right). It's a choice
// of one, so it's a radio group: one tab stop, arrow keys move and select.
const OPTIONS: { value: Model; label: string }[] = [
  { value: "Single", label: "Single-Shot Model" },
  { value: "Multi", label: "Multi-Shot Model" },
];

export default function ModelToggle({ value, onChange }: { value: Model; onChange: (model: Model) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label="Processing model" className="flex h-[31px] shrink-0 rounded-lg bg-roi-surface p-0.5">
      {OPTIONS.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`rounded-md px-3 text-[0.6875rem] font-bold whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 ${
              checked
                ? "bg-brand-500 text-white shadow-[0_2px_6px_rgb(24_115_222/0.4)]"
                : "text-[#5b6b80] hover:text-roi-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
