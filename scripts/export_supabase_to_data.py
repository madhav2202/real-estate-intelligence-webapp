#!/usr/bin/env python3
"""
Export current Supabase projects → repo's static data files.

This regenerates the frontend's data layer from the live Supabase pipeline
(now the source of truth) while PRESERVING local-only enrichment that does not
exist as a Supabase column.

Outputs (kept byte-for-byte in sync, as the repo expects):
  data/projects-data.json     array of camelCase project objects
  data/projects-data.js       window.__PROJECTS__ = <same array>

Shape rules — must stay aligned with mapSupabaseProject() in js/shared.js:
  - snake_case Supabase columns → camelCase keys (1:1 with the JS mapper)
  - PLUS `scoreCard`: the full score_card JSONB (value/composite/developer_risk/
    delivery_progress/micromarket/unit_sizes/super_area). The JS mapper does not
    surface this yet, so it's carried in the data file ready for wiring.
  - `builderIntelligence` is NOT a Supabase column — it lives only here, so we
    carry it forward from the existing data/projects-data.json by project code.

Usage:
  python3 scripts/export_supabase_to_data.py            # write files
  python3 scripts/export_supabase_to_data.py --dry-run  # report only
"""

import argparse, json
from pathlib import Path

import requests

SUPABASE_URL = "https://uihqsimrwbrhzjfgrfxr.supabase.co"
# anon key is sufficient for reading published data; service role used here so
# the export captures the full pipeline regardless of row-level visibility.
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpaHFzaW1yd2JyaHpqZmdyZnhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIyMDc4NCwiZXhwIjoyMDkzNzk2Nzg0fQ.88Y851v0ZqWUehKm9JtCzPBLZkr0v8KZEYXOgMNnk10"

ROOT      = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "data" / "projects-data.json"
JS_PATH   = ROOT / "data" / "projects-data.js"


def map_project(row):
    """Replicate mapSupabaseProject() in js/shared.js, + scoreCard."""
    return {
        "code": row.get("code"),
        "name": row.get("name"),
        "slug": row.get("slug"),
        "developer": row.get("developer"),
        "builderCode": row.get("builder_code"),
        "location": row.get("location"),
        "sector": row.get("sector"),
        "corridor": row.get("corridor"),
        "stage": row.get("stage"),
        "possession": row.get("possession"),
        "priceCr": row.get("price_cr"),
        "sqft": row.get("sqft"),
        "priceSqft": row.get("price_sqft"),
        "units": row.get("units"),
        "launched": row.get("launched"),
        "sold": row.get("sold"),
        "absorption": row.get("absorption"),
        "inventory": row.get("inventory"),
        "bestFor": row.get("best_for"),
        "image": row.get("image"),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "published": row.get("published"),
        "reraNumber": row.get("rera_number"),
        "reraPossession": row.get("rera_possession"),
        "builderRiskScoreLabel": row.get("builder_risk_score_label"),
        "developerRisk": row.get("developer_risk") or {},
        "approvals": row.get("approvals") or [],
        "tracker": row.get("tracker") or {},
        "comps": row.get("comps") or [],
        "stack": row.get("stack") or [],
        "locationIntel": row.get("location_intel") or {},
        "reraDetails": row.get("rera_details") or {},
        "builderIntelligence": None,          # filled from local JSON below
        # NEW pipeline output — full score card (frontend wiring pending)
        "scoreCard": row.get("score_card") or {},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    # 1. Preserve local-only builderIntelligence from the existing data file
    local_bi = {}
    if JSON_PATH.exists():
        for p in json.loads(JSON_PATH.read_text()):
            if p.get("builderIntelligence"):
                local_bi[p["code"]] = p["builderIntelligence"]
    print(f"Preserved builderIntelligence for {len(local_bi)} projects")

    # 2. Fetch all projects from Supabase
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/projects?select=*&order=name.asc",
        headers={"apikey": SERVICE_ROLE_KEY,
                 "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
                 "Range": "0-499"},
        timeout=40,
    )
    r.raise_for_status()
    rows = r.json()
    print(f"Fetched {len(rows)} projects from Supabase")

    # 3. Map + re-attach builderIntelligence
    projects = []
    for row in rows:
        p = map_project(row)
        p["builderIntelligence"] = local_bi.get(p["code"])
        projects.append(p)

    projects.sort(key=lambda p: (p.get("name") or "").lower())

    published = sum(1 for p in projects if p.get("published"))
    with_sc   = sum(1 for p in projects if p.get("scoreCard"))
    with_bi   = sum(1 for p in projects if p.get("builderIntelligence"))
    print(f"  published={published}  with scoreCard={with_sc}  with builderIntelligence={with_bi}")

    if args.dry_run:
        print("[dry-run] not writing files")
        return

    payload = json.dumps(projects, indent=2, ensure_ascii=False)
    JSON_PATH.write_text(payload + "\n")
    JS_PATH.write_text(f"window.__PROJECTS__ = {payload};\n")
    print(f"Wrote {JSON_PATH.relative_to(ROOT)} and {JS_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
