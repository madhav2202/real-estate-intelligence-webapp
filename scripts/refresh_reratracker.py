#!/usr/bin/env python3

import csv
import json
import re
import time
from pathlib import Path
from urllib.parse import unquote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
PROJECTS_JSON = ROOT / "data" / "projects-data.json"
ALIASES_JSON = ROOT / "data" / "project_aliases.json"
MANUAL_LINKS_CSV = ROOT / "data" / "manual_source_links.csv"
OUT_CSV = ROOT / "data" / "reratracker_refresh.csv"
OUT_REPORT = ROOT / "analysis" / "reratracker_refresh_report.md"

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36"

FIELDNAMES = [
    "project_name",
    "rera_registration_no",
    "rera_status",
    "source_url",
    "developer_name",
    "developer_address",
    "developer_phone",
    "developer_email",
    "developer_website",
    "developer_cin",
    "developer_pan",
    "plot_no",
    "sector",
    "city",
    "district",
    "state",
    "pin_code",
    "tehsil",
    "project_type",
    "applicant_type",
    "land_area",
    "total_units",
    "units_sold",
    "units_available",
    "project_address",
    "configurations",
    "sizes",
    "project_size",
    "total_floors",
    "launch_price",
    "current_price",
    "density",
    "proposed_far",
    "permissible_far",
    "total_licensed_land",
    "start_date",
    "completion_date",
    "extended_date",
    "total_project_cost",
    "escrow_account",
    "amenities",
    "project_description",
    "other_details",
]


def fetch_text(url: str) -> str:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def load_projects():
    return json.loads(PROJECTS_JSON.read_text())


def load_aliases():
    if not ALIASES_JSON.exists():
        return {}
    return json.loads(ALIASES_JSON.read_text())


def load_manual_links():
    if not MANUAL_LINKS_CSV.exists():
        return {}
    with MANUAL_LINKS_CSV.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    return {row.get("code"): row for row in rows if row.get("code")}


