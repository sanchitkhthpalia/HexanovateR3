"""Generate expected ROI outputs by evaluating the ROI sheet's own formulas.

The expected values used by lib/roi/calculate.test.ts come from here, not from
lib/roi/calculate.ts, so the tests compare our code against the spreadsheet.

The delivered workbook names its second tab "Logic and Pricing" while every
lookup formula points at 'Logic & Pricing'. Excel/IFERROR then silently returns
0 for all prices. We rename the tab in a temporary copy so the formulas resolve
as their author intended; no formula is changed.

Usage (needs Python with `openpyxl` and `formulas` installed):
    python scripts/roi/generate_fixtures.py "docs/ROI Calculator_MarTech Technical_Round 2.xlsx"
Writes lib/roi/__fixtures__/sheet-cases.json.
"""

import json
import os
import sys
import tempfile

import formulas
import openpyxl

SHEET = "ROI CALCULATOR"
INPUT_CELLS = {"documentType": "B6", "model": "B7", "annualVolume": "B8", "monthlySalary": "B9"}
OUTPUT_CELLS = {
    "tier": "E6",
    "pricingKey": "E7",
    "fixedAnnualCost": "E8",
    "rate36kTo120k": "E9",
    "rate120kTo300k": "E10",
    "rate300kTo500k": "E11",
    "rate500kTo1m": "E12",
    "rateAbove1m": "E13",
    "status": "B10",
    "resourcesNeeded": "B12",
    "monthlyManualCost": "B13",
    "annualCost": "B14",
    "monthlyCost": "B15",
    "netMonthlySavings": "B16",
    "annualSavings": "B17",
    "equivalentResources": "B18",
    "paybackMonths": "B19",
}

DOCUMENT_TYPES = [
    "Bank Cheques", "Bank Documents", "ID Cards", "KYC Documents", "Invoice", "Bill of Lading",
    "Packing List", "Purchase Order", "Contract", "P&L Statements", "Cashflow Statements",
]
MODELS = ["Single", "Multi"]
VOLUME_STEPS = [3000, 6000, 10000, 20000, 36000, 60000, 90000, 120000, 200000, 300000, 500000, 750000, 1000000]
BAND_BOUNDARIES = [36000, 36001, 120000, 120001, 300000, 300001, 500000, 500001, 1000000, 1000001]


def named_cases():
    cases = [
        ("sheet default state", "Bank Cheques", "Single", 36000, 30000),
        ("no document type selected (page first load)", "", "Single", 36000, 30000),
        ("tie at x.x5: payback ratio is exactly 0.25 in decimal", "Bank Cheques", "Single", 10000, 25000),
        ("decimal salary", "KYC Documents", "Multi", 90000, 37500.5),
        ("zero volume", "Invoice", "Single", 0, 30000),
        ("zero salary", "Invoice", "Single", 36000, 0),
        ("negative volume", "Invoice", "Single", -5, 30000),
        ("minimum inputs: negative savings", "Bank Cheques", "Single", 3000, 5000),
        ("maximum inputs", "Invoice", "Single", 1000000, 200000),
        ("above maximum volume step", "Invoice", "Single", 1000001, 200000),
        ("tier 3 with Multi is rejected", "Contract", "Multi", 36000, 30000),
        ("unknown document type", "Passport", "Single", 36000, 30000),
    ]
    for doc in DOCUMENT_TYPES:
        for model in MODELS:
            cases.append((f"document type / model: {doc} {model}", doc, model, 200000, 45000))
    for doc, model in [("Bank Cheques", "Single"), ("Invoice", "Multi"), ("Contract", "Single")]:
        for vol in BAND_BOUNDARIES:
            cases.append((f"band boundary {vol} ({doc} {model})", doc, model, vol, 30000))
    return cases


def grid_cases():
    for doc in DOCUMENT_TYPES:
        for model in MODELS:
            for vol in VOLUME_STEPS:
                for salary in [5000, 30000, 73000, 200000]:
                    yield (f"grid {doc} {model} {vol} {salary}", doc, model, vol, salary)


def to_json_value(value):
    # Excel's "" (blank result) and formulas' empty marker both become null.
    if isinstance(value, str):
        return value if value != "" else None
    if value is None or type(value).__name__ in ("XlError", "_EmptyCell", "EmptyCell"):
        return None
    if isinstance(value, bool):
        return value
    number = float(value)
    return int(number) if number.is_integer() and abs(number) < 2**53 else number


def main(src):
    out_path = os.path.join(os.path.dirname(__file__), "..", "..", "lib", "roi", "__fixtures__", "sheet-cases.json")
    with tempfile.TemporaryDirectory() as tmp:
        fixed = os.path.join(tmp, "roi.xlsx")
        wb = openpyxl.load_workbook(src)
        wb["Logic and Pricing"].title = "Logic & Pricing"
        wb.save(fixed)

        model = formulas.ExcelModel().loads(fixed).finish()
        ref = lambda cell: f"'[roi.xlsx]{SHEET}'!{cell}"
        outputs = [ref(c) for c in OUTPUT_CELLS.values()]

        results = []
        for group, cases in (("named", named_cases()), ("grid", grid_cases())):
            for name, doc, mdl, vol, sal in cases:
                values = {"documentType": doc, "model": mdl, "annualVolume": vol, "monthlySalary": sal}
                inputs = {ref(INPUT_CELLS[k]): v for k, v in values.items()}
                sol = model.calculate(inputs=inputs, outputs=outputs)
                expected = {}
                for key, cell in OUTPUT_CELLS.items():
                    raw = sol[ref(cell)].value
                    expected[key] = to_json_value(raw.flat[0] if hasattr(raw, "flat") else raw)
                results.append({"group": group, "name": name, "input": values, "expected": expected})

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(
            {
                "source": os.path.basename(src),
                "generatedBy": "scripts/roi/generate_fixtures.py (formulas engine evaluating the sheet's cell formulas)",
                "cases": results,
            },
            f,
            indent=1,
        )
    print(f"wrote {len(results)} cases to {os.path.normpath(out_path)}")


if __name__ == "__main__":
    main(sys.argv[1])
