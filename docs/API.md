# CyberTrack REST API (Part 2)

The Spring Boot backend in [`backend/`](../backend) exposes the firewall inventory as a REST API.
Base URL: `http://localhost:8080/api/v1/firewalls`. All bodies are JSON.

## 1. Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│  React SPA (Vite, port 5173)                                     │
│  Pages ─► useFirewallService() ─► apiFirewallService (fetch)     │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP + JSON   /api/v1/firewalls/...
                               │ (Vite dev server proxies /api → :8080)
┌──────────────────────────────▼─── Spring Boot server (port 8080) ┐
│  FirewallController   @RestController — routes, status codes,    │
│        │              @Valid request bodies, pagination params    │
│        ▼                                                          │
│  FirewallService      interface ◄── FirewallServiceImpl           │
│        │              business rules: unique name / IP, timestamps│
│        ▼                                                          │
│  FirewallRepository   Spring Data JDBC: CrudRepository +          │
│        │              PagingAndSortingRepository + @Query          │
│        ▼                                                          │
│  H2 in-memory database   schema.sql + data.sql (10 sample rows)   │
│                                                                   │
│  GlobalExceptionHandler (@RestControllerAdvice) → 400 / 404 / 409 │
└───────────────────────────────────────────────────────────────────┘
```

The pattern is **MVC + Service layer** (Chapter 6): the controller stays thin and delegates to the
service, which is injected through its interface (dependency injection / IoC). Requests use a
`FirewallRequest` record (editable fields only, Bean Validation annotations); responses use the
`Firewall` record mapped to the `firewall` table.

## 2. Routes

| Operation | Method | Endpoint | Request body | Success | Errors |
|---|---|---|---|---|---|
| List all (paginated) | `GET` | `/api/v1/firewalls?page=0&size=10&sort=id,desc&search=` | — | `200 OK` + page | `400` size > 100 or unknown sort field |
| Find by id | `GET` | `/api/v1/firewalls/{id}` | — | `200 OK` + firewall | `404` not found, `400` id not a number |
| Dashboard summary | `GET` | `/api/v1/firewalls/summary` | — | `200 OK` + counts | — |
| Create | `POST` | `/api/v1/firewalls` | firewall fields | `201 Created` + `Location` header + firewall | `400` invalid, `409` name/IP taken |
| Update | `PUT` | `/api/v1/firewalls/{id}` | firewall fields | `204 No Content` | `400` invalid, `404` not found, `409` name/IP taken |
| Delete | `DELETE` | `/api/v1/firewalls/{id}` | — | `204 No Content` | `404` not found |

Query parameters for the list:

| Parameter | Default | Notes |
|---|---|---|
| `page` | `0` | Page index, starting at 0 |
| `size` | `10` | 1–100 |
| `sort` | `id,desc` (newest first) | `id`, `name`, `manufacturer`, `model`, `ipAddress`, `location`, `status`, `purchaseDate`, `createdAt`, `updatedAt`; add `,asc` or `,desc` |
| `search` | none | Case-insensitive match on name, manufacturer, IP address or location (results newest first) |

The frontend shows ids as Asset IDs: id `7` is displayed as `FW-0007`. Typing an Asset ID in the
inventory search box calls `GET /api/v1/firewalls/7`.

## 3. Examples

**Request body** (`POST` and `PUT`):

```json
{
  "name": "NEW-FW-01",
  "manufacturer": "Cisco",
  "model": "Firepower 1010",
  "serialNumber": "JAD2241088X",
  "ipAddress": "10.50.0.1",
  "location": "Medina Branch",
  "status": "Active",
  "firmwareVersion": "7.2.5",
  "purchaseDate": "2024-01-25",
  "notes": "Branch firewall"
}
```

`id`, `createdAt` and `updatedAt` are set by the server. Optional fields: `serialNumber`,
`firmwareVersion`, `purchaseDate`, `notes`.

**Firewall** (`GET /api/v1/firewalls/1`):

```json
{
  "id": 1,
  "name": "HQ-EDGE-FW-01",
  "manufacturer": "Fortinet",
  "model": "FortiGate 100F",
  "serialNumber": "FGT100FTK2209A001",
  "ipAddress": "10.0.0.1",
  "location": "Riyadh HQ – Server Room A",
  "status": "Active",
  "firmwareVersion": "7.4.3",
  "purchaseDate": "2024-03-15",
  "notes": "Primary perimeter firewall",
  "createdAt": "2026-09-01T08:00:00",
  "updatedAt": "2026-10-01T09:00:00"
}
```

**Page** (`GET /api/v1/firewalls?page=0&size=3`):

```json
{ "content": [ { "id": 10, "...": "..." }, { "id": 9 }, { "id": 8 } ],
  "page": 0, "size": 3, "totalElements": 10, "totalPages": 4 }
```

**Summary** (`GET /api/v1/firewalls/summary`):

```json
{ "total": 10, "byStatus": { "Active": 6, "Inactive": 2, "Maintenance": 1, "Decommissioned": 1 } }
```

**Error** (`400` / `404` / `409`):

```json
{ "status": 409, "message": "This IP address is already assigned",
  "errors": { "ipAddress": "This IP address is already assigned" } }
```

`errors` maps a field to its message, so the form shows the message next to that field.

## 4. Validation rules

| Field | Rule |
|---|---|
| name | Required, 2–50 characters, letters/digits/space/`.`/`_`/`-`, unique (ignoring case) |
| manufacturer | One of Cisco, Fortinet, Palo Alto Networks, Check Point, Juniper Networks, SonicWall, Sophos, Other |
| model | Required, at most 50 characters |
| serialNumber | Optional, at most 40 characters, letters/digits/`-` |
| ipAddress | Required, valid IPv4, unique |
| location | Required, 2–100 characters |
| status | One of Active, Inactive, Maintenance, Decommissioned |
| firmwareVersion | Optional, at most 20 characters |
| purchaseDate | Optional, `YYYY-MM-DD`, not in the future |
| notes | Optional, at most 500 characters |

Text is trimmed before validation; empty optional text is stored as `null`.

## 5. Tests

`backend/src/test` holds 72 JUnit 5 tests:

| Test class | Kind | What it covers |
|---|---|---|
| `FirewallServiceImplTest` | Unit (Mockito mock repository) | Paging, search, find by id, create, update, delete, duplicates, timestamps, summary |
| `FirewallControllerTest` | Unit (MockMvc standalone + Mockito mock service) | Every route, status codes, JSON bodies, validation messages, Location header |
| `FirewallRequestValidationTest` | Unit (Bean Validation) | Every validation rule and the trimming of input |
| `FirewallApiIntegrationTest` | Integration (Spring context + H2) | Full CRUD, pagination, sorting, search and SQL queries against the real database |
| `CyberTrackApplicationTests` | Smoke | The application context starts |
