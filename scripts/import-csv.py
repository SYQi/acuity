#!/usr/bin/env python3
"""Import WH cataract clinical CSV and complications CSV into JSON data files."""

import csv
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Optional

SURGEON_BY_CODE = {
    1: "Dr MJ",
    2: "Dr Amir",
    3: "Dr Elizabeth",
    4: "Dr Vivek",
    5: "Dr Lilian Koh",
    6: "Dr Annie Lai",
    7: "Dr Lim RX",
    8: "Dr Jane Lim",
    9: "Dr Louis Lim",
    10: "Dr James Pan",
    11: "Dr Soh YQ",
    12: "Dr Roy Tan",
    13: "Dr Elton",
}

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = ROOT / "data" / "Anonymized_edYQ270626.csv"
DEFAULT_COMPLICATIONS = ROOT / "data" / "Anonymized Complications_edYQ 300626.csv"
RECORDS_OUT = ROOT / "src" / "lib" / "whCataractRecords.json"
COMPLICATIONS_OUT = ROOT / "src" / "lib" / "whComplicationEvents.json"


def parse_tri(value: Optional[str]) -> Optional[int]:
    text = (value or "").strip()
    if text == "":
        return None
    try:
        number = int(float(text))
    except ValueError:
        return None
    return number if number in (1, 2, 9) else None


def parse_float(value: Optional[str]) -> Optional[float]:
    text = (value or "").strip()
    if text == "":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def parse_surgeon(value: Optional[str]) -> Optional[str]:
    text = (value or "").strip()
    if text == "":
        return None
    try:
        code = int(float(text))
    except ValueError:
        return None
    return SURGEON_BY_CODE.get(code)


def mmyy_to_yymm(value: Optional[str]) -> Optional[str]:
    """Convert complication spreadsheet month (MMYY) to surgical month code (YYMM)."""
    text = (value or "").strip()
    if len(text) != 4 or not text.isdigit():
        return None
    month, year = text[:2], text[2:]
    return f"{year}{month}"


def parse_risk_group(value: Optional[str]) -> Optional[str]:
    text = (value or "").strip()
    if text == "1":
        return "High Risk"
    if text == "2":
        return "Standard Risk"
    return None


def import_clinical_records(src: Path) -> list[dict]:
    records: list[dict] = []
    with open(src, newline="", encoding="utf-8-sig") as handle:
        for index, row in enumerate(csv.DictReader(handle), start=1):
            risk_group = (row.get("Risk Group") or "").strip()
            surgical_month = (row.get("Surgical Month") or "").strip()
            if risk_group not in ("1", "2") or not surgical_month or len(surgical_month) != 4:
                continue

            records.append(
                {
                    "id": f"WH-{index:04d}",
                    "riskGroup": "High Risk" if risk_group == "1" else "Standard Risk",
                    "surgicalMonth": surgical_month,
                    "preOpVa612": parse_tri(row.get("Pre-op VA >= 6/12")),
                    "preOpVa69": parse_tri(row.get("Pre-op VA >= 6/9")),
                    "postOpVa612": parse_tri(row.get("Post-op Month 1 VA>=6/12")),
                    "postOpVa69": parse_tri(row.get("Post-op Month 1 VA>=6/9")),
                    "postOpSe05": parse_tri(row.get("Post-op Month 1 SE within 0.5D")),
                    "postOpSe10": parse_tri(row.get("Post-op Month 1 SE within 1.0D")),
                    "preOpProm": parse_float(row.get("Pre-op PROM")),
                    "postOpProm": parse_float(row.get("Post-op PROM")),
                    "surgeon": parse_surgeon(row.get("Surgeon")),
                }
            )
    return records


def import_complication_events(src: Path) -> list[dict]:
    events: list[dict] = []
    with open(src, newline="", encoding="utf-8-sig") as handle:
        for index, row in enumerate(csv.DictReader(handle), start=1):
            surgical_month = mmyy_to_yymm(row.get("Month"))
            risk_group = parse_risk_group(row.get("Complexity"))
            complication = parse_tri(row.get("Complications") or row.get("Complication"))
            if not surgical_month or not risk_group or complication != 1:
                continue

            events.append(
                {
                    "id": f"COMP-{index:04d}",
                    "surgicalMonth": surgical_month,
                    "riskGroup": risk_group,
                    "surgeon": parse_surgeon(row.get("Surgeon")),
                    "complication": 1,
                }
            )
    return events


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    complications_src = (
        Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_COMPLICATIONS
    )

    records = import_clinical_records(src)
    events = import_complication_events(complications_src) if complications_src.exists() else []

    RECORDS_OUT.write_text(json.dumps(records, indent=2), encoding="utf-8")
    COMPLICATIONS_OUT.write_text(json.dumps(events, indent=2), encoding="utf-8")

    surgeons = Counter(record["surgeon"] for record in records if record["surgeon"])
    event_months = Counter(event["surgicalMonth"] for event in events)

    print(f"Wrote {len(records)} clinical records to {RECORDS_OUT}")
    print(f"Wrote {len(events)} complication events to {COMPLICATIONS_OUT}")
    print(f"Surgeons in clinical data: {dict(sorted(surgeons.items()))}")
    print(f"Complication events by month: {dict(sorted(event_months.items()))}")


if __name__ == "__main__":
    main()
