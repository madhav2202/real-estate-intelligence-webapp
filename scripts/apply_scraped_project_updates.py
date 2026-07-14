#!/usr/bin/env python3

import csv
import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROJECTS_JSON = ROOT / "data" / "projects-data.json"
PROJECTS_JS = ROOT / "data" / "projects-data.js"
RERATRACKER_CSV = ROOT / "data" / "reratracker_refresh.csv"
ABSORPTION_FULL_CSV = ROOT / "outputs" / "plinth_recalc_absorption_full.csv"
ABSORPTION_LATEST_CSV = ROOT / "outputs" / "plinth_recalc_latest_absorption_summary.csv"
ABSORPTION_CUMULATIVE_CSV = ROOT / "outputs" / "plinth_recalc_cumulative_absorption_percentages.csv"


def read_csv(path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path, rows, fieldnames):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def parse_number(value):
    text = str(value or "").replace(",", "").strip()
    if not text:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    if not match:
        return None
    number = float(match.group(0))
    return int(number) if number.is_integer() else number


def parse_units(value):
    number = parse_number(value)
    if number is None or number <= 0 or number > 10000:
        return None
    return int(number)


def parse_floors(value):
    number = parse_number(value)
    if number is None or number <= 0 or number > 100:
        return None
    return int(number)


def clean_text(value):
    return re.sub(r"\s+", " ", str(value or "").strip())


def normalized_url(value):
    return str(value or "").strip().rstrip("/").lower()


def latest_absorption_rows(full_rows):
    slim_fields = [
        "plinth_code",
        "project_name",
        "hrera_project_name",
        "rera_number",
        "registration_number",
        "quarter_end_date",
        "quarter_label",
        "total_units",
        "sold_in_quarter_units",
        "cumulative_sold_units",
        "cumulative_absorption_pct",
        "capped_at_total_units",
    ]
    slim_rows = [{field: row.get(field, "") for field in slim_fields} for row in full_rows]
    latest = {}
    for row in slim_rows:
        key = row.get("plinth_code") or row.get("project_id")
        if not key:
            continue
        current = latest.get(key)
        if not current or row.get("quarter_end_date", "") > current.get("quarter_end_date", ""):
            latest[key] = row
    return slim_fields, slim_rows, list(latest.values())


def rera_row_lookup(rows):
    by_url = {}
    by_name = {}
    for row in rows:
        source_url = normalized_url(row.get("source_url"))
        if source_url:
            by_url[source_url] = row
        name_key = clean_text(row.get("project_name")).lower()
        if name_key:
            by_name[name_key] = row
    return by_url, by_name


def find_rera_row(project, by_url, by_name):
    source_url = normalized_url((project.get("reraDetails") or {}).get("sourceUrl"))
    if source_url and source_url in by_url:
        return by_url[source_url]
    project_name = clean_text(project.get("name")).lower()
    return by_name.get(project_name)


def update_project_from_rera(project, row):
    if not row:
        return False
    changed = False
    rera = project.setdefault("reraDetails", {})

    fields = {
        "reraProjectName": clean_text(row.get("project_name")),
        "reraRegistrationNo": clean_text(row.get("rera_registration_no")),
        "projectAddress": clean_text(row.get("project_address")),
        "landArea": clean_text(row.get("land_area")),
        "totalLicensedLand": clean_text(row.get("total_licensed_land")),
        "configurations": clean_text(row.get("configurations")),
        "sizes": clean_text(row.get("sizes")),
        "projectType": clean_text(row.get("project_type")),
        "projectSizeText": clean_text(row.get("project_size")),
        "startDate": clean_text(row.get("start_date")),
        "completionDate": clean_text(row.get("completion_date")),
        "sourceUrl": clean_text(row.get("source_url")),
    }
    for key, value in fields.items():
        if value and rera.get(key) != value:
            rera[key] = value
            changed = True

    total_units = parse_units(row.get("total_units"))
    if total_units and rera.get("totalUnits") != total_units:
        rera["totalUnits"] = total_units
        project["units"] = total_units
        changed = True

    sold = parse_units(row.get("units_sold"))
    if sold is not None and rera.get("unitsSold") != sold:
        rera["unitsSold"] = sold
        changed = True

    available = parse_units(row.get("units_available"))
    if available is not None and rera.get("unitsAvailable") != available:
        rera["unitsAvailable"] = available
        changed = True

    floors = parse_floors(row.get("total_floors"))
    if floors and rera.get("totalFloors") != floors:
        rera["totalFloors"] = floors
        changed = True

    launch_price = parse_number(row.get("launch_price"))
    if launch_price and rera.get("launchPrice") != launch_price:
        rera["launchPrice"] = launch_price
        changed = True

    current_price = parse_number(row.get("current_price"))
    if current_price and rera.get("currentPrice") != current_price:
        rera["currentPrice"] = current_price
        if not project.get("priceSqft"):
            project["priceSqft"] = current_price
        changed = True

    if not project.get("reraNumber") and rera.get("reraRegistrationNo"):
        project["reraNumber"] = rera["reraRegistrationNo"]
        changed = True
    if not project.get("reraPossession") and rera.get("completionDate"):
        project["reraPossession"] = rera["completionDate"]
        changed = True
    return changed


