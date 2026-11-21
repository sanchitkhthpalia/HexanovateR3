# ROI calculator logic

Source: `docs/ROI Calculator_MarTech Technical_Round 2.xlsx` (read with openpyxl, formulas and cached values both inspected).
Implementation: `lib/roi/calculate.ts`. Tests: `lib/roi/calculate.test.ts` against `lib/roi/__fixtures__/sheet-cases.json`.

## ⚠ The delivered workbook's cached results are wrong

Every lookup formula references **`'Logic & Pricing'!`**, but the second tab is named **`Logic and Pricing`**. The reference cannot resolve, `IFERROR` swallows the error, and the saved file shows Tier = blank, Fixed annual cost = ₹0, all rates = 0 and **Annual Cost = ₹0** for the default inputs (hence a nonsensical ₹4,32,000 annual saving at zero platform cost).

We implement what the formulas clearly intend: the lookup resolves against the pricing tab. To produce expected test values, `scripts/roi/generate_fixtures.py` renames the tab to `Logic & Pricing` in a temporary copy (no formula is altered) and evaluates the sheet with the `formulas` engine. The live Google Sheet linked in the brief should be checked to confirm it doesn't have the same problem; the reviewers will test against whichever sheet they hold.

## Inputs — "ROI Calculator" sheet

| Cell | Input | Allowed values (data validation) | Sheet default |
|---|---|---|---|
| B6 | Document Type | list of 11 (below) | Bank Cheques |
| B7 | Model | `Single`, `Multi` | Single |
| B8 | Annual Volume (pages) | list: 3,000 · 6,000 · 10,000 · 20,000 · 36,000 · 60,000 · 90,000 · 120,000 · 200,000 · 300,000 · 500,000 · 750,000 · 1,000,000 | 36,000 |
| B9 | Average Monthly Salary / Resource (INR) | decimal between 5,000 and 2,00,000 | 30,000 |

The validation only restricts what can be typed into the sheet; the formulas themselves accept any number, so `calculateRoi` does too (the UI enforces the ranges). Defaults are repeated as assumptions on the Logic sheet: N3 default annual volume 36,000, N4 default monthly salary 30,000.

## Document type → tier — Logic!A1:C12

| Document type | Tier | Allowed models |
|---|---|---|
| Bank Cheques | tier1 | single \| multi |
| Bank Documents | tier1 | single \| multi |
| ID Cards | tier1 | single \| multi |
| KYC Documents | tier1 | single \| multi |
| Invoice | tier2 | single \| multi |
| Bill of Lading | tier2 | single \| multi |
| Packing List | tier2 | single \| multi |
| Purchase Order | tier2 | single \| multi |
| Contract | tier3 | single |
| P&L Statements | tier3 | single |
| Cashflow Statements | tier3 | single |

Column C ("Allowed models") is informational; no formula reads it. Tier 3 + Multi is enforced by B10 instead.

## Pricing — Logic!E1:K6

Pages up to 36,000 are covered by the fixed annual cost. Each further page is charged at its band's rate (₹/page). Bands are **cumulative slabs**, like income-tax brackets, not a single rate for the whole volume.

| Pricing key | Fixed annual cost | 36,001–120,000 | 120,001–300,000 | 300,001–500,000 | 500,001–1,000,000 | Above 1,000,000 |
|---|---|---|---|---|---|---|
| tier1\|single | ₹25,000 | 0.07 | 0.06 | 0.05 | 0.04 | 0.03 |
| tier1\|multi | ₹18,000 | 0.05 | 0.04 | 0.03 | 0.02 | 0.01 |
| tier2\|single | ₹36,000 | 0.09 | 0.08 | 0.07 | 0.05 | 0.04 |
| tier2\|multi | ₹27,000 | 0.07 | 0.06 | 0.05 | 0.04 | 0.03 |
| tier3\|single | ₹54,000 | 0.15 | 0.14 | 0.13 | 0.12 | 0.11 |

There is no `tier3|multi` row. The lookup range is E2:K8 (rows 7–8 are empty).

## Constants — Logic!M1:N6

