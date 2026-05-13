# PropSpot Plinth Data Gap Matrix

Total live projects audited: **75**

## Coverage Summary

| Field | Key | Present | Missing | Best source to fill | Field type |
| --- | --- | ---: | ---: | --- | --- |
| Builder current sale price | `priceSqft` | 74 | 1 | Current dataset / builder / RERA / ReraTracker | dynamic |
| RERA registration number | `reraNumber` | 60 | 15 | HRERA / ReraTracker | stable |
| RERA possession date | `reraPossession` | 48 | 27 | HRERA / ReraTracker | stable |
| Absorption | `absorption` | 0 | 75 | HRERA quarterly / ReraTracker / manual proxy | dynamic |
| Inventory signal | `inventory` | 0 | 75 | HRERA quarterly / manual / CP intel | dynamic |
| Land area | `reraDetails.landArea` | 56 | 19 | HRERA / ReraTracker | stable |
| Licensed land | `reraDetails.totalLicensedLand` | 55 | 20 | HRERA / ReraTracker | stable |
| Total towers | `reraDetails.totalTowers` | 40 | 35 | HRERA / ReraTracker | stable |
| Total units | `reraDetails.totalUnits` | 45 | 30 | HRERA / ReraTracker | stable |
| Units sold | `reraDetails.unitsSold` | 0 | 75 | HRERA quarterly / ReraTracker | dynamic |
| Units available | `reraDetails.unitsAvailable` | 0 | 75 | HRERA quarterly / ReraTracker | dynamic |
| Total floors | `reraDetails.totalFloors` | 41 | 34 | HRERA / ReraTracker | stable |
| Launch price | `reraDetails.launchPrice` | 36 | 39 | ReraTracker / builder / archived sheets | dynamic |
| Current price | `reraDetails.currentPrice` | 36 | 39 | ReraTracker / builder / current rate sheet | dynamic |
| Configurations | `reraDetails.configurations` | 40 | 35 | HRERA / ReraTracker | stable |
| Size range | `reraDetails.sizes` | 55 | 20 | HRERA / ReraTracker | stable |
| Start date | `reraDetails.startDate` | 45 | 30 | HRERA / ReraTracker | stable |
| Completion date | `reraDetails.completionDate` | 44 | 31 | HRERA / ReraTracker | stable |
| ReraTracker source URL | `reraDetails.sourceUrl` | 56 | 19 | ReraTracker | stable |
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
- `reraNumber`: 60/75
- `reraPossession`: 48/75
- `reraDetails.unitsSold`: 0/75
- `reraDetails.unitsAvailable`: 0/75
- `reraDetails.launchPrice`: 36/75
- `reraDetails.currentPrice`: 36/75

## Most Gap-Heavy Projects

| Code | Project | Missing tracked fields |
| --- | --- | ---: |
| `GGM-36A-TER` | Max Estate Terraces | 22 |
| `GGM-36A-ANT` | Max Antara | 22 |
| `GGM-80-ELI` | Conscient Eliara | 22 |
| `GGM-17C-DWA` | Eldeco Dwarka | 22 |
| `GGM-53-753` | Godrej Samaris | 22 |
| `GGM-42-ONE` | Experion One42 | 22 |
| `GGM-58-360` | Oberoi 360 North | 22 |
| `GGM-46-DUA` | SP Dualis | 22 |
| `GGM-MAN-GIC` | Smartworld GIC | 22 |
| `GGM-113-CAP` | M3M Capital | 22 |
| `GGM-113-STA` | M3M St Andrews | 22 |
| `GGM-63A-KAI` | TARC Kailasa | 22 |
| `GGM-104-LEV` | Satya Levante | 22 |
| `GGM-113-MIR` | M3M Mira Vita | 22 |
| `GGM-113-ONE` | Smartworld One DXP | 22 |
| `GGM-43-MIR` | Godrej Mirayah | 21 |
| `GGM-69-TRU` | Trump Tower 2 | 20 |
| `GGM-103-VRI` | Godrej Vriksha | 20 |
| `GGM-36A-DAX` | Signature Global Daxin Vistas | 20 |
| `GGM-104-STU` | Central Park Studio | 17 |

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
