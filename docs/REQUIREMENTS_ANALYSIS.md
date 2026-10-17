# CyberTrack — Software Requirements Analysis

| | |
|---|---|
| **Project** | CyberTrack — Firewall Asset Management System |
| **Course** | SE411 Software Engineering · Fall 2026–27 · Project Part 1 |
| **Document date** | 17 October 2026 |
| **Related documents** | [UI/UX Design](UI_UX_DESIGN.md) · [Architecture](ARCHITECTURE.md) · [Technical Documentation](TECHNICAL_DOCUMENTATION.md) · [Testing Report](TESTING_REPORT.md) · [Code Review](CODE_REVIEW.md) |

> **About this document (retrospective).** The original requirements analysis was produced by the AI assistant (Claude Code) in response to the team's "Prompt 1 — Software Requirements Analysis" and was presented in the AI conversation, not saved as a file. This file was **written afterwards** ("Prompt 8") from that analysis and updated to match the **final implementation**. Requirement IDs are kept from the original. Every change made since then is listed in [Section 9](#9-change-history). The **Status** columns describe the final application as checked on 17 October 2026.

---

## 1. Overview and Objectives

CyberTrack is a single-page React web application that lets an organisation keep an inventory of its **firewall devices**: register, view, search, update and delete them through one interface. The specification asks each team to choose one kind of company asset; this team chose firewalls.

| ID | Objective | Status |
|---|---|---|
| OBJ-1 | Deliver a React frontend that meets every mandatory requirement of the Part 1 specification | ✅ |
| OBJ-2 | Full management of firewall assets: add, display, search, update, delete | ✅ |
| OBJ-3 | An About page identifying the team members (name, student ID) | ✅ (4 members) |
| OBJ-4 | Supporting deliverables: public GitHub repository, documentation, tests that have been run, AI code review | ✅ except the public repository (pending) |
| OBJ-5 | A simple architecture with a separate data layer so a backend can be added in Part 2 | ✅ |

### 1.1 Scope

- **In scope:** firewall asset management in the browser, navigation menu, Dashboard, About page, input validation, in-memory data, automated tests, documentation.
- **Out of scope (Part 1):** database, backend, APIs, login/authentication, multiple users, other asset types, live device monitoring, import/export, saving data across page reloads.

### 1.2 Stakeholders

| Role | Interest |
|---|---|
| IT / security administrator (primary user) | Keeps the firewall inventory accurate |
| Course instructor (evaluator) | Grades the project against the specification |
| Project team (4 students) | Builds, tests, documents and submits the project |

---

## 2. Mandatory Requirements from the Specification

These come directly from the professor's *SE411 Part 1* project description.

| Ref | Requirement (as stated in the specification) | How CyberTrack meets it | Status |
|---|---|---|---|
| SPEC-01 | The project must be a React project | React 19 with functional components | ✅ |
| SPEC-02 | Manage one kind of asset | Firewall devices only | ✅ |
| SPEC-03 | A menu to navigate between features | Sidebar: Dashboard, Firewall Inventory, Add Firewall, About | ✅ |
| SPEC-04 | Add (store) elements | Add Firewall page | ✅ |
| SPEC-05 | Remove / delete elements | Delete action with confirmation | ✅ |
| SPEC-06 | Update elements | Edit Firewall page | ✅ |
| SPEC-07 | Search elements | Live search on the inventory | ✅ |
| SPEC-08 | Display elements | Inventory table and Dashboard | ✅ |
| SPEC-09 | About page presenting the team members (name, student ID) | About page, 4 members | ✅ |
| SPEC-10 | A menu item that opens the About page | "About" in the menu | ✅ |
| SPEC-11 | Data defined as a collection of objects, not stored in a database | In-memory array in `firewallService.js` | ✅ |
| SPEC-12 | Backend to be coded manually in Part 2 | Data-access layer designed to be replaced | ✅ (prepared; no backend) |
| SPEC-13 | Use an AI tool for requirements, visual design and code | Claude Code was used for all three | ✅ |
| SPEC-14 | Share the code on a public GitHub repository | Repository prepared; not yet published | ⏳ Pending |
| SPEC-15 | AI-generated documentation: architecture, technology stack, features | `ARCHITECTURE.md`, `TECHNICAL_DOCUMENTATION.md` | ✅ |
| SPEC-16 | AI-generated tests, and run them | 113 automated tests, all passing | ✅ |
| SPEC-17 | AI-generated code review (security, performance, code quality, code reuse) | `CODE_REVIEW.md` | ✅ |
| SPEC-18 | Groups of three students; one student submits the repository URL | Team has **four** members | ⚠️ Confirm with the professor |
| SPEC-19 | Deadline: 17 October 2026 | — | — |

