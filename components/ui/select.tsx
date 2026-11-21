"use client";

import * as Select from "@radix-ui/react-select";
import type { ReactNode } from "react";

// Listbox panel + option for Radix Select, styled like the header menus (white, slate-200 border,
// overlay shadow). Shared by the lead form dropdowns, the country picker and the ROI document type.

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