def update_project_from_absorption(project, row):
    if not row:
        return False
    changed = False
    rera = project.setdefault("reraDetails", {})

    total_units = parse_units(row.get("total_units"))
    sold = parse_units(row.get("cumulative_sold_units"))
    pct = clean_text(row.get("cumulative_absorption_pct"))
    quarter = clean_text(row.get("quarter_label"))
    quarter_end = clean_text(row.get("quarter_end_date"))

    if total_units:
        if project.get("units") != total_units:
            project["units"] = total_units
            changed = True
        if rera.get("totalUnits") != total_units:
            rera["totalUnits"] = total_units
            changed = True
        if project.get("launched") != total_units:
            project["launched"] = total_units
            changed = True

    if sold is not None:
        if project.get("sold") != sold:
            project["sold"] = sold
            changed = True
        if rera.get("unitsSold") != sold:
            rera["unitsSold"] = sold
            changed = True

    if total_units and sold is not None:
        available = max(total_units - sold, 0)
        if rera.get("unitsAvailable") != available:
            rera["unitsAvailable"] = available
            changed = True
        inventory = f"{available} unsold units"
        if project.get("inventory") != inventory:
            project["inventory"] = inventory
            changed = True

    if pct and project.get("absorption") != pct:
        project["absorption"] = pct
        changed = True

    latest = {
        "quarterLabel": quarter,
        "quarterEndDate": quarter_end,
        "soldInQuarter": parse_units(row.get("sold_in_quarter_units")) or 0,
        "cumulativeSold": sold,
        "cumulativeAbsorptionPct": pct,
        "cappedAtTotalUnits": str(row.get("capped_at_total_units", "")).lower() == "true",
        "updatedAt": datetime.utcnow().date().isoformat(),
    }
    if project.get("latestAbsorption") != latest:
        project["latestAbsorption"] = latest
        changed = True
    return changed


def main():
    projects = json.loads(PROJECTS_JSON.read_text())
    full_rows = read_csv(ABSORPTION_FULL_CSV)
    if full_rows:
        slim_fields, slim_rows, latest_rows = latest_absorption_rows(full_rows)
        write_csv(ABSORPTION_CUMULATIVE_CSV, slim_rows, slim_fields)
        write_csv(ABSORPTION_LATEST_CSV, latest_rows, slim_fields)
    else:
        latest_rows = read_csv(ABSORPTION_LATEST_CSV)

    absorption_by_code = {row.get("plinth_code"): row for row in latest_rows if row.get("plinth_code")}
    by_url, by_name = rera_row_lookup(read_csv(RERATRACKER_CSV))

    changed_count = 0
    for project in projects:
        changed = False
        changed |= update_project_from_rera(project, find_rera_row(project, by_url, by_name))
        changed |= update_project_from_absorption(project, absorption_by_code.get(project.get("code")))
        if changed:
            changed_count += 1

    PROJECTS_JSON.write_text(json.dumps(projects, indent=2) + "\n")
    PROJECTS_JS.write_text("window.__PROJECTS__ = " + json.dumps(projects, indent=2) + ";\n")
    print(f"Updated scraped fields for {changed_count} project(s).")


if __name__ == "__main__":
    main()