| Assumption | Value | Where it's used |
|---|---|---|
| Pages handled per resource annually | 30,000 | B12 (typed as a literal `30000`, not a reference to N2) |
| Default annual volume | 36,000 | documentation only |
| Default monthly salary (INR) | 30,000 | documentation only |
| Fixed-cost threshold pages | 36,000 | B14 (typed as literal `36000`) |
| Annual plan note | "15% lower; not applied" | documentation only |

**15% annual-plan discount: not applied.** Note in D16: *"The website notes that the Annual Plan is 15% lower priced. The current live calculator logic does not apply that discount to the calculation, so this workbook preserves the same behavior."* The design's footnote "* 15% lesser price in the Annual Plan" is display copy only. We match the sheet.

## Formulas, step by step

| Cell | Name | Plain language | Original formula |
|---|---|---|---|
| E6 | Tier | Look up the document type's tier; blank if not found. Exact match, case-insensitive. | `=IFERROR(VLOOKUP(B6,'Logic & Pricing'!A2:C12,2,FALSE),"")` |
| E7 | Pricing key | Tier, a pipe, then the model in lower case, e.g. `tier1|single`. Blank tier gives `|single`. | `=E6&"|"&LOWER(B7)` |
| E8 | Fixed annual cost | Look up column 2 for the key; 0 if not found. | `=IFERROR(VLOOKUP(E7,'Logic & Pricing'!E2:K8,2,FALSE),0)` |
| E9 | Rate 36,001–120,000 | Column 3; 0 if not found. | `=IFERROR(VLOOKUP(E7,'Logic & Pricing'!E2:K8,3,FALSE),0)` |
| E10 | Rate 120,001–300,000 | Column 4. | `=IFERROR(VLOOKUP(E7,'Logic & Pricing'!E2:K8,4,FALSE),0)` |
| E11 | Rate 300,001–500,000 | Column 5. | `=IFERROR(VLOOKUP(E7,'Logic & Pricing'!E2:K8,5,FALSE),0)` |
| E12 | Rate 500,001–1,000,000 | Column 6. | `=IFERROR(VLOOKUP(E7,'Logic & Pricing'!E2:K8,6,FALSE),0)` |
| E13 | Rate above 1,000,000 | Column 7. | `=IFERROR(VLOOKUP(E7,'Logic & Pricing'!E2:K8,7,FALSE),0)` |
| B10 | Validation | Checked in order: tier 3 with Multi → "Tier 3 supports Single only". Then any blank input, or volume or salary ≤ 0 → "Complete all inputs". Otherwise "Ready". | `=IF(AND(E6="tier3",LOWER(B7)="multi"),"Tier 3 supports Single only",IF(OR(B6="",B7="",B8<=0,B9<=0),"Complete all inputs","Ready"))` |
| B12 | Resources Needed | Volume ÷ 30,000. | `=IF(B10<>"Ready","",B8/30000)` |
| B13 | Monthly Manual Cost | Resources × monthly salary. | `=IF(B10<>"Ready","",B12*B9)` |
| B14 | Annual Cost | Fixed cost plus each slab's pages × its rate. | `=IF(B10<>"Ready","",E8+MAX(MIN(B8,120000)-36000,0)*E9+MAX(MIN(B8,300000)-120000,0)*E10+MAX(MIN(B8,500000)-300000,0)*E11+MAX(MIN(B8,1000000)-500000,0)*E12+MAX(B8-1000000,0)*E13)` |
| B15 | Monthly Cost | Annual cost ÷ 12. | `=IF(B10<>"Ready","",B14/12)` |
| B16 | Net Monthly Savings | Manual cost − platform monthly cost. Can be negative. | `=IF(B10<>"Ready","",B13-B15)` |
| B17 | Annual Savings | Net monthly savings × 12. | `=IF(B10<>"Ready","",B16*12)` |
| B18 | Equivalent Resources | Resources rounded **up** to a whole number. | `=IF(B10<>"Ready","",ROUNDUP(B12,0))` |
| B19 | Payback Months | Monthly cost ÷ manual cost, rounded to 1 decimal; 0 if manual cost is 0. (The name says "payback", but the formula is a cost ratio; we reproduce it as is.) | `=IF(B10<>"Ready","",IF(B13>0,ROUND(B15/B13,1),0))` |

