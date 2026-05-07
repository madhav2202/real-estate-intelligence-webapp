#!/usr/bin/env python3

import csv
import json
import math
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


SOURCE = Path("/Users/madhavprakash/Downloads/Gurgaon_RE_Intelligence_v2.xlsx")
SUPPLEMENTARY_CSV = Path("/Users/madhavprakash/Documents/Data for Plinth/Scraped data for projects.csv")
OUTPUT_JS = Path("/Users/madhavprakash/Documents/New project/data/projects-data.js")
OUTPUT_JSON = Path("/Users/madhavprakash/Documents/New project/data/projects-data.json")


def parse_xlsx(path: Path):
    with zipfile.ZipFile(path) as zf:
        shared = []
        if "xl/sharedStrings.xml" in zf.namelist():
            root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            for item in root.findall("main:si", NS):
                shared.append("".join(node.text or "" for node in item.iterfind(".//main:t", NS)))

        workbook = ET.fromstring(zf.read("xl/workbook.xml"))
        rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

        def cell_value(cell):
            inline = cell.find("main:is", NS)
            if inline is not None:
                return "".join(node.text or "" for node in inline.iterfind(".//main:t", NS))
            value = cell.find("main:v", NS)
            if value is None:
                return None
            if cell.attrib.get("t") == "s":
                return shared[int(value.text)]
            return value.text

        sheets = {}
        for sheet in workbook.find("main:sheets", NS):
            name = sheet.attrib["name"]
            target = "xl/" + rel_map[sheet.attrib[REL_NS]]
            root = ET.fromstring(zf.read(target))
            rows = []
            for row in root.find("main:sheetData", NS).findall("main:row", NS):
                values = []
                for cell in row.findall("main:c", NS):
                    values.append(cell_value(cell))
                rows.append(values)
            sheets[name] = rows
        return sheets


def rows_to_dicts(rows):
    headers = rows[0]
    items = []
    for row in rows[1:]:
        padded = row + [None] * (len(headers) - len(row))
        items.append({headers[i]: padded[i] for i in range(len(headers))})
    return items


def parse_number(value):
    if value in (None, ""):
        return None
    try:
        num = float(str(value).replace(",", "").strip())
        return int(num) if num.is_integer() else num
    except ValueError:
        return None


def parse_size_range(text):
    if not text:
        return None
    nums = [int(match) for match in re.findall(r"\d+", text)]
    if not nums:
        return None
    return round((min(nums) + max(nums)) / 2)


def split_pipe(text):
    if not text:
        return None
    if "|" in text:
        label, value = [part.strip() for part in text.split("|", 1)]
        return [label, value]
    parts = text.rsplit(" ", 1)
    if len(parts) == 2:
        return [parts[0], parts[1]]
    return [text, "Data pending"]


def build_builder_risk(builder):
    keys = [
        ("delivery_record", "Delivery record"),
        ("financial_leverage", "Financial leverage"),
        ("legal_litigation", "Legal / litigation"),
        ("rera_complaints", "RERA complaints"),
        ("active_load", "Active load"),
        ("cashflow_cover", "Cashflow cover"),
    ]
    rows = [[label, builder.get(key)] for key, label in keys if builder.get(key)]
    if not rows:
        return {"score": "Data pending", "rows": [["Status", "Data pending"]]}

    text = " ".join(str(value).lower() for _, value in rows)
    if any(word in text for word in ["elevated", "open watch", "not visible", "high", "dependent", "mixed"]):
        label = "Needs caution"
    elif any(word in text for word in ["moderate", "watch", "variance", "delay"]):
        label = "Watch closely"
    else:
        label = "Seems ok"
    return {"score": label, "rows": rows}


def auto_comps(project_row, all_projects):
    corridor = project_row.get("corridor")
    stage = project_row.get("stage")
    base_price = parse_number(project_row.get("priceSqft")) or 0
    ranked = []
    for candidate in all_projects:
        if candidate.get("code") == project_row.get("code"):
            continue
        candidate_price = parse_number(candidate.get("priceSqft"))
        if not candidate_price:
            continue
        score = 0
        if candidate.get("corridor") == corridor:
            score += 3
        if candidate.get("stage") == stage:
            score += 2
        score -= abs(candidate_price - base_price) / 10000 if base_price else 0
        ranked.append((score, candidate))
    ranked.sort(key=lambda item: item[0], reverse=True)
    return ranked[:3]