def normalize_tokens(text: str, generic: bool = False):
    text = (text or "").lower().replace("&", "and")
    text = re.sub(r"\(.*?\)", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    base_stop = {"phase", "ii", "iii", "iv", "v", "at", "the", "residences", "residence", "project", "in", "gurugram", "gurgaon", "tower", "towers", "sector"}
    generic_stop = {"estate", "estates", "homes", "city", "one"}
    stop = base_stop | (generic_stop if generic else set())
    return [token for token in text.split() if token not in stop]


def similarity(a, b):
    a_set = set(normalize_tokens(a, generic=True))
    b_set = set(normalize_tokens(b, generic=True))
    if not a_set or not b_set:
        return 0
    return len(a_set & b_set) / len(a_set | b_set)


def normalize_sector(text):
    text = (text or "").lower()
    match = re.search(r"sector[\s\-]*([0-9]+[a-z]?)", text)
    if match:
        return match.group(1)
    return text.replace("sector", "").replace("-", "").strip()


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


def extract_search_results(html: str):
    pattern = re.compile(r'href="(/[^"]*?-rtid\d+)"[^>]*>([^<]+)</a>', re.I)
    seen = set()
    results = []
    for href, title in pattern.findall(html):
        if href in seen:
            continue
        seen.add(href)
        results.append({"href": href, "title": title.strip()})
    return results


def extract_duckduckgo_results(html: str):
    results = []
    seen = set()
    links = re.findall(r'href="(//duckduckgo.com/l/\?uddg=[^"]+)"', html)
    for link in links:
        match = re.search(r"uddg=([^&]+)", link)
        if not match:
            continue
        actual = unquote(match.group(1))
        if "reratracker.com/" not in actual or "/panorama" in actual:
            continue
        if actual in seen:
            continue
        seen.add(actual)
        slug = actual.rstrip("/").split("/")[-1]
        title = slug.replace("-in-gurugram", "").replace("-", " ").replace("rtid", "").strip()
        results.append({"href": actual, "title": title})
    return results


def load_reratracker_universe():
    xml = fetch_text("https://reratracker.com/projects/sitemap.xml")
    urls = re.findall(r"<loc>(https://reratracker\.com/[^<]+)</loc>", xml, re.I)
    results = []
    for url in urls:
        slug = url.rstrip("/").split("/")[-1]
        title = slug
        if "-in-" in title:
            title = title.split("-in-", 1)[0]
        if "-by-" in title:
            title = title.split("-by-", 1)[0]
        title = title.replace("-rtid", " rtid ").replace("-", " ").strip()
        results.append({"href": url, "title": title})
    return results


def candidate_score(project, aliases, candidate):
    names = [project.get("name"), aliases.get("canonicalName"), *(aliases.get("aliases") or [])]
    names = [name for name in names if name]
    candidate_text = candidate["title"]
    similarities = [similarity(name, candidate_text) for name in names]
    overlaps = [
        len(set(normalize_tokens(name, generic=True)) & set(normalize_tokens(candidate_text, generic=True)))
        for name in names
    ]
    best_similarity = max(similarities, default=0)
    best_overlap = max(overlaps, default=0)
    if best_overlap < 2 and best_similarity < 0.55:
        return 0
    score = best_similarity * 10
    sector = normalize_sector(project.get("sector"))
    if sector and sector in candidate["href"].lower():
        score += 2
    developer_tokens = normalize_developer(project.get("developer"))
    href_text = candidate["href"].lower()
    score += min(2, len([token for token in developer_tokens if token in href_text]))
    return score


def extract_value(html: str, key: str, numeric: bool = False):
    if numeric:
        patterns = [
            rf'{key}\\":(null|\d+(?:\.\d+)?)',
            rf'"{key}":(null|\d+(?:\.\d+)?)',
        ]
    else:
        patterns = [
            rf'{key}\\":\\"(.*?)\\"',
            rf'"{key}":"(.*?)"',
        ]
    for pattern in patterns:
        match = re.search(pattern, html, re.I | re.S)
        if match:
            value = match.group(1)
            if value in ("null", "", None):
                return ""
            return value
    return ""


def extract_first_regex(html: str, pattern: str):
    match = re.search(pattern, html, re.I | re.S)
    return match.group(1) if match else ""


def build_row(project, candidate_url, html):
    sector_match = re.search(r"sector[\s\-]*([0-9]+[a-z]?)", project.get("sector", ""), re.I)
    sector_value = sector_match.group(1).upper() if sector_match else ""
    city = "Gurugram"
    district = extract_first_regex(html, r'district\\":\\"(.*?)\\"') or "Gurugram"
    tehsil = extract_first_regex(html, r'tehsil\\":\\"(.*?)\\"')
    project_name = extract_value(html, "project_name") or project.get("name", "")
    rera_no = extract_first_regex(html, r'(RERA-GRG-[0-9-]+|GGM/[0-9/]+)')
    developer_name = extract_first_regex(html, r'developer_name\\":\\"(.*?)\\"') or project.get("developer", "")
    project_address = extract_first_regex(html, r'address\\":\\"(.*?)\\"')
    return {
        "project_name": project_name,
        "rera_registration_no": rera_no,
        "rera_status": "",
        "source_url": candidate_url,
        "developer_name": developer_name,
        "developer_address": "",
        "developer_phone": extract_first_regex(html, r'phone_mobile\\":\\"(.*?)\\"'),
        "developer_email": extract_first_regex(html, r'email\\":\\"(.*?)\\"'),
        "developer_website": "",
        "developer_cin": "",
        "developer_pan": "",
        "plot_no": "",
        "sector": sector_value,
        "city": city,
        "district": district,
        "state": "Haryana",
        "pin_code": "",
        "tehsil": tehsil,
        "project_type": extract_value(html, "project_type"),
        "applicant_type": "",
        "land_area": extract_value(html, "land_area"),
        "total_units": extract_value(html, "total_units", numeric=True),
        "units_sold": extract_value(html, "units_sold", numeric=True),
        "units_available": extract_value(html, "units_available", numeric=True),
        "project_address": project_address,
        "configurations": extract_value(html, "configurations"),
        "sizes": extract_value(html, "sizes"),
        "project_size": extract_value(html, "project_size"),
        "total_floors": extract_value(html, "total_floors", numeric=True),
        "launch_price": extract_value(html, "launch_price", numeric=True),
        "current_price": extract_value(html, "current_price", numeric=True),
        "density": extract_value(html, "density"),
        "proposed_far": extract_value(html, "proposed_FAR"),
        "permissible_far": extract_value(html, "permissible_FAR"),
        "total_licensed_land": extract_value(html, "total_licensed_land"),
        "start_date": extract_value(html, "project_launch_date"),
        "completion_date": extract_value(html, "completion_date"),
        "extended_date": extract_value(html, "extended_date"),
        "total_project_cost": extract_value(html, "total_project_cost"),
        "escrow_account": extract_value(html, "escrow_account"),
        "amenities": "",
        "project_description": "",
        "other_details": "",
    }


def find_best_candidate(project, aliases, universe):
    candidates = []
    for result in universe:
        if "gurugram" not in result["href"].lower():
            continue
        score = candidate_score(project, aliases, result)
        if score >= 4:
            candidates.append((score, result))
    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]


