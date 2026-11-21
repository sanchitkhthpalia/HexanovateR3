import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__/sheet-cases.json";
import { formatCount, formatInr, formatMonths, formatPages, formatResources } from "./format";

describe("formatInr", () => {
  it.each([
    [0, "₹0"],
    [-0, "₹0"],
    [73000, "₹73,000"],
    [407000, "₹4,07,000"],
    [33916.666666666664, "₹33,916.67"],
    [2083.3333333333335, "₹2,083.33"],
    [-1583.3333333333335, "-₹1,583.33"],
    [-19000, "-₹19,000"],
    [79903040, "₹7,99,03,040"],
    [6658586.666666667, "₹66,58,586.67"],
    [96960.04, "₹96,960.04"],
    [0.004, "₹0"],
    [-0.004, "₹0"],
  ])("%d → %s", (value, expected) => expect(formatInr(value)).toBe(expected));

  it("clears binary noise like the sheet's display (74999.99999999997 shows as ₹75,000)", () => {
    expect(formatInr(74999.99999999997)).toBe("₹75,000");
    expect(formatInr(6249.999999999998)).toBe("₹6,250");
  });

  it("rounds half-paise away from zero, like the sheet", () => {
    expect(formatInr(1.005)).toBe("₹1.01");
    expect(formatInr(-1.005)).toBe("-₹1.01");
    expect(formatInr(10.125)).toBe("₹10.13");
  });

  it("never shows NaN or Infinity", () => {
    expect(formatInr(Number.NaN)).toBe("—");
    expect(formatInr(Number.POSITIVE_INFINITY)).toBe("—");
  });

  it("shows the same rupees and paise the sheet's ₹#,##0.00 format would, for every fixture output", () => {
    type Case = { expected: Record<string, number | string | null> };
    const money = ["monthlyManualCost", "annualCost", "monthlyCost", "netMonthlySavings", "annualSavings"];
    // Spreadsheets display a cell from its 15-significant-digit value, so 2740.0049999999997 shows as 2,740.01.
    const sheetDisplay = (v: number) =>
      new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2, roundingMode: "halfExpand" }).format(
        Math.abs(Number(v.toPrecision(15))),
      );
    for (const c of (fixtures as { cases: Case[] }).cases) {
      for (const key of money) {
        const v = c.expected[key];
        if (typeof v !== "number") continue;
        // Compare digits only: ours may drop ".00".
        const ours = formatInr(v).replace(/[₹-]/g, "");
        const sheet = sheetDisplay(v);
        expect(sheet === ours || sheet === `${ours}.00`, `${key}=${v}: sheet ${sheet}, ours ${ours}`).toBe(true);
      }
    }
  });
});

describe("counts and units", () => {
  it.each([
    [3000, "3,000 pages"],
    [36000, "36,000 pages"],
    [120000, "1,20,000 pages"],
    [1000000, "10,00,000 pages"],
  ])("formatPages(%d) → %s", (v, s) => expect(formatPages(v)).toBe(s));

  it("formats whole counts with Indian grouping", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(34)).toBe("34");
    expect(formatCount(150000)).toBe("1,50,000");
  });

  it("matches the sheet's 0.00 and 0.0 formats", () => {
    expect(formatResources(1.2)).toBe("1.20");
    expect(formatResources(33.333333333333336)).toBe("33.33");
    expect(formatResources(0.1)).toBe("0.10");
    expect(formatMonths(0.1)).toBe("0.1");
    expect(formatMonths(4.2)).toBe("4.2");
    expect(formatMonths(0)).toBe("0.0");
  });
});
