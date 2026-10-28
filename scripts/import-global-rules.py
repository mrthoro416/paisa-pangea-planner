"""Offline canonical workbook import. Run from project root with workbook path."""
import hashlib
import json
import sys
from pathlib import Path
import openpyxl

source = Path(sys.argv[1])
book = openpyxl.load_workbook(source, read_only=True, data_only=True)

def table(sheet, first_column):
    header = None
    result = []
    for row in book[sheet].iter_rows(values_only=True):
        if row and row[0] == first_column:
            header = list(row)
        elif header and row and row[0] is not None:
            result.append(dict(zip(header, row)))
    return result

rows = table("All Rules", "destination_iso2")
passports = table("Passports", "passport_code")
records = {f"{r['passport_code']}:{r['destination_iso2']}": r for r in rows}
assert len(records) == len(rows) == 39601, "Duplicate or missing pairs"
assert len(passports) == 199
assert len({r['destination_iso2'] for r in rows}) == 199
categories = {"freedom_of_movement", "visa_free", "eta", "visa_on_arrival", "evisa", "visa_required", "travel_permit_required", "entry_banned", "unknown"}
assert all(r["app_category"] in categories for r in rows)
legacy = json.loads(Path("src/data/visa-matrix.json").read_text())
conflicts = {}
for key, old in legacy["records"].items():
    new = records.get(key)
    if new and (old["entry_permission"] != new["app_category"] or old["max_stay_days"] != new["max_stay_days"]):
        conflicts[key] = old
data = {
    "workbook": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "attribution": "TravelRequirements.info — Entry Requirements Dataset v1.3.0, AXG Sp. z o.o., https://travelrequirements.info/data/ (CC BY 4.0)",
    "modified": "2026-10-22", "passports": passports, "records": records,
    "sources": table("Sources", "destination_slug"),
    "dictionary": table("Data Dictionary", "Field / raw requirement"),
    "colombian_conflicts": conflicts,
}
Path("src/data/global-travel-rules.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n")
print(f"Imported {len(records)} pairs, {len(data['sources'])} sources, {len(conflicts)} retained Colombian discrepancies")