---

## 3. Functional Requirements

Priority uses MoSCoW: **M** = Must (needed for the specification), **S** = Should, **C** = Could (optional).

### 3.1 Navigation

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-NAV-01 | A navigation menu is shown on every page | M | ✅ |
| FR-NAV-02 | Menu items: Dashboard, Firewall Inventory, Add Firewall, About | M | ✅ |
| FR-NAV-03 | The current page's menu item is highlighted | S | ✅ |
| FR-NAV-04 | Each page has its own URL; browser back/forward work | S | ✅ |
| FR-NAV-05 | Unknown URLs show a "Page not found" page with a link home | S | ✅ |

### 3.2 Dashboard

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-HOM-01 | The Dashboard introduces the inventory and links to the main features | S | ✅ |
| FR-HOM-02 | The Dashboard shows total, active, inactive and under-maintenance counts from the current data | M *(raised from C; see §9)* | ✅ |

### 3.3 Display

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-DSP-01 | The inventory lists all firewalls with Asset ID, Name, Manufacturer, IP Address, Location and Status | M | ✅ |
| FR-DSP-02 | The app starts with at least 8 sample firewalls in memory | M | ✅ (10) |
| FR-DSP-03 | An empty-state message is shown when there are no firewalls | S | ✅ |
| FR-DSP-04 | The total and the number currently shown are displayed | S | ✅ |
| FR-DSP-05 | Status is shown as a badge with a text label, not colour alone | S | ✅ |
| FR-DSP-06 | A separate read-only Details page | C | ❌ Not implemented (dropped in design; §9) |

### 3.4 Add

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-ADD-01 | The Add form opens from the menu and from the inventory | M | ✅ |
| FR-ADD-02 | The form collects every user-editable attribute (§5) | M | ✅ |
| FR-ADD-03 | The Asset ID is generated by the system and cannot be edited | M | ✅ |
| FR-ADD-04 | Input is validated before saving (§5.2) | M | ✅ |
| FR-ADD-05 | Errors appear next to the relevant field; nothing is saved until they are fixed | M | ✅ |
| FR-ADD-06 | A saved firewall appears in the list immediately, with a success message | M | ✅ |
| FR-ADD-07 | Cancel returns without saving | S | ✅ |

### 3.5 Update

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-UPD-01 | Each row has an Edit action | M | ✅ |
| FR-UPD-02 | The Edit form is pre-filled with current values | M | ✅ |
| FR-UPD-03 | The same validation rules as Add apply | M | ✅ |
| FR-UPD-04 | Saved changes appear in the list immediately | M | ✅ |
| FR-UPD-05 | The Asset ID is shown read-only | M | ✅ |
| FR-UPD-06 | Cancel discards changes | S | ✅ |
| FR-UPD-07 | `updatedAt` is refreshed on every save | S | ✅ |

### 3.6 Delete

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-DEL-01 | Each row has a Delete action | M | ✅ |
| FR-DEL-02 | A confirmation naming the firewall (name and ID) is shown first | M | ✅ |
| FR-DEL-03 | On confirmation the firewall is removed and disappears from the list | M | ✅ |
| FR-DEL-04 | On cancel nothing changes | M | ✅ |
| FR-DEL-05 | A message reports the result (success only if a firewall was actually removed) | S | ✅ *(clarified after code review CQ-02)* |

