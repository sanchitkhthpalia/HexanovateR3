"use client";

import * as Select from "@radix-ui/react-select";
import Image from "next/image";
import { forwardRef, type ReactNode } from "react";

// Shared pieces of the lead form's fields (Figma 3009:10097): white, 1px #95BFF0, radius 8,
// px20 py12, Inter 14/24 #374151 placeholder. Labels are visually hidden because the design
// uses placeholders only; they still name each control for assistive tech.

// Below 640px text is 16px: iOS Safari zooms the page when focusing inputs smaller than that.
export const fieldBox =
  "relative z-10 w-full rounded-field border bg-white text-base text-black transition-[border-color,box-shadow] duration-150 sm:text-field " +
  "placeholder:text-ink-body focus:outline-none";
export const fieldBorder = (invalid: boolean) =>
  invalid
    ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20 focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/20"
    : "border-field-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20";

/** Field wrapper: control + the design's decorative fold under its bottom-left corner + error text. */
export function Field({
  children,
  errorId,
  error,
  className = "",
}: {
  children: ReactNode;
  errorId: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="relative">
        {children}
        {/* "Lead Generation Form 2 folds": a gradient tab under each field's overhanging left end, so the field reads as
            folding behind the panel edge. Desktop only (no overhang when stacked); hidden while an error shows there. */}
        {!error && (
          <Image
            src="/images/field-fold.svg"
            alt=""
            width={31}
            height={21}
            aria-hidden
            className="pointer-events-none absolute top-[calc(100%-3.5px)] left-[2.4px] z-0 hidden lg:block"
          />
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-left text-[0.8125rem] leading-5 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: ReactNode;
  textValue?: string;
  /** Shorter text for the closed trigger, when the full label won't fit. */
  display?: string;
}

interface FormSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: readonly SelectOption[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  /** Called when the list closes — the select's equivalent of blur, so validation doesn't fire on open. */
  onClose: () => void;
  invalid: boolean;
  errorId: string;
  disabled?: boolean;
  className?: string;
}

/** Custom dropdown (Figma shows a styled control with a blue caret, not a native select). Radix Select gives keyboard + typeahead + ARIA. */
export const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(function FormSelect(
  { id, label, placeholder, options, value, onValueChange, onClose, invalid, errorId, disabled, className = "" },
  ref,
) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Select.Root
        value={value}
        onValueChange={onValueChange}
        onOpenChange={(open) => !open && onClose()}
        disabled={disabled}
      >
        <Select.Trigger
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={`${fieldBox} ${fieldBorder(invalid)} group flex items-center justify-between gap-1.5 px-5 py-3 text-left text-base leading-6 tracking-[-0.011em] data-[placeholder]:text-ink-body sm:text-[0.9375rem] ${className}`}
        >
          <span className="truncate">
            <Select.Value placeholder={placeholder}>{options.find((o) => o.value === value)?.display}</Select.Value>
          </span>
          <Select.Icon asChild>
            <Image
              src="/icons/caret-down-field.svg"
              alt=""
              width={20}
              height={20}
              className="shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} textValue={option.textValue}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select.Portal>
      </Select.Root>
    </>
  );
});

export function SelectContent({ children }: { children: ReactNode }) {
  return (
    <Select.Content
      position="popper"
      sideOffset={6}
      collisionPadding={16}
      className="z-50 max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] origin-[var(--radix-select-content-transform-origin)] overflow-hidden rounded-menu-item border border-slate-200 bg-white shadow-overlay data-[state=open]:animate-menu-in"
    >
      <Select.ScrollUpButton className="flex h-6 items-center justify-center text-ink-menu">▲</Select.ScrollUpButton>
      <Select.Viewport className="p-1.5">{children}</Select.Viewport>
      <Select.ScrollDownButton className="flex h-6 items-center justify-center text-ink-menu">▼</Select.ScrollDownButton>
    </Select.Content>
  );
}

export function SelectItem({ value, textValue, children }: { value: string; textValue?: string; children: ReactNode }) {
  return (
    <Select.Item
      value={value}
      textValue={textValue}
      className="relative flex cursor-pointer items-center rounded-field py-2.5 pr-8 pl-3 text-menu text-ink-menu outline-none select-none data-[highlighted]:bg-nublue-200 data-[highlighted]:text-nublue-800 data-[state=checked]:font-semibold data-[state=checked]:text-nublue-800"
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-3">
        <svg viewBox="0 0 16 16" width={14} height={14} fill="none" aria-hidden>
          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Select.ItemIndicator>
    </Select.Item>
  );
}
