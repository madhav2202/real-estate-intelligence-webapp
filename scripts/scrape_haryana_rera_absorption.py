#!/usr/bin/env python3
"""
Scrape quarterly unit sales and cumulative absorption from Haryana RERA.

Input CSV:
    project_id
    411
    524

The project_id can be either the numeric Haryana RERA project id ("411") or the
already encoded quarterly page id ("NDEx"). Extra columns are preserved in the
output, so you can include project names from your own dataset.
"""

from __future__ import annotations

import argparse
import base64
import calendar
import csv
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Dict, Iterable, List, Optional, Sequence, Tuple
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup


BASE_URL = "https://haryanarera.gov.in/view_project/quaterly_schedule_preview_open"
REGISTERED_URL = "https://haryanarera.gov.in/admincontrol/registered_projects/2"
CERT_RE = re.compile(r"/view_project/view_certificate/([^\"'>\s]+)")
QUARTERLY_RE = re.compile(r"(https://haryanarera\.gov\.in/assistancecontrol/print_quarterly_schedules/[^'\"),]+)")
QUARTER_RE = re.compile(
    r"Financial Information for quarter ending on\s+"
    r"(?P<date>\d{2}/\d{2}/\d{4})\s*"
    r"(?:\((?P<label>[^)]*)\))?",
    re.IGNORECASE,
)
NUMBER_RE = re.compile(r"-?\d+(?:,\d{2,3})*(?:\.\d+)?|-?\d+(?:\.\d+)?")


@dataclass
class ProjectInput:
    project_id: str
    source_row: Dict[str, str]


@dataclass
class QuarterSale:
    project_id: str
    encoded_project_id: str
    project_name: str
    hrera_project_name: str
    registration_number: str
    quarter_end_date: str
    source_quarter_end_date: str
    quarter_label: str
    quarter_sort_date: datetime
    total_plots: int
    total_apartments: int
    total_garages: int
    plots_sold_upto_registration: int
    apartments_sold_upto_registration: int
    garages_sold_upto_registration: int
    plots_sold_in_quarter: int
    apartments_sold_in_quarter: int
    garages_sold_in_quarter: int
    total_units: int
    sold_upto_registration_units: int
    sold_in_quarter_units: int
    cumulative_sold_units_raw: int = 0
    cumulative_sold_units: int = 0
    cumulative_absorption_pct: str = ""
    capped_at_total_units: str = "false"


def encode_project_id(project_id: str) -> str:
    value = project_id.strip()
    if not value:
        raise ValueError("project_id is blank")
    if value.isdigit():
        return base64.b64encode(value.encode("utf-8")).decode("ascii")
    return value


def decode_project_id(project_id: str) -> str:
    value = project_id.strip()
    if value.isdigit():
        return value
    try:
        decoded = base64.b64decode(value + "===")
        text = decoded.decode("utf-8")
        return text if text.isdigit() else value
    except Exception:
        return value


def decode_base64_int(value: str) -> Optional[int]:
    try:
        decoded = base64.b64decode(value + "===").decode("utf-8")
        return int(decoded)
    except Exception:
        return None


def normalize_cert(value: str) -> str:
    value = re.sub(r"\s+", " ", str(value or "")).strip().upper()
    value = re.sub(r"\s+DATED\s+.*$", "", value)
    return value.replace(" ", "")


def clean_rera(value: object) -> str:
    if value is None:
        return ""
    try:
        if value != value:
            return ""
    except Exception:
        pass
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return ""
    return re.sub(r"\s+", " ", text)


