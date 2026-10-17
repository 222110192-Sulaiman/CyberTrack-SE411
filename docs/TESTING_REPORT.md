# CyberTrack — Testing & Quality Assurance Report

| | |
|---|---|
| **Project** | CyberTrack — Firewall Asset Management System |
| **Course** | SE411 Software Engineering · Fall 2026–27 · Project Part 1 |
| **Report date** | 17 October 2026 |
| **Application version** | 1.0.0 |
| **Prepared with** | Claude Code (AI assistant), at the direction of the project team ("Prompt 4 — Software Testing and Quality Assurance") |
| **Last updated** | 17 October 2026: 12 tests added for the code review corrections ("Prompt 7"; see [Code Review §10](CODE_REVIEW.md#10-corrections-applied)) |

---

## 1. Summary

| Check | Command | Result |
|---|---|---|
| Automated tests | `npm test` | ✅ **113 / 113 passed** (6 test files, ≈17 s) |
| Linting | `npm run lint` | ✅ 0 errors, 0 warnings |
| Production build | `npm run build` | ✅ Succeeded, no warnings (JS 303.6 kB / 96.2 kB gzip; CSS 32.3 kB / 6.7 kB gzip) |
| Dependency audit | `npm audit` | ✅ 0 vulnerabilities |

**Issues found:** during the QA pass, 1 application defect (Asset IDs reused after deletion) and 1 test defect (an About-page test that depended on placeholder text). The later code review found 3 more application defects: a keyboard shortcut escaping the delete dialog, a misleading delete message, and missing type checks in the data service. All are fixed and covered by regression tests. See Section 6.

The automated suite covers every mandatory feature of the Part 1 specification: **Create, Read (display), Update, Delete, Search, navigation (menu), the About page and form validation** (Section 5).

---

## 2. Scope

### 2.1 In scope
- All functional requirements of Part 1: firewall add, display, update, delete, search, menu navigation, Dashboard statistics and the About page.
- Client-side input validation and data-layer rules (uniqueness, ID generation, immutability of system fields).
- Accessibility behaviour that can be checked in the DOM: labels, ARIA state, focus management, keyboard operation.
- Basic security behaviour: user input is rendered as text, never as HTML.

### 2.2 Out of scope / not automated
- Backend, database and API (none exist in Part 1, by design).
- Visual appearance, colour contrast and responsive layout. The test environment (jsdom) does not apply CSS, so these need a manual check in a browser (Section 7).
- Performance measurements (Lighthouse) and cross-browser runs.

---

## 3. Test Strategy

### 3.1 Test levels

| Level | What is tested | Files | Tests |
|---|---|---|---|
| **Unit** | Validation rules, search and formatting helpers, in-memory data service | `validation.test.js`, `format.test.js`, `firewallService.test.js` | 50 |
| **Component** | `FirewallForm` (error handling, double-submit guard), `ToastProvider`, context hooks | `FirewallForm.test.jsx`, `ToastProvider.test.jsx` | 12 |
| **Integration (UI)** | The full app (router, providers, pages) driven like a user: clicking, typing, keyboard | `App.test.jsx` | 51 |
| | | **Total** | **113** |

### 3.2 Approach
- **Requirement-based:** test cases are derived from the functional requirements (FR-…) and Given/When/Then acceptance criteria (AC-…) in the Requirements Analysis.
- **User-centred queries:** UI tests find elements by accessible role and name (`getByRole('button', { name: 'Delete DMZ-FW-01' })`), the way a user or screen reader does. A test therefore fails if an element loses its accessible label.
- **Isolation:** every UI test renders the app with a **fresh in-memory data service** (`src/test/renderApp.jsx`), so tests never affect each other and run in any order.
- **Positive, negative and boundary cases:** valid input, missing and invalid input, duplicates, limits (2–50 characters, 500-character notes, IPv4 octet 255/256), empty collections.
- **Test-first defect confirmation:** a suspected defect was confirmed with a failing test before it was fixed (Section 6, ISS-01).

### 3.3 Tools and environment

| Item | Version |
|---|---|
| OS | Windows 11 Pro (10.0.26200) |
| Node.js / npm | 24.15.0 / 11.12.1 |
| Test runner | Vitest 5.0.5 (`jsdom` 30 environment) |
| UI testing | React Testing Library 16.3, user-event 14.6, jest-dom 7.0 |
| Linting | ESLint 10 with `react-hooks` and `react-refresh` rules |
| Application | React 19.3, React Router 7.18, Vite 8.3 |

No extra dependencies were added for this QA pass.

### 3.4 How to run

```bash
npm install
npm test          # run all automated tests once
npm run test:watch
npm run lint
npm run build
```

---

## 4. Test Cases and Results

**Expected result** is what the test asserts. **Actual result** is the outcome of the run on 17 October 2026. Rows marked *(×n)* are one parameterised test executed for *n* inputs.

### 4.1 Unit — Validation (`src/utils/validation.test.js`, 23 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-VAL-01 *(×4)* | §4.3 IP rule | Valid IPv4: `0.0.0.0`, `10.0.0.1`, `192.168.1.254`, `255.255.255.255` | Accepted | ✅ Pass |
| TC-VAL-02 *(×7)* | §4.3 IP rule | Invalid IPv4: `256.1.1.1`, `10.0.0`, `10.0.0.1.5`, `01.2.3.4`, letters, empty, leading space | Rejected | ✅ Pass |
| TC-VAL-03 | FR-ADD-04 | Fully valid firewall | No errors | ✅ Pass |
| TC-VAL-04 | FR-ADD-04 | All required fields empty | Errors for name, manufacturer, model, IP, location, status | ✅ Pass |
| TC-VAL-05 | §4.3 | Whitespace-only name | "Name is required" | ✅ Pass |
| TC-VAL-06 | §4.3 | Name of 1 / 51 characters; name containing `<script>` | Length error / character error | ✅ Pass |
| TC-VAL-07 | §4.3 | Name equal to an existing one, different case | "A firewall with this name already exists" | ✅ Pass |
| TC-VAL-08 | §4.3 | IP already assigned | "This IP address is already assigned" | ✅ Pass |
| TC-VAL-09 | AC-UPD-04 | Record keeps its own name and IP during edit | No uniqueness errors | ✅ Pass |
| TC-VAL-10 | AC-ADD-03 | IP `256.1.1.1` | "Enter a valid IPv4 address" | ✅ Pass |
| TC-VAL-11 | §4.3 | Manufacturer / status not in allowed list | Both rejected | ✅ Pass |
| TC-VAL-12 | §4.3 | Optional fields empty; serial with a space; firmware > 20; notes > 500 | Empty accepted; others rejected | ✅ Pass |
| TC-VAL-13 | §4.3 | Purchase date in the future; `2024-02-30` | "cannot be in the future"; "Enter a valid date" | ✅ Pass |
| TC-VAL-14 | SEC-03 | Numeric name and `null` location | "Invalid value: text expected" for name; "Location is required"; no exception | ✅ Pass *(failed before fix: TypeError)* |

### 4.2 Unit — Data service (`src/services/firewallService.test.js`, 21 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-SVC-01 | FR-DSP-02 | Load seeded data | 10 firewalls returned | ✅ Pass |
| TC-SVC-02 | NFR-MNT-02 | Mutate a returned object | Stored record unchanged | ✅ Pass |
| TC-SVC-03 | — | Delete from one service instance | Shared seed data untouched | ✅ Pass |
| TC-SVC-04 | FR-ADD-03 | Create with padded name | ID `FW-0011` generated, name trimmed, timestamps set | ✅ Pass |
| TC-SVC-05 | Security | Create with `id`, `createdAt`, unknown `isAdmin` | Ignored; system ID used; unknown field dropped | ✅ Pass |
| TC-SVC-06 | FR-ADD-04 | Create with duplicate / malformed IP | Rejected with field errors | ✅ Pass |
| TC-SVC-07 | FR-UPD-04, FR-UPD-07 | Update status | Status changed, `createdAt` kept, `updatedAt` later | ✅ Pass |
| TC-SVC-08 | FR-ADD-03 | Delete FW-0010, then create | New ID is `FW-0011` (no reuse) | ✅ Pass *(failed before fix — ISS-01)* |
| TC-SVC-09 | FR-UPD-05 | Update input tries to change `id` / `createdAt` | Both preserved | ✅ Pass |
| TC-SVC-10 | FR-UPD-03 | Update to another firewall's IP | Rejected; record unchanged | ✅ Pass |
| TC-SVC-11 | — | Update unknown ID | `NotFoundError` | ✅ Pass |
| TC-SVC-12 | FR-DEL-03 | Remove existing, then remove again | `true`, then `false` | ✅ Pass |
| TC-SVC-13 | FR-SRC-02 | Search by manufacturer, ID, IP, location; empty; no match | Correct matches in each case | ✅ Pass |
| TC-SVC-14 | SEC-03 | Create with numeric name in an **empty** store | `ValidationError` "Invalid value: text expected"; nothing stored | ✅ Pass *(failed before fix: record was stored)* |
| TC-SVC-15 | SEC-03 | Create with numeric name when firewalls exist | `ValidationError`, not `TypeError` | ✅ Pass *(failed before fix: TypeError)* |
| TC-SVC-16 *(×4)* | SEC-03 | Create with object `model`, array `ipAddress`, boolean `status`, numeric `notes` | `ValidationError` for that field; nothing stored | ✅ Pass *(failed before fix: 3 stored, 1 wrong message)* |
| TC-SVC-17 | SEC-03 | Update with numeric `location` | `ValidationError`; record unchanged | ✅ Pass *(failed before fix)* |
| TC-SVC-18 | SEC-03 | `create(null)` | `ValidationError` ("Name is required" …) | ✅ Pass *(failed before fix: TypeError)* |

### 4.3 Unit — Helpers (`src/utils/format.test.js`, 6 tests)

| ID | Test case | Expected result | Actual |
|---|---|---|---|
| TC-FMT-01 | `percentOf(1,3)`, `percentOf(6,10)` | 33, 60 | ✅ Pass |
| TC-FMT-02 | `percentOf(0,0)` | 0 (no division by zero) | ✅ Pass |
| TC-FMT-03 | Avatar initials from names | `SA`, `AS`, `F` | ✅ Pass |
| TC-FMT-04 | Initials for placeholder / empty name | Fallback `M1` / `M2` | ✅ Pass |
| TC-FMT-05 | Blank search term | Every record matches | ✅ Pass |
| TC-FMT-06 | Search for text that only appears in notes | No match (notes are not a search field) | ✅ Pass |

### 4.4 Component (`FirewallForm.test.jsx` 8 tests, `ToastProvider.test.jsx` 4 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-FRM-01 | FR-UPD-04 | Save valid form | `onSubmit` receives current values | ✅ Pass |
| TC-FRM-02 | FR-ADD-05 | Save with a client-side error | Not submitted; focus on invalid field | ✅ Pass |
| TC-FRM-03 | NFR-MNT-02 | Data service rejects with field errors | Errors shown inline; focus on field | ✅ Pass |
| TC-FRM-04 | NFR-USA-03 | Data service fails unexpectedly | General error alert shown | ✅ Pass |
| TC-FRM-05 | — | Press Save twice while saving | Submitted once; button shows "Saving…" | ✅ Pass |
| TC-FRM-06 | FR-ADD-07 | Cancel | `onCancel` called; nothing submitted | ✅ Pass |
| TC-FRM-07 | §4.3 | Type in Notes | Counter updates `0 / 500` → `3 / 500` | ✅ Pass |
| TC-FRM-08 | FR-ADD-03 | Add mode | "Save Firewall" label; no Asset ID field | ✅ Pass |
| TC-TST-01 | NFR-ACC-03 | Show a message | Announced in `role="status"` `aria-live="polite"` | ✅ Pass |
| TC-TST-02 | NFR-USA-03 | Wait 4 s | Message still present at 3.999 s, gone at 4 s | ✅ Pass |
| TC-TST-03 | — | Click "Dismiss notification" | Message removed | ✅ Pass |
| TC-TST-04 | NFR-MNT | Use hooks outside their provider | Clear error message thrown | ✅ Pass |

### 4.5 Integration — Navigation and layout (`App.test.jsx`, 8 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-NAV-01 | FR-NAV-01/02 | Menu on a page | Dashboard, Firewall Inventory, Add Firewall, About links present | ✅ Pass |
| TC-NAV-02 | AC-NAV-01 | Click each menu item in turn | Matching page heading shown each time | ✅ Pass |
| TC-NAV-03 | AC-NAV-02 | Navigate Dashboard → About | Active item moves (`aria-current="page"`) | ✅ Pass |
| TC-NAV-04 | Design §4.2 | Open an Edit page | "Firewall Inventory" stays active | ✅ Pass |
| TC-NAV-05 | Design §4.2 | Open Add page | Only "Add Firewall" active | ✅ Pass |
| TC-NAV-06 | Design §7.2 | Mobile menu: open, Esc, choose link | `aria-expanded` toggles; focus moves into menu and back to button; choosing a link closes it | ✅ Pass |
| TC-NAV-07 | NFR-ACC-02 | Skip link | Links to `#main` | ✅ Pass |
| TC-NAV-08 | AC-NAV-03 | Unknown URL | "Page not found" with link to Dashboard | ✅ Pass |

### 4.6 Integration — About page (3 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-ABT-01 | FR-ABT-02, AC-ABT-01 | Open About | Four member cards, each with name and student ID from `team.js` | ✅ Pass |
| TC-ABT-02 | FR-ABT-02 | Check team data | Exactly 4 members; no placeholders; numeric student IDs | ✅ Pass |
| TC-ABT-03 | FR-ABT-03 | Open About | Project overview, course and semester shown | ✅ Pass |

### 4.7 Integration — Dashboard (5 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-DSH-01 | FR-HOM-02 | Open Dashboard | Total 10, Active 6, Inactive 2, Maintenance 1, "incl. 1 decommissioned", "60% of total" | ✅ Pass |
| TC-DSH-02 | FR-DSP-03 | Empty collection | All counts 0, "0% of total", add prompt | ✅ Pass |
| TC-DSH-03 | FR-HOM-02 | Add an Inactive firewall, return to Dashboard | Total 11, Inactive 3 | ✅ Pass |
| TC-DSH-04 | FR-HOM-02 | Delete the only Maintenance firewall | Total 9, Maintenance 0 | ✅ Pass |
| TC-DSH-05 | Design §5.1 | Quick access | "View Firewall Inventory" links to `/firewalls` | ✅ Pass |

### 4.8 Integration — Inventory: display, search, delete (17 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-INV-01 | FR-DSP-01, AC-DSP-01 | Open inventory | 10 rows with ID, name, manufacturer, IP, location, status, Edit & Delete; "Showing 10 of 10" | ✅ Pass |
| TC-INV-02 | FR-DSP-05 | Status column | Inactive, Maintenance, Decommissioned shown as text badges | ✅ Pass |
| TC-INV-03 | AC-DSP-02 | Empty collection | "No firewalls registered"; no table | ✅ Pass |
| TC-INV-04 | AC-DSP-02 | Delete the last firewall | Empty state appears | ✅ Pass |
| TC-INV-05 | AC-SRC-01/03/04 | Type `FORTI`, then `zzzz`, then clear | 2 rows → no-match message with term → 10 rows | ✅ Pass |
| TC-INV-06 *(×4)* | FR-SRC-02, AC-SRC-02 | Search by IP prefix `172.16`, location `khobar`, ID `fw-0007`, manufacturer `palo alto` | Exactly the expected firewalls | ✅ Pass |
| TC-INV-07 | FR-SRC-02 | Search `  sophos  ` | Spaces ignored; 1 row | ✅ Pass |
| TC-INV-08 | Design §5.2 | Press `/`, type, press Esc | Search focused; list filters; Esc clears | ✅ Pass |
| TC-INV-09 | FR-DEL-02/03/05, AC-DEL-01/02 | Delete DMZ-FW-01 and confirm | Dialog names firewall and ID, focus on Cancel; row removed; count 9; toast; focus to main | ✅ Pass |
| TC-INV-10 | FR-DEL-04, AC-DEL-03 | Cancel, Esc, and backdrop click | Dialog closes each time; no deletion; after Cancel, focus returns to the Delete button | ✅ Pass |
| TC-INV-11 | NFR-ACC-03 | Tab / Shift+Tab in dialog | Focus cycles between Cancel and Delete only | ✅ Pass |
| TC-INV-12 | CQ-01, NFR-ACC-03 | Press `/` while the delete dialog is open | Focus stays on Cancel; search box not focused | ✅ Pass *(failed before fix)* |
| TC-INV-13 | CQ-02, FR-DEL-05 | Delete a firewall that the store no longer contains | Error toast "…was not found. It may have already been deleted."; no success toast; stale row removed | ✅ Pass *(failed before fix: success toast shown, row kept)* |
| TC-INV-14 | NFR-USA-03 | Deletion throws an error | Error toast "could not be deleted"; no success toast; row kept | ✅ Pass |

### 4.9 Integration — Add Firewall (9 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-ADD-01 | FR-ADD-01…06, AC-ADD-01 | Fill required fields, Save | Inventory shows new row `FW-0011`, count 11, success toast | ✅ Pass |
| TC-ADD-02 | FR-ADD-02 | Fill all fields with padded values | All stored; values trimmed; default status Active | ✅ Pass |
| TC-ADD-03 | AC-ADD-02 | Save empty form | "Name is required", `aria-invalid`, error linked by `aria-describedby`, focus on Name, summary "5 errors", nothing saved | ✅ Pass |
| TC-ADD-04 | Design §5.3 | Type an invalid IP before saving | No error shown yet | ✅ Pass |
| TC-ADD-05 | Design §5.3 | After a failed save, fix the name | Error disappears immediately | ✅ Pass |
| TC-ADD-06 | Design §5.3 | Click an entry in the error summary | Focus moves to that field | ✅ Pass |
| TC-ADD-07 | AC-ADD-03/04 | IP `256.1.1.1`, then `10.0.0.1` | Format error, then duplicate error | ✅ Pass |
| TC-ADD-08 | §4.3 | Name `dmz-fw-01` (exists in upper case) | Duplicate-name error; nothing saved | ✅ Pass |
| TC-ADD-09 | AC-ADD-05 | Fill form, Cancel | Back to inventory; count unchanged | ✅ Pass |

### 4.10 Integration — Edit Firewall (7 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-UPD-01 | AC-UPD-01 | Click Edit on HQ-EDGE-FW-01 | Form pre-filled; Asset ID `FW-0001` read-only | ✅ Pass |
| TC-UPD-02 | AC-UPD-02 | Change status to Maintenance, Save | Inventory row shows Maintenance; toast; stored | ✅ Pass |
| TC-UPD-03 | AC-UPD-04 | Save without changes | Succeeds (own IP is not a duplicate) | ✅ Pass |
| TC-UPD-04 | AC-UPD-03 | Clear Location, Save | "Location is required"; stored record unchanged | ✅ Pass |
| TC-UPD-05 | FR-UPD-03 | Rename to another firewall's name | Duplicate-name error | ✅ Pass |
| TC-UPD-06 | FR-UPD-06, AC-UPD-05 | Change Location, Cancel | Original value kept in table and store | ✅ Pass |
| TC-UPD-07 | Design §5.3 | Open `/firewalls/FW-9999/edit` | "Firewall not found" with Back to Inventory | ✅ Pass |

### 4.11 Integration — Security (2 tests)

| ID | Requirement | Test case | Expected result | Actual |
|---|---|---|---|---|
| TC-SEC-01 | NFR-SEC-02 | Save location `<img src=x onerror=alert(1)>` | Shown as literal text; no `<img>` element created | ✅ Pass |
| TC-SEC-02 | NFR-SEC-01 | Name `<b>FW</b>` | Rejected by validation | ✅ Pass |

---

## 5. Coverage of Mandatory Requirements

| Professor's requirement | Covered by | Status |
|---|---|---|
| React project | Whole suite runs against the React app | ✅ |
| Menu to navigate between features | TC-NAV-01…08 | ✅ |
| **Add** elements | TC-ADD-01…09, TC-SVC-04…06, TC-DSH-03 | ✅ |
| **Display** elements | TC-INV-01…04, TC-DSH-01/02, TC-SVC-01 | ✅ |
| **Update** elements | TC-UPD-01…07, TC-SVC-07, 09, 10, TC-FRM-01 | ✅ |
| **Delete / remove** elements | TC-INV-09…14, TC-INV-04, TC-DSH-04, TC-SVC-12 | ✅ |
| **Search** elements | TC-INV-05…08, TC-SVC-13, TC-FMT-05/06 | ✅ |
| **Form validation** | TC-VAL-01…14, TC-SVC-14…18, TC-ADD-03…08, TC-UPD-04/05, TC-FRM-02/03 | ✅ |
| About page with team (name, student ID) + menu item | TC-ABT-01…03, TC-NAV-02 | ✅ |
| Data as an in-memory collection of objects | TC-SVC-01…03 | ✅ |

**Line/branch coverage** percentages were not measured, because that needs an additional package (`@vitest/coverage-v8`) and this QA pass was asked not to add unnecessary dependencies. Coverage is shown above by requirement instead.

---

## 6. Issues Found

| ID | Type | Severity | Description | Found by | Resolution | Status |
|---|---|---|---|---|---|---|
| **ISS-01** | Application defect | Medium | **Asset IDs were reused after deletion.** The next ID was "highest current ID + 1", so after deleting FW-0010 the next new firewall was also given FW-0010. An inventory ID should identify one asset permanently. | New test TC-SVC-08 (failed: expected `FW-0011`, received `FW-0010`) | `firewallService.js` now keeps a sequence counter that only increases. | ✅ Fixed and verified |
| **ISS-02** | Test defect | Low | The About-page test looked for the placeholder text "Team Member N". It failed (52/53 passing) once the team entered the real names in `team.js`. | Baseline test run | Test now reads the expected names and IDs from `team.js`. TC-ABT-02 was added to ensure no placeholders remain. | ✅ Fixed |
| ISS-03 | Test defect (during implementation) | Low | A search test found two buttons named "Clear search" (the icon in the search box and the empty-state button). | First test run during implementation | Test targets the empty-state text button. Both buttons are intended. | ✅ Fixed |
| ISS-04 | Test defect (during implementation) | Low | The edit-save test checked the table before the page change finished. React Router 7 runs navigations as React transitions, so the success message renders a moment before the new page. | First test run during implementation | Test waits for the Inventory page heading. | ✅ Fixed |
| **ISS-05** | Application defect | Low | **The `/` search shortcut moved focus out of the open delete dialog** (code review CQ-01). | Code review probe; regression test TC-INV-12 | `SearchBar.jsx` ignores the shortcut while a modal dialog (`aria-modal="true"`) is open. | ✅ Fixed and verified |
| **ISS-06** | Application defect | Low | **A delete that removed nothing was reported as successful.** The row also stayed listed (code review CQ-02). It could not occur in normal Part 1 use but would with a backend. | Code review probe; TC-INV-13 | `InventoryPage.jsx` checks the result of `deleteFirewall()` and shows an error toast when nothing was removed; `FirewallProvider.jsx` removes the stale row. | ✅ Fixed and verified |
| **ISS-07** | Application defect | Low | **The data service accepted non-text values.** A numeric name was stored, and other cases threw `TypeError` (code review SEC-03). Not reachable through the form. | Code review probe; TC-VAL-14, TC-SVC-14…18 | `validateFirewall()` rejects any non-text field with "Invalid value: text expected"; `firewallService` treats a missing input object as empty. | ✅ Fixed and verified |
### Observations (not defects)

| ID | Observation | Comment |
|---|---|---|
| OBS-01 | Data resets to the sample firewalls when the page is reloaded. | Expected in Part 1 (in-memory data only, as the specification requires). Part 2 adds persistence. |
| OBS-02 | After saving an edit, the Edit page can show the new "Last updated" time for a split second before the Inventory page appears (same cause as ISS-04). | Cosmetic; not noticeable in normal use. |
| OBS-03 | Avatar initials take the first letters of the first and last name (e.g. "Sulaiman AlHoshan" → "SA"). | As designed. |

---

## 7. Manual Testing

The project team reports that the core CRUD and search features were tested manually in the browser. The results of those sessions are not recorded in this report. The checklist below covers what automated tests **cannot** verify; the team should fill in the results.

| ID | Check | How | Result |
|---|---|---|---|
| MT-01 | Layout at desktop (≥1024 px): sidebar visible, 4 stat cards in a row | Browser at full width | ☐ |
| MT-02 | Layout at tablet (640–1023 px): top bar + drawer menu; Manufacturer/Location columns hidden below 900 px | DevTools device toolbar | ☐ |
| MT-03 | Layout at phone (360 px): table becomes cards; no horizontal page scroll | DevTools, iPhone/Android preset | ☐ |
| MT-04 | Colours, status badges and focus rings look as designed | Visual inspection | ☐ |
| MT-05 | Keyboard-only walkthrough: add, edit, delete a firewall | Tab / Enter / Esc only | ☐ |
| MT-06 | Works in Chrome, Edge and Firefox | Open `npm run preview` in each | ☐ |
| MT-07 | Lighthouse Accessibility ≥ 90, Performance ≥ 85 (NFR-ACC-04, NFR-PER-02) | Chrome DevTools → Lighthouse on `npm run preview` | ☐ |

---

## 8. Conclusion

All 113 automated tests pass, the production build succeeds without warnings, ESLint reports no problems and the dependencies have no known vulnerabilities. Every mandatory Part 1 feature is covered by tests. All four application defects found (Asset ID reuse in QA; ISS-05 to ISS-07 in the code review) have been fixed and are guarded by regression tests. Remaining work is the manual checklist in Section 7, which covers appearance, responsiveness and browser compatibility.