### 3.7 Search

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-SRC-01 | The inventory has a search box | M | ✅ |
| FR-SRC-02 | Case-insensitive substring match on Asset ID, Name, Manufacturer, IP Address and Location | M | ✅ |
| FR-SRC-03 | Results update while typing | S | ✅ |
| FR-SRC-04 | A "no matches" message is shown | M | ✅ |
| FR-SRC-05 | Clearing the search restores the full list | M | ✅ |
| FR-SRC-06 | Filter by status | C | ❌ Not implemented (optional) |
| FR-SRC-07 | Sort by column | C | ❌ Not implemented (optional) |

### 3.8 About

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-ABT-01 | The About page opens from a menu item labelled "About" | M | ✅ |
| FR-ABT-02 | The About page lists **all four** team members, each with full name and student ID | M | ✅ *(three in the original analysis; §9)* |
| FR-ABT-03 | The About page describes CyberTrack and the course | S | ✅ |

---

## 4. Non-Functional Requirements

The **Verified by** column states what has actually been checked. Items marked *Not measured* are design targets whose results have not been recorded.

| ID | Category | Requirement | Verified by | Status |
|---|---|---|---|---|
| NFR-USA-01 | Usability | Any management action is reachable in ≤ 2 clicks | Route structure; integration tests | ✅ |
| NFR-USA-02 | Usability | Every field has a visible label; required fields are marked | Inspection; tests query fields by label | ✅ |
| NFR-USA-03 | Usability | Every add/update/delete gives visible feedback | Integration tests (toasts) | ✅ |
| NFR-USA-04 | Usability | Layout works from 360 px to 1920 px without page-level horizontal scrolling | Responsive CSS implemented | ⏳ Not checked in a browser (Testing Report MT-01…03) |
| NFR-PER-01 | Performance | Search updates within 100 ms with 500 records | Algorithm is a single pass over the list | ⏳ Not measured |
| NFR-PER-02 | Performance | Lighthouse Performance ≥ 85 | — | ⏳ Not measured (MT-07) |
| NFR-PER-03 | Performance | List rows use stable keys (Asset ID) | Inspection | ✅ |
| NFR-ACC-01 | Accessibility | WCAG 2.1 AA target; text contrast ≥ 4.5:1 | Contrast **calculated** for all text colour pairs (all ≥ 4.5:1; see [UI/UX Design §2](UI_UX_DESIGN.md#2-colour-palette)) | ⚠️ Text passes by calculation; **input borders 2.56:1 are below the 3:1 non-text guideline**; not measured in a browser |
| NFR-ACC-02 | Accessibility | All features usable by keyboard, with visible focus | Integration tests for keyboard paths (dialog, drawer, shortcuts) | ✅ Partly (full manual keyboard walkthrough: MT-05) |
| NFR-ACC-03 | Accessibility | Form errors linked to fields; dialog manages focus | Integration tests | ✅ |
| NFR-ACC-04 | Accessibility | Lighthouse Accessibility ≥ 90 | — | ⏳ Not measured (MT-07) |
| NFR-SEC-01 | Security | All input validated against §5.2 | Unit and integration tests | ✅ |
| NFR-SEC-02 | Security | User data rendered only through React; no `dangerouslySetInnerHTML` or `eval` | Code search; test TC-SEC-01 | ✅ |
| NFR-SEC-03 | Security | No secrets in the repository | Inspection; `.gitignore` excludes `.env*` | ✅ |
| NFR-SEC-04 | Security | No critical/high vulnerabilities in dependencies | `npm audit`: 0 vulnerabilities | ✅ |
| NFR-SEC-05 | Security | Sample data uses fictitious devices and private IP ranges | Inspection of `seedFirewalls.js` | ✅ |
| NFR-MNT-01 | Maintainability | Functional components and Hooks only | Inspection | ✅ |
| NFR-MNT-02 | Maintainability | All data access goes through one service module | Import search | ✅ |
| NFR-MNT-03 | Maintainability | Add and Edit share one form and one validation module | Inspection | ✅ |
| NFR-MNT-04 | Maintainability | Folders separate components, pages, services, data and utilities | Inspection | ✅ |
| NFR-MNT-05 | Maintainability | ESLint reports zero errors | `npm run lint` | ✅ |
| NFR-MNT-06 | Maintainability | Automated tests cover validation, the service and every Must requirement; all pass | `npm test`: 113/113 | ✅ |
| NFR-PRT-01 | Portability | Works in current Chrome, Edge and Firefox | — | ⏳ Not checked (MT-06) |

---

## 5. Firewall Data Model

Full details, including the asset ID algorithm, are in [Technical Documentation §5](TECHNICAL_DOCUMENTATION.md#5-data-model).

### 5.1 Attributes

| Attribute | Required | Set by | Notes |
|---|---|---|---|
| `id` | ✅ | System | `FW-0001`, `FW-0002`, … never reused |
| `name` | ✅ | User | Unique (case-insensitive) |
| `manufacturer` | ✅ | User | Cisco, Fortinet, Palo Alto Networks, Check Point, Juniper Networks, SonicWall, Sophos, Other |
| `model` | ✅ | User | |
| `serialNumber` | — | User | |
| `ipAddress` | ✅ | User | IPv4, unique |
| `location` | ✅ | User | |
| `status` | ✅ | User | Active (default), Inactive, Maintenance, Decommissioned |
| `firmwareVersion` | — | User | |
| `purchaseDate` | — | User | `YYYY-MM-DD`, not in the future |
| `notes` | — | User | ≤ 500 characters |
| `createdAt`, `updatedAt` | ✅ | System | ISO 8601 timestamps |

### 5.2 Validation rules (summary)

All values must be text and are trimmed. Name: 2–50 characters (letters, digits, space, `.` `_` `-`), unique. Model: 1–50. Serial: ≤ 40 (letters, digits, `-`). IP: valid IPv4, no leading zeros, unique. Location: 2–100. Manufacturer and status: from the fixed lists. Firmware: ≤ 20. Purchase date: a real date, not in the future. Notes: ≤ 500.

### 5.3 Storage

In memory only, as the specification requires. Data resets to the 10 sample firewalls when the page is reloaded.

---

## 6. Pages and Navigation

| Route | Page | In menu |
|---|---|---|
| `/` | Dashboard | ✅ |
| `/firewalls` | Firewall Inventory (display, search, delete) | ✅ |
| `/firewalls/new` | Add Firewall | ✅ |
| `/firewalls/:id/edit` | Edit Firewall | From the inventory |
| `/about` | About | ✅ |
| `*` | Not Found | — |

---

## 7. Acceptance Criteria

Each criterion is written in Given / When / Then form and is checked by the listed automated tests (test IDs from the [Testing Report](TESTING_REPORT.md#4-test-cases-and-results)).

| ID | Given / When / Then | Tests | Result |
|---|---|---|---|
| AC-NAV-01 | *Given* any page, *when* it renders, *then* the menu shows all four items and each opens its page | TC-NAV-01, 02 | ✅ |
| AC-NAV-02 | *Given* the About page, *then* "About" is highlighted (`aria-current="page"`) | TC-NAV-03 | ✅ |
| AC-NAV-03 | *Given* an unknown URL, *then* "Page not found" with a link home is shown | TC-NAV-08 | ✅ |
| AC-DSP-01 | *Given* app start, *when* the inventory opens, *then* ≥ 8 rows with the six data columns are shown | TC-INV-01 | ✅ |
| AC-DSP-02 | *Given* no firewalls, *then* "No firewalls registered" and an Add link are shown | TC-INV-03, 04 | ✅ |
| AC-DSP-03 | *Given* 10 firewalls and a search matching 2, *then* "Showing 2 of 10" is shown | TC-INV-05 | ✅ |
| AC-ADD-01 | *Given* valid input, *when* Save is clicked, *then* the new row (new `FW-` ID) appears, the count rises by 1 and a success message is shown | TC-ADD-01 | ✅ |
| AC-ADD-02 | *Given* an empty Name, *when* Save is clicked, *then* "Name is required" appears, focus moves there and nothing is saved | TC-ADD-03 | ✅ |
| AC-ADD-03 | *Given* IP `256.1.1.1`, *then* "Enter a valid IPv4 address" is shown | TC-ADD-07, TC-VAL-10 | ✅ |
| AC-ADD-04 | *Given* an IP already in use, *then* "This IP address is already assigned" is shown | TC-ADD-07, TC-VAL-08 | ✅ |
| AC-ADD-05 | *Given* entered data, *when* Cancel is clicked, *then* nothing is saved | TC-ADD-09 | ✅ |
| AC-UPD-01 | *Given* `FW-0001`, *when* Edit is clicked, *then* the form is pre-filled and the ID is read-only | TC-UPD-01 | ✅ |
| AC-UPD-02 | *Given* a status change to Maintenance, *when* saved, *then* the list shows it and `updatedAt` is later | TC-UPD-02, TC-SVC-07 | ✅ |
| AC-UPD-03 | *Given* an empty Location, *when* saved, *then* "Location is required" and the record is unchanged | TC-UPD-04 | ✅ |
| AC-UPD-04 | *Given* an unchanged own IP, *when* saved, *then* it succeeds | TC-UPD-03 | ✅ |
| AC-UPD-05 | *Given* unsaved changes, *when* Cancel is clicked, *then* the record is unchanged | TC-UPD-06 | ✅ |
| AC-DEL-01 | *When* Delete is clicked, *then* a dialog names the firewall and its ID, with focus on Cancel | TC-INV-09 | ✅ |
| AC-DEL-02 | *When* deletion is confirmed, *then* the row disappears, the count drops and a success message is shown | TC-INV-09 | ✅ |
| AC-DEL-03 | *When* cancelled (button, Esc or backdrop), *then* nothing changes | TC-INV-10 | ✅ |
| AC-SRC-01 | *When* typing `forti`, *then* only matching firewalls are shown, updating per keystroke | TC-INV-05 | ✅ |
| AC-SRC-02 | *When* typing an IP, *then* that firewall is shown | TC-INV-06 | ✅ |
| AC-SRC-03 | *When* nothing matches, *then* "No firewalls match your search" is shown | TC-INV-05 | ✅ |
| AC-SRC-04 | *When* the search is cleared, *then* every firewall is shown | TC-INV-05, 08 | ✅ |
| AC-ABT-01 | *When* About is clicked, *then* **four** team members are shown with name and student ID | TC-ABT-01, 02 | ✅ |

---

## 8. Assumptions and Resolved Ambiguities

| # | Item | Resolution |
|---|---|---|
| A-1 | The specification lists "store", "remove" and "delete" | "Store" = add. "Remove" and "delete" = the same permanent delete |
| A-2 | "About page" vs. "opens this window" | A normal page reached from the menu |
| A-3 | Persistence is not mentioned | Data lives in memory; a reload restores the sample data |
| A-4 | Search behaviour is not defined | Case-insensitive substring match on five fields |
| A-5 | Users | Single user, no login |
| A-6 | Team details | Provided by the team: 4 members (see README) |
| A-7 | Tooling is not prescribed | Vite, React Router, Vitest + React Testing Library, ESLint (approved by the team) |
| A-8 | IP format | IPv4 only |

---

## 9. Change History

Changes between the original AI-generated analysis ("Prompt 1") and the final application:

| Change | Original analysis | Final | Reason |
|---|---|---|---|
| Team size | 3 members (as in the specification) | **4 members** | Team instruction when approving the design |
| Home page | "Home" at `/`, summary counts optional (FR-HOM-02 = Could) | **Dashboard** at `/`; counts mandatory (Must) | UI/UX design brief ("Prompt 2") |
| Menu labels | Home, Firewalls, Add Firewall, About | Dashboard, Firewall Inventory, Add Firewall, About | UI/UX design brief |
| Details page | `/firewalls/:id` (Could) | Not implemented | Dropped in the UI/UX design; the Edit page shows every field |
| Delete feedback | Success message after deletion | Success only if something was removed; otherwise an error | Code review finding CQ-02 |
| Asset IDs | "Auto-generated" | Never reused after deletion | QA defect ISS-01 |
| Validation | Rules per field | Also rejects non-text values | Code review finding SEC-03 |
| NFR-ACC-01 | Contrast target | Text passes by calculation; input-border contrast below guideline recorded | Recalculation in Prompt 8 |
