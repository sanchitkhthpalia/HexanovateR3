import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__/sheet-cases.json";
import { calculateRoi, excelRound, excelRoundUp, type RoiInput, type RoiResult } from "./calculate";

/**
 * Expected values come from scripts/roi/generate_fixtures.py, which evaluates the
 * workbook's own cell formulas with an independent spreadsheet engine — never from
 * calculateRoi itself. Comparisons are exact (toBe / toEqual), not approximate.
 */

interface SheetCase {
  group: "named" | "grid";
  name: string;
  input: { documentType: string; model: string; annualVolume: number; monthlySalary: number };
  expected: {
    tier: string | null;
    pricingKey: string;
    fixedAnnualCost: number;
    rate36kTo120k: number;
    rate120kTo300k: number;
    rate300kTo500k: number;
    rate500kTo1m: number;
    rateAbove1m: number;
    status: string;
    resourcesNeeded: number | null;
    monthlyManualCost: number | null;
    annualCost: number | null;
    monthlyCost: number | null;
    netMonthlySavings: number | null;
    annualSavings: number | null;
    equivalentResources: number | null;
    paybackMonths: number | null;
  };
}

const cases = (fixtures as { cases: SheetCase[] }).cases;
const named = cases.filter((c) => c.group === "named");
const grid = cases.filter((c) => c.group === "grid");

/** Reshapes our result into the sheet's cell layout (B10, E6:E13, B12:B19). */
function asSheetCells(result: RoiResult): SheetCase["expected"] {
  const o = result.outputs;
  return {
    tier: result.tier,
    pricingKey: result.pricingKey,
    fixedAnnualCost: result.fixedAnnualCost,
    rate36kTo120k: result.rates[0],
    rate120kTo300k: result.rates[1],
    rate300kTo500k: result.rates[2],
    rate500kTo1m: result.rates[3],
    rateAbove1m: result.rates[4],
    status: result.message,
    resourcesNeeded: o?.resourcesNeeded ?? null,
    monthlyManualCost: o?.monthlyManualCost ?? null,
    annualCost: o?.annualCost ?? null,
    monthlyCost: o?.monthlyCost ?? null,
    netMonthlySavings: o?.netMonthlySavings ?? null,
    annualSavings: o?.annualSavings ?? null,
    equivalentResources: o?.equivalentResources ?? null,
    paybackMonths: o?.paybackMonths ?? null,
  };
}

const run = (c: SheetCase) => asSheetCells(calculateRoi(c.input as RoiInput));
const find = (name: string) => {
  const c = named.find((n) => n.name === name);
  if (!c) throw new Error(`fixture missing: ${name} — regenerate with npm run roi:fixtures`);
  return c;
};

describe("calculateRoi matches the sheet", () => {
  it("covers every case the brief asks for", () => {
    const names = named.map((c) => c.name);
    for (const vol of [36000, 36001, 120000, 120001, 300000, 500000, 1000000, 1000001]) {
      expect(names.some((n) => n.startsWith(`band boundary ${vol} `))).toBe(true);
    }
    expect(names.filter((n) => n.startsWith("document type / model:"))).toHaveLength(22);
    expect(grid.length).toBe(11 * 2 * 13 * 4);
  });

  it("sheet default state: Bank Cheques, Single, 36,000 pages, ₹30,000", () => {
    const c = find("sheet default state");
    expect(run(c)).toEqual(c.expected);
    // Pin the headline numbers so a regenerated fixture can't silently drift.
    expect(c.expected).toMatchObject({
      status: "Ready",
      annualCost: 25000,
      netMonthlySavings: 33916.666666666664,
      annualSavings: 407000,
      equivalentResources: 2,
      paybackMonths: 0.1,
    });
  });

  it("page first load (no document type) shows blank outputs", () => {
    const c = find("no document type selected (page first load)");
    expect(run(c)).toEqual(c.expected);
    expect(c.expected.status).toBe("Complete all inputs");
  });

  it("tier 3 document with Multi is rejected like the sheet", () => {
    const c = find("tier 3 with Multi is rejected");
    expect(run(c)).toEqual(c.expected);
    expect(c.expected.status).toBe("Tier 3 supports Single only");
  });

  describe("each document type and model", () => {
    it.each(named.filter((c) => c.name.startsWith("document type / model:")).map((c) => [c.name, c] as const))(
      "%s",
      (_name, c) => expect(run(c)).toEqual(c.expected),
    );
  });

  describe("pricing band boundaries", () => {
    it.each(named.filter((c) => c.name.startsWith("band boundary")).map((c) => [c.name, c] as const))(
      "%s",
      (_name, c) => expect(run(c)).toEqual(c.expected),
    );
  });

  describe("zero, negative, minimum and maximum values", () => {
    it.each(
      [
        "zero volume",
        "zero salary",
        "negative volume",
        "minimum inputs: negative savings",
        "maximum inputs",
        "above maximum volume step",
      ].map((name) => [name, find(name)] as const),
    )("%s", (_name, c) => expect(run(c)).toEqual(c.expected));
  });

  describe("rounding and quirks", () => {
    it.each(
      [
        "tie at x.x5: payback ratio is exactly 0.25 in decimal",
        "decimal salary",
        "unknown document type",
      ].map((name) => [name, find(name)] as const),
    )("%s", (_name, c) => expect(run(c)).toEqual(c.expected));
  });

  it(`full grid: every document × model × volume step × 4 salaries (${grid.length} cases)`, () => {
    const mismatches = grid
      .map((c) => ({ name: c.name, got: run(c), want: c.expected }))
      .filter(({ got, want }) => JSON.stringify(got) !== JSON.stringify(want));
    expect(mismatches.slice(0, 5)).toEqual([]);
  });
});

describe("Excel rounding helpers", () => {
  it("ROUND is half away from zero on the displayed value", () => {
    expect(excelRound(0.25, 1)).toBe(0.3);
    expect(excelRound(0.24999999999999997, 1)).toBe(0.3); // binary noise of 0.25
    expect(excelRound(0.2499, 1)).toBe(0.2);
    expect(excelRound(1.005, 2)).toBe(1.01); // naive Math.round(1.005*100)/100 gives 1
    expect(excelRound(-2.5, 0)).toBe(-3);
    expect(excelRound(0, 1)).toBe(0);
  });

  it("ROUNDUP goes away from zero but leaves whole numbers alone", () => {
    expect(excelRoundUp(1.2, 0)).toBe(2);
    expect(excelRoundUp(3, 0)).toBe(3);
    expect(excelRoundUp(33.333333333333336, 0)).toBe(34);
    expect(excelRoundUp(0.1, 0)).toBe(1);
    expect(excelRoundUp(-1.2, 0)).toBe(-2);
  });
});
