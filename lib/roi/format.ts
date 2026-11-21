// Display formatting for the ROI calculator. No ROI maths here — values come from calculate.ts.
//
// What the design and sheet show, and so what we match:
// - Currency: ₹ with Indian digit grouping (₹4,07,000). The design's cards show whole rupees ("₹0");
//   the sheet formats money as ₹#,##0.00. So whole amounts show no decimals and amounts with paise
//   show exactly 2 — the visible value always equals the sheet's.
// - No L/Cr abbreviation and no percentages: neither appears in the design or in the sheet's
//   output formats, and full figures can be compared with the sheet directly.
// - Counts (pages, people) use Indian grouping; "Resources Needed" 2 dp and "Payback Months"
//   1 dp mirror the sheet's 0.00 and 0.0 formats.

import { excelRound } from "./calculate";

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});
const inrPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const count = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const twoDp = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const oneDp = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** ₹ amount: "₹4,07,000", "₹33,916.67", "-₹1,583.33". Whole rupees drop the decimals. */
export function formatInr(value: number): string {
  if (!Number.isFinite(value)) return "—";
  // Same rounding as the sheet's ₹#,##0.00 display: 15 significant digits, then half away from zero.
  const paise = excelRound(value, 2);
  if (paise === 0) return inrWhole.format(0); // never "-₹0"
  return Number.isInteger(paise) ? inrWhole.format(paise) : inrPaise.format(paise);
}

/** Whole count with Indian grouping: 1000000 → "10,00,000". */
export function formatCount(value: number): string {
  return Number.isFinite(value) ? count.format(value) : "—";
}

/** Slider bubble: "36,000 pages". */
export function formatPages(pages: number): string {
  return `${formatCount(pages)} pages`;
}

/** Sheet B12 format 0.00: "1.20". */
export function formatResources(value: number): string {
  return Number.isFinite(value) ? twoDp.format(value) : "—";
}

/** Sheet B19 format 0.0 (already rounded by the engine): "0.1". */
export function formatMonths(value: number): string {
  return Number.isFinite(value) ? oneDp.format(value) : "—";
}