Every output is `""` (blank) unless B10 is "Ready". `calculateRoi` returns `outputs: null` in that case.

## Rounding: formula vs display

| Where | Kind | Handling |
|---|---|---|
| B18 `ROUNDUP(B12,0)` | **In the formula** | `excelRoundUp`: away from zero |
| B19 `ROUND(…,1)` | **In the formula** | `excelRound`: half away from zero (not banker's rounding) |
| E8 `₹#,##0`, E9:E13 `₹0.00` | display only | UI |
| B12 `0.00` | display only (value stays e.g. 0.3333…) | UI |
| B13:B17 `₹#,##0.00` | display only, full precision kept | UI |
| B18 `0`, B19 `0.0` | display only (already rounded) | UI |

Everything else stays at full double precision, so `annualSavings` can be `74999.99999999997` internally. It displays as ₹75,000.00, exactly as the sheet does.

Spreadsheet apps round the value **as displayed to 15 significant digits**. That way binary noise like `0.24999999999999997` rounds as 0.25 → 0.3. Our helpers normalise with `toPrecision(15)` first and shift the decimal point via the string form. Naive `Math.round(x * 10) / 10` is wrong for cases like `1.005` → 2 dp.

## Behaviours worth knowing (all reproduced, all tested)

- **Page first load:** with no document type selected, the status is "Complete all inputs" and outputs are blank. The design shows ₹0 in this state.
- **Tier 3 + Multi:** outputs are blank and the message shows. The UI keeps Multi selectable and shows this message rather than silently switching models.
- **Unknown document type:** the tier is blank, the key `|single` finds nothing, and the cost is 0, yet the status is **Ready**. So savings equal the full manual cost. The UI only offers the 11 valid types, so users can't reach this.
- **Negative savings:** e.g. Bank Cheques, Single, 3,000 pages, ₹5,000 → net monthly savings −₹1,583.33, payback 4.2.
- **Lookups are case-insensitive** (VLOOKUP behaviour), so `"invoice"` matches `Invoice`.
- **Volumes off the step list** (e.g. 36,001, 1,000,001) still compute. They're used to test band edges.

## Verification

`npm run roi:fixtures` regenerates **1,208 cases**. 64 named cases cover:
- the sheet default and the page's first load
- each of the 11 document types × 2 models
- every band boundary (36,000/36,001, 120,000/120,001, 300,000/300,001, 500,000/500,001, 1,000,000/1,000,001) for three pricing keys
- zero, negative, minimum and maximum inputs
- the x.x5 rounding tie, a decimal salary and an unknown document type

The other 1,144 cases are a full grid: every document × model × volume step × salaries of ₹5,000, ₹30,000, ₹73,000 and ₹2,00,000.

`npm test`: **68 tests, all passing, with exact equality** (no tolerance). A one-digit change to any rate makes them fail; this was checked.

Sample side-by-side for the process doc (sheet value = formulas engine on the workbook):

| Inputs | Output | Sheet | Ours |
|---|---|---|---|
| Bank Cheques · Single · 36,000 · ₹30,000 | Net monthly savings / Annual savings / Equivalent resources | ₹33,916.67 / ₹4,07,000.00 / 2 | ₹33,916.67 / ₹4,07,000.00 / 2 |
| Invoice · Single · 1,000,000 · ₹2,00,000 | " | ₹66,58,586.67 / ₹7,99,03,040.00 / 34 | ₹66,58,586.67 / ₹7,99,03,040.00 / 34 |
| Bank Cheques · Single · 3,000 · ₹5,000 | " | −₹1,583.33 / −₹19,000.00 / 1 | −₹1,583.33 / −₹19,000.00 / 1 |
| Contract · Multi · any | status | Tier 3 supports Single only | Tier 3 supports Single only |

Still to do: repeat three of these in the **live Google Sheet** and add screenshots to the process doc.
