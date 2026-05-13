#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "data" / "builder_registry.json"
PROJECTS_JSON = ROOT / "data" / "projects-data.json"
OUTPUT_JSON = ROOT / "data" / "builder_intelligence.json"
REPORT_MD = ROOT / "analysis" / "builder_intelligence_report.md"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def fetch_html(url: str) -> str:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def strip_tags(value: str) -> str:
    return re.sub(r"<.*?>", "", value or "").replace("&amp;", "&").strip()


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def parse_ratio_block(html: str, label: str) -> str | None:
    pattern = rf'<span class="name">\s*{re.escape(label)}\s*</span>.*?<span class="nowrap value">(.*?)</span>'
    match = re.search(pattern, html, re.S)
    if not match:
        return None
    text = normalize_spaces(strip_tags(match.group(1)))
    return text or None


def parse_meta_description(html: str) -> dict[str, str]:
    match = re.search(r'<meta name="description" content="([^"]+)"', html)
    if not match:
        return {}
    text = match.group(1)
    result: dict[str, str] = {"summary": text}
    patterns = {
        "marketCap": r"Mkt Cap:\s*([^·]+)",
        "revenue": r"Revenue:\s*([^·]+)",
        "profit": r"Profit:\s*([^·]+)",
        "promoterHolding": r"Promoter Holding:\s*([^·]+)",
    }
    for key, pattern in patterns.items():
        found = re.search(pattern, text)
        if found:
            result[key] = found.group(1).strip()
    return result


def parse_list_section(html: str, title: str) -> list[str]:
    match = re.search(rf'<p class="title">{re.escape(title)}</p>\s*<ul>(.*?)</ul>', html, re.S)
    if not match:
        return []
    return [normalize_spaces(strip_tags(item)) for item in re.findall(r"<li>(.*?)</li>", match.group(1), re.S)]


def parse_percent(value: str | None) -> float | None:
    if not value:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", value.replace(",", ""))
    return float(match.group(0)) if match else None


def parse_number(value: str | None) -> float | None:
    if not value:
        return None
    match = re.search(r"\d+(?:,\d+)*(?:\.\d+)?", value)
    return float(match.group(0).replace(",", "")) if match else None


def baseline_score_for_bucket(bucket: str | None) -> float:
    return {
        "A+": 8.8,
        "A": 8.2,
        "B": 7.4,
        "C": 6.2,
        "Unassigned": 7.0,
        None: 7.0,
    }.get(bucket, 7.0)


def derive_public_signal(score: float) -> str:
    if score >= 8.0:
        return "Seems ok"
    if score >= 6.4:
        return "Watch closely"
    return "Needs caution"


def derive_stress_label(score: float) -> str:
    if score >= 8.0:
        return "Low stress"
    if score >= 6.4:
        return "Moderate stress"
    return "Elevated stress"


def build_listed_intelligence(builder: dict[str, Any], html: str) -> dict[str, Any]:
    meta = parse_meta_description(html)
    pros = parse_list_section(html, "Pros")
    cons = parse_list_section(html, "Cons")
    metrics = {
        "marketCap": meta.get("marketCap"),
        "revenue": meta.get("revenue"),
        "profit": meta.get("profit"),
        "promoterHolding": meta.get("promoterHolding"),
        "currentPrice": parse_ratio_block(html, "Current Price"),
        "highLow": parse_ratio_block(html, "High / Low"),
        "stockPE": parse_ratio_block(html, "Stock P/E"),
        "bookValue": parse_ratio_block(html, "Book Value"),
        "dividendYield": parse_ratio_block(html, "Dividend Yield"),
        "roce": parse_ratio_block(html, "ROCE"),
        "roe": parse_ratio_block(html, "ROE"),
    }

    bucket = builder.get("gradeBucket")
    score = baseline_score_for_bucket(bucket)
    roe = parse_percent(metrics["roe"])
    roce = parse_percent(metrics["roce"])
    promoter = parse_percent(metrics["promoterHolding"])
    cons_blob = " ".join(cons).lower()
    pros_blob = " ".join(pros).lower()

    if roe is not None:
        if roe < 5:
            score -= 0.8
        elif roe >= 12:
            score += 0.3
    if roce is not None:
        if roce < 5:
            score -= 0.6
        elif roce >= 12:
            score += 0.3
    if promoter is not None and promoter >= 50:
        score += 0.2

    negative_flags = [
        "low interest coverage",
        "high debtors",
        "capitalizing the interest cost",
        "decreased over last 3 years",
        "low return on equity",
        "not paying out dividend",
        "trading at",
    ]
    positive_flags = [
        "reduced debt",
        "almost debt free",
        "good profit growth",
        "expected to give good quarter",
        "debt free",
    ]
    score -= sum(0.25 for flag in negative_flags if flag in cons_blob)
    score += sum(0.2 for flag in positive_flags if flag in pros_blob)
    score = max(4.8, min(9.2, round(score, 1)))

    stress = derive_stress_label(score)
    public_signal = derive_public_signal(score)

    finance_signal = "Mixed"
    if "low interest coverage" in cons_blob:
        finance_signal = "Low interest coverage flagged"
    elif "reduced debt" in pros_blob or "almost debt free" in pros_blob or "debt free" in pros_blob:
        finance_signal = "Balance sheet reads lighter"
    elif roe is not None and roce is not None and roe >= 10 and roce >= 10:
        finance_signal = "Core return profile is healthier"

    summary = (
        f"{builder['builderName']} is a listed developer tracked via Screener. "
        f"Current financial read is {stress.lower()} with ROE at {metrics['roe'] or 'n/a'} and ROCE at {metrics['roce'] or 'n/a'}."
    )

    rows = [
        ["Current view", stress],
        ["Builder bucket", f"{bucket} grade" if bucket else "Unassigned"],
        ["Market status", "Listed"],
        ["Market cap", metrics["marketCap"] or "Data pending"],
        ["ROE / ROCE", f"{metrics['roe'] or 'n/a'} / {metrics['roce'] or 'n/a'}"],
        ["Finance signal", finance_signal],
    ]

    return {
        "listed": True,
        "financeProvider": builder.get("financeProvider"),
        "financeUrl": builder.get("financeUrl"),
        "summary": summary,
        "gradeBucket": bucket,
        "financialStress": stress,
        "financialStressScore": score,
        "publicRiskSignal": public_signal,
        "metrics": metrics,
        "pros": pros[:5],
        "cons": cons[:5],
        "rows": rows,
    }


