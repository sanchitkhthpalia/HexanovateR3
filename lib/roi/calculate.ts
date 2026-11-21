/**
 * ROI calculator: a line-by-line port of the ROI sheet (cell mapping in docs/roi-logic.md).
 * Cell references point at the "ROI Calculator" tab unless they start with "Logic!".
 *
 * The arithmetic runs in the same order as the sheet's formulas, so the results are the same
 * doubles. The sheet only rounds in two places, ROUNDUP (Equivalent Resources) and ROUND
 * (Payback Months); ₹, grouping and decimals are display formatting (format.ts).
 * The 15% annual-plan discount isn't applied, same as the sheet.
 */

export const DOCUMENT_TYPES = [
  "Bank Cheques",
  "Bank Documents",
  "ID Cards",
  "KYC Documents",
  "Invoice",
  "Bill of Lading",
  "Packing List",
  "Purchase Order",
  "Contract",
  "P&L Statements",
  "Cashflow Statements",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type Model = "Single" | "Multi";
export type Tier = "tier1" | "tier2" | "tier3";

/** Logic!A2:B12: document type → tier. */
export const DOCUMENT_TIERS: Record<DocumentType, Tier> = {
  "Bank Cheques": "tier1",
  "Bank Documents": "tier1",
  "ID Cards": "tier1",
  "KYC Documents": "tier1",
  Invoice: "tier2",
  "Bill of Lading": "tier2",
  "Packing List": "tier2",
  "Purchase Order": "tier2",
  Contract: "tier3",
  "P&L Statements": "tier3",
  "Cashflow Statements": "tier3",
};

/** Per-page rates for each band above the fixed-cost threshold, in band order. */
export type BandRates = readonly [number, number, number, number, number];

export interface PricingPlan {
  fixedAnnualCost: number;
  rates: BandRates;
}

/** Logic!E2:K6: pricing key ("tier|model") → fixed annual cost and band rates. No tier3|multi row exists. */
export const PRICING: Readonly<Record<string, PricingPlan>> = {
  "tier1|single": { fixedAnnualCost: 25000, rates: [0.07, 0.06, 0.05, 0.04, 0.03] },
  "tier1|multi": { fixedAnnualCost: 18000, rates: [0.05, 0.04, 0.03, 0.02, 0.01] },
  "tier2|single": { fixedAnnualCost: 36000, rates: [0.09, 0.08, 0.07, 0.05, 0.04] },
  "tier2|multi": { fixedAnnualCost: 27000, rates: [0.07, 0.06, 0.05, 0.04, 0.03] },
  "tier3|single": { fixedAnnualCost: 54000, rates: [0.15, 0.14, 0.13, 0.12, 0.11] },
};

/** Logic!N2, used as a literal 30000 in B12. */
export const PAGES_PER_RESOURCE = 30000;

/** Band edges used in B14. Pages up to the first edge are covered by the fixed annual cost (Logic!N5). */
export const BAND_EDGES = [36000, 120000, 300000, 500000, 1000000] as const;

/** Data validation on B8: the only volumes the sheet accepts. */
export const VOLUME_STEPS = [
  3000, 6000, 10000, 20000, 36000, 60000, 90000, 120000, 200000, 300000, 500000, 750000, 1000000,
] as const;

/** Data validation on B9 (decimal between). */
export const SALARY_MIN = 5000;
export const SALARY_MAX = 200000;

/** The sheet's own default inputs (B6:B9, Logic!N3:N4). */
export const SHEET_DEFAULT_INPUT: RoiInput = {
  documentType: "Bank Cheques",
  model: "Single",
  annualVolume: 36000,
  monthlySalary: 30000,
};

export interface RoiInput {
  /** "" means nothing selected (the page's first-load state). */
  documentType: DocumentType | "";
  model: Model;
  annualVolume: number;
  monthlySalary: number;
}

export const STATUS_MESSAGES = {
  ready: "Ready",
  tier3Multi: "Tier 3 supports Single only",
  incomplete: "Complete all inputs",
} as const;

export type RoiStatus = keyof typeof STATUS_MESSAGES;

export interface RoiOutputs {
  resourcesNeeded: number;
  monthlyManualCost: number;
  annualCost: number;
  monthlyCost: number;
  netMonthlySavings: number;
  annualSavings: number;
  equivalentResources: number;
  paybackMonths: number;
}

export interface RoiResult {
  status: RoiStatus;
  /** B10, verbatim. */
  message: (typeof STATUS_MESSAGES)[RoiStatus];
  /** E6, null where the sheet shows "". */
  tier: Tier | null;
  /** E7 */
  pricingKey: string;
  /** E8 */
  fixedAnnualCost: number;
  /** E9:E13 */
  rates: BandRates;
  /** B12:B19, null where the sheet shows "" (status not Ready). */
  outputs: RoiOutputs | null;
}

const NO_RATES: BandRates = [0, 0, 0, 0, 0];

export function calculateRoi(input: RoiInput): RoiResult {
  const { model, annualVolume: volume, monthlySalary: salary } = input;
  const documentType = input.documentType as string;

  // E6: IFERROR(VLOOKUP(B6, Logic!A2:C12, 2, FALSE), ""). VLOOKUP ignores case.
  const tier = lookupTier(documentType);
  // E7: E6 & "|" & LOWER(B7)
  const pricingKey = `${tier ?? ""}|${model.toLowerCase()}`;
  // E8:E13: IFERROR(VLOOKUP(E7, Logic!E2:K8, n, FALSE), 0)
  const plan = lookupPlan(pricingKey);
  const fixedAnnualCost = plan?.fixedAnnualCost ?? 0;
  const rates = plan?.rates ?? NO_RATES;

  // B10: tier-3/Multi check first, then completeness.
  let status: RoiStatus;
  if (tier === "tier3" && model.toLowerCase() === "multi") {
    status = "tier3Multi";
  } else if (documentType === "" || (model as string) === "" || !(volume > 0) || !(salary > 0)) {
    // `!(x > 0)` also treats NaN as incomplete; the sheet would show an error there instead.
    status = "incomplete";
  } else {
    status = "ready";
  }

  const base = { status, message: STATUS_MESSAGES[status], tier, pricingKey, fixedAnnualCost, rates };
  if (status !== "ready") return { ...base, outputs: null };

  // B12: B8 / 30000
  const resourcesNeeded = volume / PAGES_PER_RESOURCE;
  // B13: B12 * B9
  const monthlyManualCost = resourcesNeeded * salary;
  // B14: E8 + MAX(MIN(B8,120000)-36000,0)*E9 + MAX(MIN(B8,300000)-120000,0)*E10
  //        + MAX(MIN(B8,500000)-300000,0)*E11 + MAX(MIN(B8,1000000)-500000,0)*E12 + MAX(B8-1000000,0)*E13
  const [e0, e1, e2, e3, e4] = BAND_EDGES;
  const annualCost =
    fixedAnnualCost +
    Math.max(Math.min(volume, e1) - e0, 0) * rates[0] +
    Math.max(Math.min(volume, e2) - e1, 0) * rates[1] +
    Math.max(Math.min(volume, e3) - e2, 0) * rates[2] +
    Math.max(Math.min(volume, e4) - e3, 0) * rates[3] +
    Math.max(volume - e4, 0) * rates[4];
  // B15: B14 / 12
  const monthlyCost = annualCost / 12;
  // B16: B13 - B15
  const netMonthlySavings = monthlyManualCost - monthlyCost;
  // B17: B16 * 12
  const annualSavings = netMonthlySavings * 12;
  // B18: ROUNDUP(B12, 0)
  const equivalentResources = excelRoundUp(resourcesNeeded, 0);
  // B19: IF(B13 > 0, ROUND(B15 / B13, 1), 0)
  const paybackMonths = monthlyManualCost > 0 ? excelRound(monthlyCost / monthlyManualCost, 1) : 0;

  return {
    ...base,
    outputs: {
      resourcesNeeded,
      monthlyManualCost,
      annualCost,
      monthlyCost,
      netMonthlySavings,
      annualSavings,
      equivalentResources,
      paybackMonths,
    },
  };
}

function lookupTier(documentType: string): Tier | null {
  const needle = documentType.toLowerCase();
  const match = DOCUMENT_TYPES.find((d) => d.toLowerCase() === needle);
  return match ? DOCUMENT_TIERS[match] : null;
}

function lookupPlan(pricingKey: string): PricingPlan | undefined {
  const key = pricingKey.toLowerCase();
  return Object.hasOwn(PRICING, key) ? PRICING[key] : undefined;
}

/**
 * Excel's ROUND: half away from zero, applied to the value as Excel displays it
 * (15 significant digits), so binary noise like 0.24999999999999997 rounds as 0.25.
 */
export function excelRound(value: number, digits: number): number {
  const normalised = Number(value.toPrecision(15));
  const rounded = Math.round(shiftDecimal(Math.abs(normalised), digits));
  return Math.sign(normalised) * shiftDecimal(rounded, -digits);
}

/** Excel's ROUNDUP: away from zero, on the 15-significant-digit value. */
export function excelRoundUp(value: number, digits: number): number {
  const normalised = Number(value.toPrecision(15));
  const rounded = Math.ceil(shiftDecimal(Math.abs(normalised), digits));
  return Math.sign(normalised) * shiftDecimal(rounded, -digits);
}

/** Multiplies by 10^digits via the decimal string, avoiding binary error from `x * 10`. */
function shiftDecimal(value: number, digits: number): number {
  const [mantissa, exponent = "0"] = String(value).split("e");
  return Number(`${mantissa}e${Number(exponent) + digits}`);
}
