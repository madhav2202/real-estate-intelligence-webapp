import csv
import json
from collections import OrderedDict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_JSON = ROOT / "data" / "projects-data.json"
OUT_CSV = ROOT / "analysis" / "project_gap_matrix.csv"
OUT_MD = ROOT / "analysis" / "project_gap_matrix.md"


FIELD_SPECS = OrderedDict(
    [
        ("priceSqft", ("Builder current sale price", "Current dataset / builder / RERA / ReraTracker", "dynamic")),
        ("reraNumber", ("RERA registration number", "HRERA / ReraTracker", "stable")),
        ("reraPossession", ("RERA possession date", "HRERA / ReraTracker", "stable")),
        ("absorption", ("Absorption", "HRERA quarterly / ReraTracker / manual proxy", "dynamic")),
        ("inventory", ("Inventory signal", "HRERA quarterly / manual / CP intel", "dynamic")),
        ("reraDetails.landArea", ("Land area", "HRERA / ReraTracker", "stable")),
        ("reraDetails.totalLicensedLand", ("Licensed land", "HRERA / ReraTracker", "stable")),
        ("reraDetails.totalTowers", ("Total towers", "HRERA / ReraTracker", "stable")),
        ("reraDetails.totalUnits", ("Total units", "HRERA / ReraTracker", "stable")),
        ("reraDetails.unitsSold", ("Units sold", "HRERA quarterly / ReraTracker", "dynamic")),
        ("reraDetails.unitsAvailable", ("Units available", "HRERA quarterly / ReraTracker", "dynamic")),
        ("reraDetails.totalFloors", ("Total floors", "HRERA / ReraTracker", "stable")),
        ("reraDetails.launchPrice", ("Launch price", "ReraTracker / builder / archived sheets", "dynamic")),
        ("reraDetails.currentPrice", ("Current price", "ReraTracker / builder / current rate sheet", "dynamic")),
        ("reraDetails.configurations", ("Configurations", "HRERA / ReraTracker", "stable")),
        ("reraDetails.sizes", ("Size range", "HRERA / ReraTracker", "stable")),
        ("reraDetails.startDate", ("Start date", "HRERA / ReraTracker", "stable")),
        ("reraDetails.completionDate", ("Completion date", "HRERA / ReraTracker", "stable")),
        ("reraDetails.sourceUrl", ("ReraTracker source URL", "ReraTracker", "stable")),
        ("locationIntel.score", ("Location score", "Derived internally", "derived")),
        ("locationIntel.commute", ("Commute summary", "Derived internally", "derived")),
        ("locationIntel.livability", ("Livability summary", "Derived internally", "derived")),
        ("developerRisk.score", ("Builder risk score", "Derived from builder diligence / listed filings / complaints", "derived")),
        ("tracker.signal", ("Construction / launch signal", "HRERA quarterly / manual ops", "dynamic")),
    ]
)


def load_projects():
    return json.loads(DATA_JSON.read_text())


def get_nested(record, path):
    cur = record
    for part in path.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur


def present(value):
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() not in ("", "Data pending")
    if isinstance(value, (list, tuple, set, dict)):
        return len(value) > 0 and value not in ({}, [])
    if isinstance(value, (int, float)):
        return True
    return bool(value)


def row_status(project):
    row = {
        "code": project.get("code", ""),
        "name": project.get("name", ""),
        "developer": project.get("developer", ""),
        "corridor": project.get("corridor", ""),
        "stage": project.get("stage", ""),
    }
    missing = 0
    for path in FIELD_SPECS:
        value = get_nested(project, path)
        ok = present(value)
        row[path] = "present" if ok else "missing"
        missing += 0 if ok else 1
    row["missing_count"] = missing
    return row


def write_csv(rows):
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fields = list(rows[0].keys())
    with OUT_CSV.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def build_markdown(projects, rows):
    total = len(projects)
    coverage_lines = []
    coverage_map = {}
    for path, (label, source, mode) in FIELD_SPECS.items():
        present_count = sum(1 for project in projects if present(get_nested(project, path)))
        coverage_lines.append((label, path, present_count, total - present_count, source, mode))
        coverage_map[path] = (present_count, total - present_count)

    most_gap = sorted(rows, key=lambda row: row["missing_count"], reverse=True)[:20]

    lines = [
        "# PropSpot Plinth Data Gap Matrix",
        "",
        f"Total live projects audited: **{total}**",
        "",
        "## Coverage Summary",
        "",
        "| Field | Key | Present | Missing | Best source to fill | Field type |",
        "| --- | --- | ---: | ---: | --- | --- |",
    ]
    for label, path, present_count, missing_count, source, mode in coverage_lines:
        lines.append(f"| {label} | `{path}` | {present_count} | {missing_count} | {source} | {mode} |")

    lines.extend(
        [
            "",
            "## Top Gaps Right Now",
            "",
            "These are the fields with the weakest current coverage across the live universe:",
            "",
            f"- `absorption`: {coverage_map['absorption'][0]}/{total}",
            f"- `inventory`: {coverage_map['inventory'][0]}/{total}",
            f"- `developerRisk.score`: {coverage_map['developerRisk.score'][0]}/{total}",
            f"- `locationIntel.score`, `locationIntel.commute`, `locationIntel.livability`: {coverage_map['locationIntel.score'][0]}/{total}",
            f"- `tracker.signal`: {coverage_map['tracker.signal'][0]}/{total}",
            f"- `reraNumber`: {coverage_map['reraNumber'][0]}/{total}",
            f"- `reraPossession`: {coverage_map['reraPossession'][0]}/{total}",
            f"- `reraDetails.unitsSold`: {coverage_map['reraDetails.unitsSold'][0]}/{total}",
            f"- `reraDetails.unitsAvailable`: {coverage_map['reraDetails.unitsAvailable'][0]}/{total}",
            f"- `reraDetails.launchPrice`: {coverage_map['reraDetails.launchPrice'][0]}/{total}",
            f"- `reraDetails.currentPrice`: {coverage_map['reraDetails.currentPrice'][0]}/{total}",
            "",
            "## Most Gap-Heavy Projects",
            "",
            "| Code | Project | Missing tracked fields |",
            "| --- | --- | ---: |",
        ]
    )
    for row in most_gap:
        lines.append(f"| `{row['code']}` | {row['name']} | {row['missing_count']} |")

    lines.extend(
        [
            "",
            "## Recommended Fill Strategy",
            "",
            "### Fill from official / semi-official online sources first",
            "- HRERA registered project pages",
            "- HRERA quarterly progress pages",
            "- ReraTracker project pages",
            "- official investor relations pages for listed builders",
            "",
            "### Keep manual / internal overrides for the messy layers",
            "- CP-specific offers",
            "- payment-plan economics",
            "- real-time inventory nuance",
            "- subjective builder commentary",
            "",
            "### Treat these as derived, not scraped",
            "- PropSpot Score",
            "- Fair Entry",
            "- Complaint intensity",
            "- Financial stress summary",
            "- Location score / commute / livability summary",
        ]
    )

    OUT_MD.write_text("\n".join(lines) + "\n")


def main():
    projects = load_projects()
    rows = [row_status(project) for project in projects]
    write_csv(rows)
    build_markdown(projects, rows)
    print(f"Wrote {OUT_CSV}")
    print(f"Wrote {OUT_MD}")


if __name__ == "__main__":
    main()
