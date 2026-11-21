"use client";

import type { ReactNode } from "react";

// Slider with the design's value bubble above the thumb (Figma ROI raster: blue pill, white 11px
// bold text, small pointer). A native range input keeps arrow/Page/Home/End keys and AT support.

const THUMB_PX = 18;

interface RangeSliderProps {
  id: string;
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Text inside the bubble, also announced as the slider's value. */
  valueText: string;
}

export default function RangeSlider({ id, label, value, min, max, step, onChange, valueText }: RangeSliderProps) {
  // Position of the thumb along the track (0–1), for the fill and the bubble. Layout only.
  const position = max > min ? (value - min) / (max - min) : 0;
  const fill = `${position * 100}%`;
  // Keeps the bubble centred over the thumb, which travels THUMB_PX less than the full width.
  const bubbleLeft = `calc(${fill} + ${(0.5 - position) * THUMB_PX}px)`;

  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[0.6875rem] leading-4 font-bold tracking-[0.06em] text-roi-subtle uppercase">
        {label}
      </label>
      <div className="relative mt-1 h-[51px]">
        <span
          aria-hidden
          className="absolute top-0 -translate-x-1/2 rounded-full bg-roi-blue px-3 py-1 text-[0.6875rem] leading-[15px] font-bold whitespace-nowrap text-white shadow-[0_2px_6px_rgb(62_147_252/0.35)]"
          style={{ left: bubbleLeft }}
        >
          {valueText}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-roi-blue" />
        </span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={valueText}
          onChange={(e) => onChange(Number(e.target.value))}
          className="roi-range absolute bottom-0 left-0"
          style={{ ["--fill" as string]: fill }}
        />
      </div>
    </div>
  );
}