def derive_score_label(score):
    if score == "Data pending":
        return None
    if score == "Seems ok":
        return "8.1/10"
    if score == "Watch closely":
        return "6.4/10"
    if score == "Needs caution":
        return "4.9/10"
    return "5.5/10"


def slugify(text):
    if not text:
        return ""
    value = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return value


def read_csv_rows(path: Path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize_tokens(text, generic=False):
    text = (text or "").lower().replace("&", "and")
    text = re.sub(r"\(.*?\)", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    base_stop = {
        "phase",
        "ii",
        "iii",
        "iv",
        "v",
        "at",
        "the",
        "residences",
        "residence",
        "project",
        "in",
        "gurugram",
        "gurgaon",
        "tower",
        "towers",
        "sector",
    }
    generic_stop = {
        "estate",
        "estates",
        "homes",
        "city",
        "one",
    }
    stop = base_stop | (generic_stop if generic else set())
    return [token for token in text.split() if token not in stop]


def normalize_developer(text):
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    stop = {
        "limited",
        "ltd",
        "private",
        "properties",
        "property",
        "developers",
        "developer",
        "infrastructure",
        "infrsatructure",
        "realty",
        "housing",
        "india",
        "advance",
        "projects",
        "project",
        "group",
        "pvt",
        "llp",
    }
    return {token for token in text.split() if token not in stop}


def normalize_sector(text):
    text = (text or "").lower()
    match = re.search(r"sector[\s\-]*([0-9]+[a-z]?)", text)
    if match:
        return match.group(1)
    return text.replace("sector", "").replace("-", "").strip()


def similarity(a, b):
    a_set = set(normalize_tokens(a, generic=True))
    b_set = set(normalize_tokens(b, generic=True))
    if not a_set or not b_set:
        return 0
    return len(a_set & b_set) / len(a_set | b_set)


def parse_project_size(text):
    if not text:
        return {"towers": None, "units": None}
    buildings = re.search(r"(\d+)\s+Buildings?", str(text), re.I)
    units = re.search(r"(\d+)\s+units?", str(text), re.I)
    return {
        "towers": parse_number(buildings.group(1)) if buildings else None,
        "units": parse_number(units.group(1)) if units else None,
    }


def clean_measurement(text):
    if not text:
        return ""
    text = str(text).strip()
    text = text.replace("(Acre)", "Acre").replace("acres", "Acre")
    text = text.replace("(Sqr/mtrs)", "sq m")
    return re.sub(r"\s+", " ", text)


def parse_price_text(text):
    if not text:
        return None
    match = re.search(r"(\d[\d,]*)", str(text))
    if not match:
        return None
    return parse_number(match.group(1))


def score_rera_match(project_row, builder, rera_row):
    project_tokens = set(normalize_tokens(project_row.get("name"), generic=True))
    rera_tokens = set(normalize_tokens(rera_row.get("project_name"), generic=True))
    specific_overlap = len(project_tokens & rera_tokens)
    if not specific_overlap:
        return None

    project_sector = normalize_sector(project_row.get("sector"))
    rera_sector = normalize_sector(rera_row.get("project_address") or rera_row.get("sector") or "")
    sector_match = bool(project_sector and rera_sector and project_sector == rera_sector)

    developer_overlap = len(
        normalize_developer(builder.get("builder_name") or project_row.get("builder_code"))
        & normalize_developer(rera_row.get("developer_name"))
    )

    sim = similarity(project_row.get("name"), rera_row.get("project_name"))
    score = specific_overlap * 4 + developer_overlap * 3 + (4 if sector_match else 0) + sim * 5

    # Conservative acceptance: exact-ish project signal plus either developer or sector support.
    if (specific_overlap >= 2 and (developer_overlap >= 1 or sector_match)) or (sim >= 0.72 and developer_overlap >= 1 and sector_match):
        return score
    return None


def build_rera_lookup(project_rows, builders, rera_rows):
    lookup = {}
    for project_row in project_rows:
        builder = builders.get(project_row.get("builder_code"), {})
        candidates = []
        for rera_row in rera_rows:
            score = score_rera_match(project_row, builder, rera_row)
            if score is not None:
                candidates.append((score, rera_row))
        candidates.sort(key=lambda item: item[0], reverse=True)
        if not candidates:
            continue
        top_score, top_row = candidates[0]
        second_score = candidates[1][0] if len(candidates) > 1 else -999
        if top_score - second_score < 1.5 and second_score > 0:
            continue
        lookup[project_row.get("code")] = top_row
    return lookup


def build_rera_details(row):
    project_size = parse_project_size(row.get("project_size"))
    total_units = parse_number(row.get("total_units")) or project_size["units"]
    current_price = parse_price_text(row.get("current_price")) or parse_price_text(row.get("launch_price"))
    launch_price = parse_price_text(row.get("launch_price"))
    return {
        "reraProjectName": row.get("project_name") or "",
        "reraRegistrationNo": row.get("rera_registration_no") or "",
        "projectAddress": row.get("project_address") or "",
        "landArea": clean_measurement(row.get("land_area")),
        "totalLicensedLand": clean_measurement(row.get("total_licensed_land")),
        "totalTowers": project_size["towers"],
        "totalUnits": total_units,
        "unitsSold": parse_number(row.get("units_sold")),
        "unitsAvailable": parse_number(row.get("units_available")),
        "totalFloors": parse_number(row.get("total_floors")),
        "launchPrice": launch_price,
        "currentPrice": current_price,
        "configurations": row.get("configurations") or "",
        "sizes": row.get("sizes") or "",
        "projectType": row.get("project_type") or "",
        "projectSizeText": row.get("project_size") or "",
        "startDate": row.get("start_date") or "",
        "completionDate": row.get("completion_date") or "",
        "sourceUrl": row.get("source_url") or "",
    }


def main():
    sheets = parse_xlsx(SOURCE)
    builders = {row["builder_code"]: row for row in rows_to_dicts(sheets["builders"])}
    project_rows = rows_to_dicts(sheets["projects"])
    rera_rows = read_csv_rows(SUPPLEMENTARY_CSV)
    rera_lookup = build_rera_lookup(project_rows, builders, rera_rows)

    approvals_map = {}
    for row in rows_to_dicts(sheets["approvals"]):
        approvals_map.setdefault(row["project_code"], []).append(
            [row["item"], row["status"] or "Data pending"]
        )

    tracker_rows = rows_to_dicts(sheets["tracker"])
    tracker_map = {}
    for row in tracker_rows:
        tracker_map.setdefault(row["project_code"], {"signal": row["signal"] or "Data pending", "rows": []})
        tracker_map[row["project_code"]]["rows"].append([row["item"], row["value"] or "Data pending"])

    location_map = {}
    for row in rows_to_dicts(sheets["location_intel"]):
        location_map[row["project_code"]] = {
            "score": row.get("location_score") or "Data pending",
            "commute": row.get("commute") or "Data pending",
            "livability": row.get("livability") or "Data pending",
            "connectivity": [split_pipe(row.get(f"connectivity_{i}")) for i in range(1, 4) if row.get(f"connectivity_{i}")],
            "social": [split_pipe(row.get(f"social_{i}")) for i in range(1, 4) if row.get(f"social_{i}")],
            "infra": [split_pipe(row.get(f"infra_{i}")) for i in range(1, 4) if row.get(f"infra_{i}")],
            "risks": [split_pipe(row.get(f"risk_{i}")) for i in range(1, 4) if row.get(f"risk_{i}")],
        }

    comps_rows = rows_to_dicts(sheets["comps"])
    comps_map = {}
    for row in comps_rows:
        if not row.get("project_code"):
            continue
        comps_map.setdefault(row["project_code"], []).append(
            [
                row["comp_name"],
                row["comp_stage"] or "Data pending",
                parse_number(row["comp_price_sqft"]) or 0,
            ]
        )

    projects = []
    for row in project_rows:
        builder = builders.get(row["builder_code"], {})
        price_sqft = parse_number(row.get("priceSqft"))
        price_cr = parse_number(row.get("priceCr"))
        sqft = parse_size_range(row.get("size_range"))
        rera_row = rera_lookup.get(row.get("code"))
        rera_details = build_rera_details(rera_row) if rera_row else {}
        if not price_sqft and rera_details.get("currentPrice"):
            price_sqft = rera_details["currentPrice"]
        project = {
            "code": row.get("code"),
            "name": row.get("name"),
            "slug": slugify(row.get("name") or row.get("code")),
            "developer": builder.get("builder_name") or row.get("builder_code"),
            "builderCode": row.get("builder_code") or "",
            "location": ", ".join(filter(None, [row.get("sector"), row.get("corridor"), "Gurugram"])),
            "sector": row.get("sector") or "",
            "stage": row.get("stage") or "Data pending",
            "possession": row.get("possession") or "Data pending",
            "priceCr": price_cr or 0,
            "sqft": sqft or 0,
            "priceSqft": price_sqft,
            "units": parse_number(row.get("total_units")) or rera_details.get("totalUnits") or 0,
            "launched": parse_number(row.get("launched")) or 0,
            "sold": parse_number(row.get("sold")) or 0,
            "absorption": row.get("absorption") or "Data pending",
            "inventory": row.get("inventory") or "Data pending",
            "bestFor": row.get("bestFor") or "Data pending",
            "image": row.get("image") or "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80",
            "developerRisk": build_builder_risk(builder),
            "approvals": approvals_map.get(row.get("code"), [["Status", "Data pending"]]),
            "tracker": tracker_map.get(row.get("code"), {"signal": "Data pending", "rows": [["Current stage", "Data pending"]]}),
            "comps": comps_map.get(row.get("code"), []),
            "stack": [],
            "locationIntel": location_map.get(
                row.get("code"),
                {
                    "score": "Data pending",
                    "commute": "Data pending",
                    "livability": "Data pending",
                    "connectivity": [],
                    "social": [],
                    "infra": [],
                    "risks": [],
                },
            ),
            "corridor": row.get("corridor") or "",
            "latitude": parse_number(row.get("latitude")),
            "longitude": parse_number(row.get("longitude")),
            "published": str(row.get("published") or "TRUE").strip().upper() != "FALSE",
            "reraNumber": row.get("rera_number") or "",
            "reraPossession": row.get("rera_possession") or "",
            "builderRiskScoreLabel": derive_score_label(build_builder_risk(builder)["score"]),
            "reraDetails": rera_details,
        }
        projects.append(project)

    for project, row in zip(projects, project_rows):
        if not project["comps"]:
            project["comps"] = [
                [candidate["name"], candidate["stage"], parse_number(candidate.get("priceSqft")) or 0]
                for _, candidate in auto_comps(row, project_rows)
            ]
        fair_anchor = 0
        valid_comp_prices = [comp[2] for comp in project["comps"] if comp[2]]
        if valid_comp_prices:
            fair_anchor = round(sum(valid_comp_prices) / len(valid_comp_prices))
        elif project["priceSqft"]:
            fair_anchor = project["priceSqft"]
        project["stack"] = [
            ["Builder price", project["priceSqft"] or 0],
            ["Fair anchor", fair_anchor or 0],
            ["Possession", parse_number(project["reraPossession"]) or 0],
        ]

    public_projects = [project for project in projects if project["published"]]
    OUTPUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JS.write_text("window.__PROJECTS__ = " + json.dumps(public_projects, indent=2) + ";\n")
    OUTPUT_JSON.write_text(json.dumps(public_projects, indent=2) + "\n")
    print(f"Wrote {len(public_projects)} projects to {OUTPUT_JS} and {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
