# Faraday — Locked JSON Schema

This file is the **source of truth** for the contract between
`/frontend/lib/types.ts` and `/backend/schemas.py`. Both sides must
match this document field-for-field. Do not rename fields without
updating both implementations and this file in the same change.

---

## Endpoints

| Method | Path        | Request body              | Response       |
|--------|-------------|---------------------------|----------------|
| POST   | `/api/qc`   | `{ "hypothesis": str }`   | `LiteratureQC` |
| POST   | `/api/plan` | `{ "hypothesis": str }`   | `Plan`         |
| GET    | `/health`   | —                         | `{ "status": "ok", "service": "faraday-backend" }` |

---

## `LiteratureQC`

| Field        | Type                                           | Notes                                      |
|--------------|------------------------------------------------|--------------------------------------------|
| `status`     | `"novel" \| "similar" \| "exact_match"`        | Drives the colored badge in the UI         |
| `references` | `Reference[]`                                  | 1–3 entries; ordered by relevance          |

### `Reference`

| Field     | Type                                  | Notes                                    |
|-----------|---------------------------------------|------------------------------------------|
| `title`   | `string`                              | Paper title                              |
| `authors` | `string`                              | Pre-formatted author list                |
| `url`     | `string`                              | External link to source                  |
| `year`    | `number`                              | 4-digit publication year                 |
| `source`  | `"arxiv" \| "pubmed" \| "openalex"`   | Where the citation came from             |

---

## `Plan`

| Field        | Type             |
|--------------|------------------|
| `protocol`   | `ProtocolStep[]` |
| `materials`  | `Material[]`     |
| `budget`     | `Budget`         |
| `timeline`   | `Timeline`       |
| `validation` | `Validation`     |

### `ProtocolStep`

| Field         | Type     | Notes                                         |
|---------------|----------|-----------------------------------------------|
| `step`        | `number` | 1-indexed step number                         |
| `description` | `string` | Imperative single-step instruction            |
| `duration`    | `string` | Free text (e.g. `"24h"`, `"30min"`, `"7d"`)   |
| `source_url`  | `string` | Link to the citing protocol (e.g. protocols.io) |

### `Material`

| Field            | Type     | Notes                                 |
|------------------|----------|---------------------------------------|
| `name`           | `string` | Reagent / consumable name             |
| `supplier`       | `string` | Vendor name (Sigma-Aldrich, Thermo…)  |
| `catalog_number` | `string` | Vendor SKU                            |
| `cost_usd`       | `number` | Unit cost in USD                      |
| `quantity`       | `string` | e.g. `"100 g"`, `"500 mL"`            |
| `source_url`     | `string` | Vendor product page                   |

### `Budget`

| Field        | Type           |
|--------------|----------------|
| `total_usd`  | `number`       |
| `breakdown`  | `BudgetItem[]` |

#### `BudgetItem`

| Field        | Type     |
|--------------|----------|
| `category`   | `string` |
| `amount_usd` | `number` |

### `Timeline`

| Field         | Type              |
|---------------|-------------------|
| `total_weeks` | `number`          |
| `phases`      | `TimelinePhase[]` |

#### `TimelinePhase`

| Field           | Type                | Notes                                          |
|-----------------|---------------------|------------------------------------------------|
| `name`          | `string`            | Phase label                                    |
| `weeks`         | `[number, number]`  | Inclusive `[startWeek, endWeek]`               |
| `dependencies`  | `string[]`          | Names of phases this phase depends on (may be empty) |

### `Validation`

| Field               | Type     |
|---------------------|----------|
| `method`            | `string` |
| `success_criteria`  | `string` |

---

## Example payload

```json
{
  "literature_qc": {
    "status": "similar",
    "references": [
      {
        "title": "Trehalose-mediated cryopreservation of mammalian cell lines",
        "authors": "Chen Y, Patel R, Ohnishi M",
        "url": "https://pubmed.ncbi.nlm.nih.gov/34928176/",
        "year": 2023,
        "source": "pubmed"
      }
    ]
  },
  "plan": {
    "protocol": [
      {
        "step": 1,
        "description": "Culture HeLa cells in DMEM + 10% FBS to 80% confluency.",
        "duration": "48h",
        "source_url": "https://www.protocols.io/view/hela-cell-maintenance-bx7zjp76"
      }
    ],
    "materials": [
      {
        "name": "Trehalose dihydrate, ≥99%",
        "supplier": "Sigma-Aldrich",
        "catalog_number": "T9531-100G",
        "cost_usd": 142.0,
        "quantity": "100 g",
        "source_url": "https://www.sigmaaldrich.com/US/en/product/sigma/t9531"
      }
    ],
    "budget": {
      "total_usd": 8520,
      "breakdown": [
        { "category": "Reagents", "amount_usd": 2840 }
      ]
    },
    "timeline": {
      "total_weeks": 6,
      "phases": [
        { "name": "Preparation", "weeks": [1, 1], "dependencies": [] }
      ]
    },
    "validation": {
      "method": "Flow cytometry (Annexin V / 7-AAD) at 24h post-thaw.",
      "success_criteria": "Trehalose ≥15pp higher viability vs sucrose, p < 0.01."
    }
  }
}
```