def build_unlisted_intelligence(builder: dict[str, Any]) -> dict[str, Any]:
    bucket = builder.get("gradeBucket")
    score = baseline_score_for_bucket(bucket)
    public_signal = derive_public_signal(score)
    stress = derive_stress_label(score)
    summary = (
        f"{builder['builderName']} does not have a direct listed-company finance summary in the current pipeline. "
        f"For now, Plinth is leaning on the builder bucket and project presence as a proxy rather than public market disclosures."
    )
    rows = [
        ["Current view", stress],
        ["Builder bucket", f"{bucket} grade" if bucket else "Unassigned"],
        ["Market status", "Private / unlisted"],
        ["Finance signal", "Proxy-based read"],
    ]
    return {
        "listed": False,
        "financeProvider": builder.get("financeProvider"),
        "financeUrl": builder.get("financeUrl"),
        "summary": summary,
        "gradeBucket": bucket,
        "financialStress": stress,
        "financialStressScore": round(score, 1),
        "publicRiskSignal": public_signal,
        "metrics": {},
        "pros": [],
        "cons": [],
        "rows": rows,
    }


def build_builder_intelligence(registry: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enriched = []
    for builder in registry:
        if builder.get("listed") and builder.get("financeUrl"):
            html = fetch_html(builder["financeUrl"])
            info = build_listed_intelligence(builder, html)
        else:
            info = build_unlisted_intelligence(builder)
        enriched.append(
            {
                "builderCode": builder["builderCode"],
                "builderName": builder["builderName"],
                **info,
            }
        )
    return enriched


def render_report(builders: list[dict[str, Any]], project_map: dict[str, list[str]]) -> str:
    lines = [
        "# Builder Intelligence Report",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        f"Builders covered: {len(builders)}",
        f"Listed builders scraped from finance portals: {sum(1 for b in builders if b['listed'])}",
        "",
        "| Builder | Grade | Market status | Financial stress | Key finance signal | Projects |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for builder in builders:
        projects = ", ".join(project_map.get(builder["builderCode"], []))
        finance_signal = next((row[1] for row in builder["rows"] if row[0] == "Finance signal"), "—")
        lines.append(
            f"| {builder['builderName']} | {builder.get('gradeBucket') or 'Unassigned'} | "
            f"{'Listed' if builder['listed'] else 'Private'} | {builder['financialStress']} | {finance_signal} | {projects} |"
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    registry = load_json(REGISTRY)
    projects = load_json(PROJECTS_JSON)
    if isinstance(projects, dict) and "projects" in projects:
        projects = projects["projects"]

    project_map: dict[str, list[str]] = {}
    for project in projects:
        project_map.setdefault(project["builderCode"], []).append(project["name"])

    builders = build_builder_intelligence(registry)
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "builders": builders,
    }
    OUTPUT_JSON.write_text(json.dumps(payload, indent=2) + "\n")
    REPORT_MD.write_text(render_report(builders, project_map))
    print(f"Wrote {len(builders)} builders to {OUTPUT_JSON}")
    print(f"Wrote report to {REPORT_MD}")


if __name__ == "__main__":
    main()
