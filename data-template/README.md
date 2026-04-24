# Data Template

Fill these CSVs to load real project data into the PropSpot launch intelligence app.

Files:

- `projects.csv`: one row per project
- `comps.csv`: 3-5 comparable projects per project
- `builder_risk.csv`: builder diligence facts
- `approvals.csv`: approval and payment-plan statuses
- `tracker.csv`: construction / launch milestone facts
- `location_intel.csv`: location score plus 3x connectivity/social/infra/risk points

Recommended workflow:

1. Start with `projects.csv`
2. Add 3-5 rows in `comps.csv` for each project
3. Fill builder risk, approvals, tracker, and location intelligence
4. Convert these CSVs into the app's project JSON structure