def validate_manual_candidate(project, aliases, url):
    title = url.rstrip("/").split("/")[-1]
    title = title.replace("-in-gurugram", "").replace("-rtid", " rtid ").replace("-", " ").strip()
    candidate = {"href": url, "title": title}
    score = candidate_score(project, aliases, candidate)
    developer_tokens = normalize_developer(project.get("developer"))
    developer_hits = len([token for token in developer_tokens if token in url.lower()])
    return {
        "score": score,
        "developer_hits": developer_hits,
        "title": title,
    }


def main():
    projects = load_projects()
    aliases_map = load_aliases()
    manual_links = load_manual_links()
    universe = load_reratracker_universe()
    rows = []
    matched = []
    unmatched = []
    manual_review = []

    for project in projects:
        aliases = aliases_map.get(project["code"], {})
        manual = manual_links.get(project["code"], {})
        manual_url = (manual.get("manual_source_url") or "").strip()
        manual_notes = (manual.get("notes") or "").strip()
        candidate = None
        if manual_url:
            validation = validate_manual_candidate(project, aliases, manual_url)
            if manual_notes or (validation["score"] < 4 and validation["developer_hits"] == 0):
                manual_review.append(
                    (
                        project["code"],
                        project["name"],
                        manual_url,
                        manual_notes or f"Low confidence manual link (score {validation['score']:.2f})",
                    )
                )
            else:
                candidate = {"href": manual_url, "title": validation["title"]}
        if not candidate:
            candidate = find_best_candidate(project, aliases, universe)
        if not candidate:
            unmatched.append((project["code"], project["name"]))
            continue
        full_url = candidate["href"] if candidate["href"].startswith("http") else f"https://reratracker.com{candidate['href']}"
        html = fetch_text(full_url)
        rows.append(build_row(project, full_url, html))
        matched.append((project["code"], project["name"], full_url))
        time.sleep(0.6)

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)

    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    report_lines = [
        "# ReraTracker Refresh Report",
        "",
        f"Matched projects: **{len(matched)} / {len(projects)}**",
        f"Unmatched projects: **{len(unmatched)} / {len(projects)}**",
        "",
        "## Matched",
        "",
    ]
    for code, name, url in matched:
        report_lines.append(f"- `{code}` {name} -> {url}")
    report_lines.extend(["", "## Unmatched", ""])
    for code, name in unmatched:
        report_lines.append(f"- `{code}` {name}")
    if manual_review:
        report_lines.extend(["", "## Manual Review", ""])
        for code, name, url, reason in manual_review:
            report_lines.append(f"- `{code}` {name} -> {url} ({reason})")
    OUT_REPORT.write_text("\n".join(report_lines) + "\n")

    print(f"Wrote {len(rows)} rows to {OUT_CSV}")
    print(f"Wrote report to {OUT_REPORT}")


if __name__ == "__main__":
    main()