def fetch_html(encoded_project_id: str, timeout: int) -> str:
    url = f"{BASE_URL}/{encoded_project_id}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
        )
    }
    request = Request(url, headers=headers)
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def fetch_url(url: str, timeout: int, data: Optional[Dict[str, str]] = None) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
        )
    }
    body = None
    if data is not None:
        body = urlencode(data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    request = Request(url, data=body, headers=headers)
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def fetch_print_schedule_html(print_schedule_url: str, timeout: int) -> str:
    list_html = fetch_url(print_schedule_url, timeout)
    soup = BeautifulSoup(list_html, "html.parser")
    detail_pages: List[str] = []
    for form in soup.find_all("form"):
        action = form.get("action", "")
        if "quaterly_schedule_preview_open" not in action:
            continue
        payload = {
            input_tag.get("name"): input_tag.get("value", "")
            for input_tag in form.find_all("input")
            if input_tag.get("name")
        }
        detail_pages.append(fetch_url(action, timeout, payload))
    return "\n".join(detail_pages)


def load_registered_rows(timeout: int, html_path: str = "") -> Dict[str, Dict[str, str]]:
    if html_path:
        with open(html_path, encoding="utf-8", errors="replace") as handle:
            html = handle.read()
    else:
        html = fetch_url(REGISTERED_URL, timeout)

    soup = BeautifulSoup(html, "html.parser")
    rows: Dict[str, Dict[str, str]] = {}
    for tr in soup.find_all("tr"):
        cells = [clean_text(td.get_text(" ", strip=True)) for td in tr.find_all(["td", "th"])]
        if not cells:
            continue

        cert_link = ""
        quarterly_link = ""
        for a in tr.find_all("a"):
            cert_match = CERT_RE.search(a.get("href", ""))
            if cert_match:
                cert_link = cert_match.group(1)
            quarterly_match = QUARTERLY_RE.search(str(a))
            if quarterly_match:
                quarterly_link = quarterly_match.group(1)

        cert_cell = ""
        for cell in cells:
            upper = cell.upper()
            if (
                "DATED" in upper
                or upper.startswith("GGM")
                or upper.startswith("HRERA")
                or re.match(r"^[0-9]+\s+OF\s+[0-9]{4}", upper)
            ):
                cert_cell = cell
                break

        if not cert_cell or not cert_link:
            continue

        certificate_id = decode_base64_int(cert_link)
        quarterly_id = ""
        if quarterly_link:
            parts = quarterly_link.rstrip("/").split("/")
            if len(parts) >= 2:
                quarterly_id = str(decode_base64_int(parts[-2]) or "")

        rows[normalize_cert(cert_cell)] = {
            "registered_cert": cert_cell,
            "certificate_id": str(certificate_id or ""),
            "quarterly_id": quarterly_id,
            "quarterly_schedule_url": quarterly_link,
        }
    return rows


def export_projects_from_workbook(workbook: str, sheet: str) -> List[Dict[str, str]]:
    import pandas as pd

    df = pd.read_excel(workbook, sheet_name=sheet)
    projects: List[Dict[str, str]] = []
    for _, row in df.iterrows():
        rera_number = clean_rera(row.get("rera_number"))
        projects.append(
            {
                "plinth_code": str(row.get("code", "")).strip(),
                "project_name": str(row.get("name", "")).strip(),
                "developer": str(row.get("developer", "")).strip(),
                "rera_number": rera_number,
                "master_units": "" if pd.isna(row.get("units")) else str(row.get("units")),
                "slug": str(row.get("slug", "")).strip(),
            }
        )
    return projects


def verify_schedule(project: Dict[str, str], registered_row: Dict[str, str], timeout: int) -> Dict[str, str]:
    out = {
        **project,
        "project_id": registered_row.get("quarterly_id", ""),
        "encoded_project_id": encode_project_id(registered_row.get("quarterly_id", "0"))
        if registered_row.get("quarterly_id")
        else "",
        "mapping_status": "candidate_failed",
        "registration_number": "",
        "hrera_project_name": "",
        "quarter_rows": "0",
        "certificate_id": registered_row.get("certificate_id", ""),
        "quarterly_id": registered_row.get("quarterly_id", ""),
        "quarterly_schedule_url": registered_row.get("quarterly_schedule_url", ""),
        "registered_cert": registered_row.get("registered_cert", ""),
        "notes": "",
    }
    if not registered_row.get("quarterly_schedule_url"):
        out["mapping_status"] = "no_quarterly_link"
        return out

    html = fetch_print_schedule_html(registered_row["quarterly_schedule_url"], timeout)
    sales = parse_project(ProjectInput(out["project_id"] or "0", project), html)
    if not sales:
        out["notes"] = "No quarterly sections found"
        return out

    registration_number = sales[0].registration_number
    expected = normalize_cert(project.get("rera_number", ""))
    actual = normalize_cert(registration_number)
    out.update(
        {
            "mapping_status": "verified" if expected and expected in actual else "candidate_failed",
            "registration_number": registration_number,
            "hrera_project_name": sales[0].hrera_project_name,
            "quarter_rows": str(len(sales)),
            "notes": "" if expected and expected in actual else "quarterly detail registration did not match workbook RERA number",
        }
    )
    return out


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()


def cell_texts(row) -> List[str]:
    return [clean_text(cell.get_text(" ", strip=True)) for cell in row.find_all(["td", "th"])]


def parse_int(value: str) -> int:
    match = NUMBER_RE.search(value.replace(",", ""))
    if not match:
        return 0
    try:
        return int(Decimal(match.group(0)))
    except (InvalidOperation, ValueError):
        return 0


def parse_optional_int(value: object) -> Optional[int]:
    parsed = parse_int(str(value or ""))
    return parsed if parsed > 0 else None


def parse_quarter_end_date(source_date: str) -> datetime:
    day_text, month_text, year_text = source_date.split("/")
    day = int(day_text)
    month = int(month_text)
    year = int(year_text)
    last_day = calendar.monthrange(year, month)[1]
    return datetime(year, month, min(day, last_day))


def parse_project_meta(soup: BeautifulSoup) -> Tuple[str, str]:
    text = clean_text(soup.get_text(" ", strip=True))
    project_name = extract_meta_value(text, "Project Name")
    registration_number = extract_meta_value(text, "Project Registration Number")
    return project_name, registration_number


def extract_meta_value(text: str, label: str) -> str:
    pattern = re.compile(
        rf"{re.escape(label)}\s*:\s*(.*?)(?=\s+Project [A-Z][A-Za-z ]+\s*:|\s+Report Online|\s*$)",
        re.IGNORECASE,
    )
    match = pattern.search(text)
    return clean_text(match.group(1)) if match else ""


def table_has_quarter_heading(table) -> Optional[re.Match]:
    return QUARTER_RE.search(clean_text(table.get_text(" ", strip=True)))


def find_label_value(segment_tables: Sequence, label: str) -> int:
    target = label.lower()
    for table in segment_tables:
        for row in table.find_all("tr"):
            cells = cell_texts(row)
            if len(cells) >= 2 and cells[0].lower() == target:
                return parse_int(cells[1])
    return 0


def sum_sold_table(segment_tables: Sequence, heading: str) -> int:
    target = heading.lower()
    for table in segment_tables:
        rows = [cell_texts(row) for row in table.find_all("tr")]
        if not rows:
            continue
        header = rows[0]
        if len(header) >= 3 and header[-1].lower() == target:
            return sum(parse_int(row[-1]) for row in rows[1:] if len(row) >= 3)
    return 0


def parse_project(project: ProjectInput, html: str) -> List[QuarterSale]:
    encoded_project_id = encode_project_id(project.project_id)
    numeric_project_id = decode_project_id(project.project_id)
    soup = BeautifulSoup(html, "html.parser")
    project_name, registration_number = parse_project_meta(soup)

    all_tables = soup.find_all("table")
    quarter_indexes: List[Tuple[int, re.Match]] = []
    for index, table in enumerate(all_tables):
        match = table_has_quarter_heading(table)
        if match:
            quarter_indexes.append((index, match))

    sales: List[QuarterSale] = []
    for position, (start_index, match) in enumerate(quarter_indexes):
        end_index = quarter_indexes[position + 1][0] if position + 1 < len(quarter_indexes) else len(all_tables)
        segment_tables = all_tables[start_index + 1 : end_index]
        source_quarter_date = match.group("date")
        quarter_end = parse_quarter_end_date(source_quarter_date)

        total_plots = find_label_value(segment_tables, "Total Plots in the colony")
        total_apartments = find_label_value(segment_tables, "Total Apartments in the colony")
        total_garages = find_label_value(segment_tables, "Total Garages in the colony")

        plots_upto = find_label_value(segment_tables, "Plots sold upto the date of Registration")
        apartments_upto = find_label_value(segment_tables, "Apartments sold upto the date of Registration")
        garages_upto = find_label_value(segment_tables, "Garages sold upto the date of Registration")

        plots_quarter = sum_sold_table(segment_tables, "Plots Sold in the Quarter")
        apartments_quarter = sum_sold_table(segment_tables, "Apartments Sold in the Quarter")
        garages_quarter = sum_sold_table(segment_tables, "Garages Sold in the Quarter")

        total_units = total_plots + total_apartments
        sold_upto_registration_units = plots_upto + apartments_upto
        sold_in_quarter_units = plots_quarter + apartments_quarter

        sales.append(
            QuarterSale(
                project_id=numeric_project_id,
                encoded_project_id=encoded_project_id,
                project_name=project.source_row.get("project_name") or project_name,
                hrera_project_name=project_name,
                registration_number=registration_number,
                quarter_end_date=quarter_end.strftime("%Y-%m-%d"),
                source_quarter_end_date=source_quarter_date,
                quarter_label=clean_text(match.group("label") or ""),
                quarter_sort_date=quarter_end,
                total_plots=total_plots,
                total_apartments=total_apartments,
                total_garages=total_garages,
                plots_sold_upto_registration=plots_upto,
                apartments_sold_upto_registration=apartments_upto,
                garages_sold_upto_registration=garages_upto,
                plots_sold_in_quarter=plots_quarter,
                apartments_sold_in_quarter=apartments_quarter,
                garages_sold_in_quarter=garages_quarter,
                total_units=total_units,
                sold_upto_registration_units=sold_upto_registration_units,
                sold_in_quarter_units=sold_in_quarter_units,
            )
        )

    return sorted(sales, key=lambda item: item.quarter_sort_date)


def add_cumulative_absorption(
    sales: List[QuarterSale],
    cap_at_total_units: bool,
    total_units_override: Optional[int] = None,
) -> List[QuarterSale]:
    if not sales:
        return sales

    stable_total_units = total_units_override or max(sale.total_units for sale in sales)
    baseline = next(
        (sale.sold_upto_registration_units for sale in sales if sale.sold_upto_registration_units > 0),
        0,
    )
    running = baseline

    for sale in sales:
        sale.total_units = stable_total_units
        sale.sold_upto_registration_units = baseline
        running += sale.sold_in_quarter_units
        sale.cumulative_sold_units_raw = running

        if cap_at_total_units and sale.total_units and running > sale.total_units:
            sale.cumulative_sold_units = sale.total_units
            sale.capped_at_total_units = "true"
        else:
            sale.cumulative_sold_units = running

        if sale.total_units:
            pct = (Decimal(sale.cumulative_sold_units) / Decimal(sale.total_units)) * Decimal("100")
            sale.cumulative_absorption_pct = f"{pct.quantize(Decimal('0.01'))}%"
        else:
            sale.cumulative_absorption_pct = ""

    return sales


def read_projects(path: str, project_id_column: str, limit: Optional[int]) -> List[ProjectInput]:
    with open(path, newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"{path} has no CSV header")
        if project_id_column not in reader.fieldnames:
            raise ValueError(f"{path} must contain a '{project_id_column}' column")
        projects = [
            ProjectInput(row[project_id_column].strip(), row)
            for row in reader
            if row.get(project_id_column, "").strip()
        ]
    return projects[:limit] if limit else projects


def output_fields(extra_fields: Iterable[str]) -> List[str]:
    base_fields = [
        "project_id",
        "encoded_project_id",
        "project_name",
        "hrera_project_name",
        "registration_number",
        "quarter_end_date",
        "source_quarter_end_date",
        "quarter_label",
        "total_units",
        "total_plots",
        "total_apartments",
        "total_garages",
        "sold_upto_registration_units",
        "sold_in_quarter_units",
        "plots_sold_in_quarter",
        "apartments_sold_in_quarter",
        "garages_sold_in_quarter",
        "cumulative_sold_units",
        "cumulative_absorption_pct",
        "cumulative_sold_units_raw",
        "capped_at_total_units",
    ]
    return base_fields + [field for field in extra_fields if field not in base_fields]


def sale_to_row(sale: QuarterSale, source_row: Dict[str, str]) -> Dict[str, str]:
    row = {
        field: value
        for field, value in sale.__dict__.items()
        if field != "quarter_sort_date"
    }
    row.update({key: value for key, value in source_row.items() if key not in row})
    return row


def scrape_projects(args: argparse.Namespace) -> Tuple[List[Dict[str, str]], int]:
    projects = read_projects(args.input, args.project_id_column, args.limit)
    output_rows: List[Dict[str, str]] = []
    failures = 0

    for index, project in enumerate(projects, start=1):
        encoded_project_id = encode_project_id(project.project_id)
        print(f"[{index}/{len(projects)}] Fetching project {project.project_id} ({encoded_project_id})", file=sys.stderr)
        try:
            if project.source_row.get("quarterly_schedule_url"):
                html = fetch_print_schedule_html(project.source_row["quarterly_schedule_url"], args.timeout)
            else:
                html = fetch_html(encoded_project_id, args.timeout)
            sales = parse_project(project, html)
            master_total_units = parse_optional_int(project.source_row.get("master_units"))
            sales = add_cumulative_absorption(
                sales,
                cap_at_total_units=not args.no_cap,
                total_units_override=master_total_units,
            )
            if not sales:
                failures += 1
                print(f"  No quarterly sections found for {project.project_id}", file=sys.stderr)
            for sale in sales:
                output_rows.append(sale_to_row(sale, project.source_row))
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            failures += 1
            print(f"  Failed: {exc}", file=sys.stderr)

        if args.delay and index < len(projects):
            time.sleep(args.delay)

    return output_rows, failures


def write_csv(path: str, rows: List[Dict[str, str]], fieldnames: Optional[List[str]] = None) -> None:
    with open(path, "w", newline="", encoding="utf-8") as handle:
        names = fieldnames or (list(rows[0].keys()) if rows else [])
        writer = csv.DictWriter(handle, fieldnames=names, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def run_workbook_pipeline(args: argparse.Namespace) -> int:
    projects = export_projects_from_workbook(args.workbook, args.sheet)
    registered = load_registered_rows(args.timeout, args.registered_html)

    map_rows: List[Dict[str, str]] = []
    verified_inputs: List[Dict[str, str]] = []
    for index, project in enumerate(projects, start=1):
        if not project.get("rera_number"):
            map_rows.append({**project, "mapping_status": "missing_rera_number", "notes": ""})
            continue

        registered_row = registered.get(normalize_cert(project["rera_number"]))
        if not registered_row:
            map_rows.append({**project, "mapping_status": "not_found_in_registered_projects", "notes": ""})
            continue

        print(f"[map {index}/{len(projects)}] {project['project_name']}", file=sys.stderr)
        try:
            mapped = verify_schedule(project, registered_row, args.timeout)
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            mapped = {
                **project,
                "mapping_status": "candidate_failed",
                "certificate_id": registered_row.get("certificate_id", ""),
                "quarterly_id": registered_row.get("quarterly_id", ""),
                "quarterly_schedule_url": registered_row.get("quarterly_schedule_url", ""),
                "registered_cert": registered_row.get("registered_cert", ""),
                "notes": f"{type(exc).__name__}: {exc}",
            }
        map_rows.append(mapped)
        if mapped.get("mapping_status") == "verified":
            verified_inputs.append(mapped)

    map_path = f"{args.output_prefix}_quarterly_id_map.csv"
    write_csv(map_path, map_rows)

    input_path = f"{args.output_prefix}_verified_project_inputs.csv"
    verified_fields = [
        "project_id",
        "project_name",
        "plinth_code",
        "developer",
        "rera_number",
        "master_units",
        "slug",
        "quarterly_schedule_url",
        "hrera_project_name",
    ]
    write_csv(input_path, verified_inputs, verified_fields)

    scrape_args = argparse.Namespace(
        input=input_path,
        output=f"{args.output_prefix}_absorption_full.csv",
        project_id_column="project_id",
        delay=args.delay,
        timeout=args.timeout,
        limit=None,
        no_cap=args.no_cap,
    )
    rows, failures = scrape_projects(scrape_args)
    write_csv(scrape_args.output, rows, output_fields(rows[0].keys() if rows else []))

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
    slim_rows = [{field: row.get(field, "") for field in slim_fields} for row in rows]
    write_csv(f"{args.output_prefix}_cumulative_absorption_percentages.csv", slim_rows, slim_fields)

    latest_by_project: Dict[str, Dict[str, str]] = {}
    for row in rows:
        key = row.get("plinth_code") or row.get("project_id", "")
        current = latest_by_project.get(key)
        if not current or row.get("quarter_end_date", "") > current.get("quarter_end_date", ""):
            latest_by_project[key] = {field: row.get(field, "") for field in slim_fields}
    write_csv(f"{args.output_prefix}_latest_absorption_summary.csv", list(latest_by_project.values()), slim_fields)

    gap_rows = [row for row in map_rows if row.get("mapping_status") != "verified"]
    write_csv(f"{args.output_prefix}_scrape_gaps.csv", gap_rows)

    print(
        f"Wrote {len(rows)} quarterly rows for {len(verified_inputs)} verified projects. "
        f"Gaps: {len(gap_rows)}. Scrape failures: {failures}.",
        file=sys.stderr,
    )
    return 1 if failures else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scrape Haryana RERA quarterly units sold and cumulative absorption."
    )
    parser.add_argument("--input", help="CSV containing project ids.")
    parser.add_argument("--output", help="Output CSV path.")
    parser.add_argument("--workbook", help="Run the full Plinth workbook pipeline from an .xlsx file.")
    parser.add_argument("--output-prefix", default="outputs/plinth", help="Prefix for workbook pipeline outputs.")
    parser.add_argument("--sheet", default="Plinth Master (140 Projects)", help="Workbook sheet name.")
    parser.add_argument("--registered-html", default="", help="Optional cached HRERA registered-project HTML.")
    parser.add_argument("--project-id-column", default="project_id", help="Project id column name.")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between projects in seconds.")
    parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    parser.add_argument("--limit", type=int, help="Optional project limit for test runs.")
    parser.add_argument(
        "--no-cap",
        action="store_true",
        help="Do not cap cumulative sold units at total units when the source page repeats old sales.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.workbook:
        return run_workbook_pipeline(args)
    if not args.input or not args.output:
        parser.error("--input and --output are required unless --workbook is used")
    rows, failures = scrape_projects(args)

    with open(args.output, "w", newline="", encoding="utf-8") as handle:
        fieldnames = output_fields(rows[0].keys() if rows else [])
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} quarterly rows to {args.output}", file=sys.stderr)
    if failures:
        print(f"Completed with {failures} project failure(s).", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
