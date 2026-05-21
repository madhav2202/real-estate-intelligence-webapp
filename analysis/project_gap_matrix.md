# PropSpot Plinth Data Gap Matrix

Total live projects audited: **75**

## Coverage Summary

| Field | Key | Present | Missing | Best source to fill | Field type |
| --- | --- | ---: | ---: | --- | --- |
| Builder current sale price | `priceSqft` | 74 | 1 | Current dataset / builder / RERA / ReraTracker | dynamic |
| RERA registration number | `reraNumber` | 70 | 5 | HRERA / ReraTracker | stable |
| RERA possession date | `reraPossession` | 54 | 21 | HRERA / ReraTracker | stable |
| Absorption | `absorption` | 0 | 75 | HRERA quarterly / ReraTracker / manual proxy | dynamic |
| Inventory signal | `inventory` | 0 | 75 | HRERA quarterly / manual / CP intel | dynamic |
| Land area | `reraDetails.landArea` | 69 | 6 | HRERA / ReraTracker | stable |
| Licensed land | `reraDetails.totalLicensedLand` | 69 | 6 | HRERA / ReraTracker | stable |
| Total towers | `reraDetails.totalTowers` | 46 | 29 | HRERA / ReraTracker | stable |
| Total units | `reraDetails.totalUnits` | 59 | 16 | HRERA / ReraTracker | stable |
| Units sold | `reraDetails.unitsSold` | 0 | 75 | HRERA quarterly / ReraTracker | dynamic |
| Units available | `reraDetails.unitsAvailable` | 0 | 75 | HRERA quarterly / ReraTracker | dynamic |
| Total floors | `reraDetails.totalFloors` | 54 | 21 | HRERA / ReraTracker | stable |
| Launch price | `reraDetails.launchPrice` | 42 | 33 | ReraTracker / builder / archived sheets | dynamic |
| Current price | `reraDetails.currentPrice` | 42 | 33 | ReraTracker / builder / current rate sheet | dynamic |
| Configurations | `reraDetails.configurations` | 46 | 29 | HRERA / ReraTracker | stable |
| Size range | `reraDetails.sizes` | 69 | 6 | HRERA / ReraTracker | stable |
| Start date | `reraDetails.startDate` | 53 | 22 | HRERA / ReraTracker | stable |
| Completion date | `reraDetails.completionDate` | 50 | 25 | HRERA / ReraTracker | stable |
| ReraTracker source URL | `reraDetails.sourceUrl` | 69 | 6 | ReraTracker | stable |
| Location score | `locationIntel.score` | 0 | 75 | Derived internally | derived |
| Commute summary | `locationIntel.commute` | 0 | 75 | Derived internally | derived |
| Livability summary | `locationIntel.livability` | 0 | 75 | Derived internally | derived |
| Builder risk score | `developerRisk.score` | 75 | 0 | Derived from builder diligence / listed filings / complaints | derived |
| Construction / launch signal | `tracker.signal` | 1 | 74 | HRERA quarterly / manual ops | dynamic |

## Top Gaps Right Now

These are the fields with the weakest current coverage across the live universe:

- `absorption`: 0/75
- `inventory`: 0/75
- `developerRisk.score`: 75/75
- `locationIntel.score`, `locationIntel.commute`, `locationIntel.livability`: 0/75
- `tracker.signal`: 1/75
- `reraNumber`: 70/75
- `reraPossession`: 54/75
- `reraDetails.unitsSold`: 0/75
- `reraDetails.unitsAvailable`: 0/75
- `reraDetails.launchPrice`: 42/75
- `reraDetails.currentPrice`: 42/75

## Most Gap-Heavy Projects

| Code | Project | Missing tracked fields |
| --- | --- | ---: |
| `GGM-36A-TER` | Max Estate Terraces | 22 |
| `GGM-36A-ANT` | Max Antara | 22 |
| `GGM-17C-DWA` | Eldeco Dwarka | 22 |
| `GGM-58-360` | Oberoi 360 North | 22 |
| `GGM-113-STA` | M3M St Andrews | 22 |
| `GGM-36A-DAX` | Signature Global Daxin Vistas | 20 |
| `GGM-104-STU` | Central Park Studio | 17 |
| `GGM-79-ANT` | M3M Antalya Hills | 17 |
| `GGM-103-URB` | Whiteland Urban Resort | 17 |
| `GGM-33-FLA` | Central Park Flamingo Floors | 17 |
| `GGM-113-LAV` | Tata La Vida | 17 |
| `GGM-85-ANA` | Ganga Realty Anantam | 17 |
| `GGM-48-BEL` | Central Park Belaperla | 17 |
| `GGM-80-ELI` | Conscient Elaira Phase 1 | 15 |
| `GGM-104-PAL` | Hero Homes Palatial | 15 |
| `GGM-MAN-GIC` | M3M Forestia East I | 15 |
| `GGM-113-MAN` | M3M Mansion | 15 |
| `GGM-113-CAP` | M3M Capital | 15 |
| `GGM-84-NAN` | Ganga Realty Nandaka | 15 |
| `GGM-104-LEV` | Levante Residences | 15 |

## Recommended Fill Strategy

### Fill from official / semi-official online sources first
- HRERA registered project pages
- HRERA quarterly progress pages
- ReraTracker project pages
- official investor relations pages for listed builders

### Keep manual / internal overrides for the messy layers
- CP-specific offers
- payment-plan economics
- real-time inventory nuance
- subjective builder commentary

### Treat these as derived, not scraped
- PropSpot Score
- Fair Entry
- Complaint intensity
- Financial stress summary
- Location score / commute / livability summary
