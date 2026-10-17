# CyberTrack — Code Review Report

| | |
|---|---|
| **Project** | CyberTrack — Firewall Asset Management System |
| **Course** | SE411 Software Engineering · Fall 2026–27 · Project Part 1 |
| **Review date** | 17 October 2026 |
| **Code reviewed** | Version 1.0.0: all files in `src/`, configuration files, `package.json`, and the documents in `docs/` and `README.md` |
| **Reviewer** | Claude Code (AI assistant), at the direction of the project team ("Prompt 6 — AI-Assisted Code Review and Complexity Assessment") |
| **Related documents** | [Requirements Analysis](REQUIREMENTS_ANALYSIS.md) · [Architecture](ARCHITECTURE.md) · [Technical Documentation](TECHNICAL_DOCUMENTATION.md) · [Testing Report](TESTING_REPORT.md) |

---

## Summary

| Area | Result |
|---|---|
| Mandatory Part 1 requirements | ✅ All supported |
| High-severity findings | **0** |
| Medium-severity findings | **1**: a repository/process issue (REPO-01), not a code defect |
| Low-severity code findings | **5**: edge cases; 3 confirmed with test probes (SEC-03, CQ-01, CQ-02) |
| Informational code notes | 18 (several are positive findings) |
| Documentation findings | 3 Low, 4 Info (Section 7) |
| Automated tests / lint / build / audit at review time | ✅ 101/101 pass · 0 lint problems · build OK · 0 known vulnerabilities |
| **Verdict** | **Suitable for SE411 Part 1 submission.** No code change is strictly required. Three small fixes are recommended (Section 8). |
| **Update: corrections applied** | ✅ CQ-01, CQ-02 and SEC-03 fixed with 12 new tests; DOC-01, DOC-02, DOC-03 and DOC-07 corrected. After the fixes: **113/113 tests pass**, 0 lint problems, build OK, 0 vulnerabilities. See **[Section 10](#10-corrections-applied)**. |

> **Important limitation:** this review was carried out by the same AI assistant that wrote the code. That limits its independence, because a reviewer tends to share the assumptions of the author. The team should read the findings critically, and a human review (for example by a team member who did not direct the implementation) is recommended.

---

## 1. Methodology and Scope

### 1.1 Method

1. **Static reading** of every application source file, comparing each with the professor's specification, the requirements analysis and the UI/UX design.
2. **Pattern search** across `src/` for risky code: `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, `localStorage`/`sessionStorage`, `fetch`, external URLs, `target="_blank"`, `console.log`.
3. **Tool checks:** `npm test`, `npm run lint`, `npm run build`, `npm audit` (all dependencies and production only), `npm outdated`, and a check for source maps in `dist/`.
4. **Probe tests:** four suspected problems were tested with temporary tests run *outside* the project (they were not added to the codebase). Each finding is labelled with how it was verified:
   - **Confirmed (probe):** reproduced by a test.
   - **Confirmed (inspection):** directly visible in the code.
   - **Plausible:** likely from reading the code, but depends on browser or screen-reader behaviour that was not tested.
5. **Documentation comparison:** each statement in `README.md` and `docs/*.md` that describes behaviour was checked against the code.

### 1.2 Severity scale

| Severity | Meaning |
|---|---|
| **High** | Breaks a mandatory feature, loses data, or exposes users to a security risk |
| **Medium** | Real risk to correctness, security or submission, but limited in scope |
| **Low** | Edge case or quality issue; the user can still complete their task |
| **Info** | Observation, positive finding, or suggestion with no current defect |

### 1.3 Not covered

- Manual testing in real browsers and with screen readers.
- Lighthouse or other performance and contrast measurements.
- Security of a future backend (none exists).
- **Automated tests cannot prove the absence of security problems.** The security statements below describe what was checked, not a guarantee.

---

## 2. Security Findings

**Overall:** for a frontend-only application with no network access, no storage and no authentication, the attack surface is very small. No unsafe rendering was found.

| ID | Severity | Verified | Finding | Location |
|---|---|---|---|---|
| SEC-01 | Info (positive) | Inspection + test | **No unsafe HTML rendering.** The pattern search found no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` or `document.write` in `src/`. All user text is rendered through JSX, which React escapes. Test TC-SEC-01 confirms that `<img src=x onerror=alert(1)>` entered as a location is displayed as text and creates no element. The only URL in `src/` is an inline SVG `data:` URI for the select-box arrow. | `src/**` · `Inputs.module.css:40` |
| SEC-02 | Info | Inspection | **Validation runs only in the browser.** This is fine for Part 1, but browser-side checks can be bypassed by anyone who calls an API directly. The Part 2 backend must repeat all rules on the server. | `utils/validation.js`, `services/firewallService.js` |
| SEC-03 | **Low** | **Confirmed (probe)** | **The data service does not check value *types*.** A non-string value reaches `validateFirewall()` unchanged. Probe result: `create({ name: 12345, … })` **stored a firewall with a numeric name** when the store was empty, and threw `TypeError: name.toLowerCase is not a function` when other firewalls existed. **Users cannot trigger this**, because form inputs always produce strings. It matters for Part 2, where data will arrive from HTTP requests. *Fix:* convert each editable field to a string in `pickEditable()` (one line). | `firewallService.js:23-27`, `validation.js:47-53` |
| SEC-04 | Info | Tool | **Dependencies:** `npm audit` reports **0 vulnerabilities** for all dependencies and for production dependencies, and `npm outdated` lists nothing, as of 17 October 2026. This is a point-in-time result. `package.json` uses `^` version ranges and `package-lock.json` records exact versions, so the lock file should be committed. | `package.json`, `package-lock.json` |
| SEC-05 | Info (positive) | Inspection + tool | **No secrets, network calls, browser storage or external runtime resources.** No `.env` files exist and `.env*` is git-ignored. The Inter font is bundled locally. The production build contains **no source maps** (0 `.map` files in `dist/`). | `.gitignore`, `main.jsx`, `dist/` |
| SEC-06 | Info | Inspection | **No Content-Security-Policy.** This is not needed for local use in Part 1, but a static hosting configuration could add one if the app is deployed. | `index.html` |
| REPO-01 | **Medium** | Inspection | **The professor's specification file would be published.** `project description Part 1 (4).docx` is in the project root and is not excluded by `.gitignore`, so pushing to the required **public** GitHub repository would publish course material. *Decision needed by the team:* move the file out of the project folder, or add it to `.gitignore`. | Project root, `.gitignore` |

---

## 3. Performance Findings

**Overall:** performance is not a concern at this scale (10 sample records, a few hundred at most in practice). No problems were found. Some optimisations are present that this data size does not need.

| ID | Severity | Finding | Location |
|---|---|---|---|
| PERF-01 | Info (positive) | **Search** runs `filterFirewalls()` (one pass over the list, up to 5 string comparisons per record) on each keystroke, wrapped in `useMemo`. At 10 records this is microseconds, and it would remain fast for thousands of records. No debouncing is needed. | `InventoryPage.jsx:27`, `utils/search.js` |
| PERF-02 | Info | **`useMemo` is used where it is not needed** (Dashboard counts and the context `value` objects). It is harmless and a useful teaching example, but not required for performance at this size. | `DashboardPage.jsx:21`, `FirewallProvider.jsx:57`, `ToastProvider.jsx:26` |
| PERF-03 | Info | **Context updates re-render every consumer.** Any add, edit or delete re-renders all components that use `useFirewalls()`. With six pages and a small list this is fine. | `context/FirewallProvider.jsx` |
| PERF-04 | Info | **Form re-validation** runs `validateFirewall()` (a single pass for the uniqueness checks) on every keystroke after the first failed save. This is negligible at this size. | `FirewallForm.jsx:53-59` |
| PERF-05 | Info | **Bundle:** 303.3 kB JavaScript (96.1 kB gzipped), mostly React and React Router. Icons are imported individually, so only the icons used are bundled. Routes are not code-split, which is unnecessary for six small pages. The Inter font ships 4 weights; browsers download only the character subsets a page uses. | `dist/` |
| PERF-06 | Info | **Toast timers are not cancelled** if the provider unmounts. This has no visible effect, because the provider lives for the whole session. | `ToastProvider.jsx:21` |

---

## 4. Code Quality and Reusability Findings

### 4.1 Strengths

- **Clear separation of responsibilities:** pages handle user actions, components only render, `utils/` holds pure rules, and `services/` is the only code that touches stored data. This was confirmed by searching imports: no page imports `firewallService` directly.
- **Real reuse:** one `FirewallForm` serves Add and Edit, one `validateFirewall()` serves both the form and the service, and generic components (`Button`, `Card`, `EmptyState`, `ConfirmDialog`) are each used in several places.
- **Consistent naming:** PascalCase components, `useX` hooks, `handleX` event handlers, and descriptive constants (`EMPTY_FIREWALL`, `FIREWALL_FIELDS`).
- **Small files:** the largest is `FirewallForm.jsx` at 244 lines. Most components are under 60 lines.
- **Defensive data handling:** records are copied in and out of the store, system fields cannot be overwritten, and IDs are never reused (fixed in QA, ISS-01).
- **ESLint is clean**, including the React Hooks rules.

### 4.2 Findings

| ID | Severity | Verified | Finding | Location |
|---|---|---|---|---|
| CQ-01 | **Low** | **Confirmed (probe)** | **The `/` shortcut escapes the delete dialog.** While the confirmation dialog is open with focus on Cancel, pressing `/` moves focus to the search box behind the dialog, breaking the dialog's focus trap. The shortcut ignores key presses only when focus is in an input, textarea or select. *Fix:* also ignore it while a modal (`[aria-modal="true"]`) is open (about 1 line plus a test). | `SearchBar.jsx:11-18` |
| CQ-02 | **Low** (latent) | **Confirmed (probe)** | **A failed delete is reported as successful.** `deleteFirewall()` returns `false` when the record was not found, but `InventoryPage` ignores the return value and always shows *"Firewall … deleted"*. The probe showed the success message while the row was still listed. **This cannot happen in Part 1** (the store and the screen always agree), but it will be possible with a backend. *Fix:* check the returned value and show the existing error message (about 3 lines plus a test). | `InventoryPage.jsx:33-34`, `FirewallProvider.jsx:45-52` |
| CQ-03 | Low | Plausible | **The error summary may be announced repeatedly.** It has `role="alert"` and its content changes on every keystroke after a failed save (errors disappear as they are fixed). Some screen readers re-announce alert content on each change. Focus already moves to the first invalid field, which carries its own linked message. *Fix:* remove `role="alert"` from the summary, or announce it once. This needs checking with a screen reader. | `FirewallForm.jsx:128-129` |
| CQ-04 | Low | Inspection | **The `'error'` loading state is never shown.** `FirewallProvider` can set `status` to `'error'`, but no page handles it, so a load failure would look like an empty inventory. This cannot happen with in-memory data and is already documented as Part 2 work. | `FirewallProvider.jsx:22` |
| CQ-05 | Info | Inspection | **Duplicated modal logic.** The focus trap, Escape handling and page-scroll locking are written twice, about 30 similar lines each, in the mobile drawer and the delete dialog. A shared `useFocusTrap` hook would remove the duplication but adds another abstraction (see Section 5). | `AppLayout.jsx:17-55`, `ConfirmDialog.jsx:26-61` |
| CQ-06 | Info | Inspection | **Unused service methods.** `getById()` and `search()` exist as part of the planned Part 2 interface and are tested, but the UI does not call them. This is acceptable if explained (the docs do so for `search`). | `firewallService.js:52, 88` |
| CQ-07 | Info | Inspection | **Redundant `aria-required="true"`** on six inputs that already have the native `required` attribute, which browsers expose to assistive technology automatically. | `FirewallForm.jsx:163-212` |
| CQ-08 | Info | Inspection | **Styling exception.** `LoadingState` uses an inline `style` object while every other component uses a CSS Module. | `LoadingState.jsx:3` |
| CQ-09 | Info | Inspection | **Unnecessary export.** `DEFAULT_STATUS` is exported but only used inside the same file. | `constants.js:14` |
| CQ-10 | Info | Inspection | **Row highlight can reappear.** The highlighted-row ID travels in browser history state, so returning to the inventory with the Back button highlights the row again. After a reload it refers to an ID that may no longer exist (no visible effect). | `InventoryPage.jsx:21`, `AddFirewallPage.jsx:19`, `EditFirewallPage.jsx:60` |
| CQ-11 | Info | Plausible | **Statistic card names may run together.** In the test environment the accessible name of a statistic card is computed as `"Total Firewalls10incl. 1 decommissioned"`, with no space between label and number. Real browsers may insert spaces between block-level elements, so this needs checking with a screen reader. If confirmed, add an `aria-label` such as "Total Firewalls: 10". | `components/ui/StatCard.jsx` |

---

## 5. Complexity and Undergraduate Appropriateness

### 5.1 Size

| Measure | Value |
|---|---|
| Application JS/JSX files (excluding tests) | 37 files, about 1,760 lines |
| CSS files | 23 (21 CSS Modules + `tokens.css` + `global.css`) |
| Largest file | `FirewallForm.jsx`, 244 lines |
| Shared state | 2 React contexts; no external state library |
| Runtime dependencies | 5 (`react`, `react-dom`, `react-router-dom`, `lucide-react`, `@fontsource/inter`) |
| Automated tests | 101 in 6 files at review time (113 after the corrections in Section 10) |

### 5.2 Assessment by area

| Area | Complexity | Justified? | Comment for presenting |
|---|---|---|---|
| Layered structure (pages → context → utils → service) | Moderate | ✅ Yes | A standard, explainable pattern. Each layer can be described in one sentence (see [Architecture §1](ARCHITECTURE.md#1-overview)). |
| Promise-based service **plus** a copy of the list in React state | Moderate | ✅ For Part 2 | Two copies of the data is the hardest idea to explain. The reason: the service plays the role of the future server, and React state is what the screen shows. |
| `contexts.js` + 2 provider files + 2 hook files (5 files for 2 contexts) | Slightly high | ⚠️ Partly | The split exists mainly to satisfy the `react-refresh` lint rule (component files should export only components). It could be merged into 2 files by relaxing that rule, but this is cosmetic. |
| Form field helpers: `FormField` + `Inputs` + `controlProps()` + `field()` | **Highest in the project** | ⚠️ Partly | They remove a lot of repetitive ARIA wiring, but `field(name, <JSX/>, options)` is unusual and harder to follow than writing each field out. It is the part most likely to cause difficulty in a presentation. |
| Accessibility code (focus traps, live regions, skip link) | Moderate | ✅ Yes | Beyond the specification, but supports the requirements' NFR-ACC goals. It uses `useEffectEvent`, a recent React API (19.2+) that older tutorials do not cover. |
| Responsive table-to-card CSS | Low to moderate | ✅ Yes | CSS only; no extra components. |
| Very recent library versions (React 19.3, Vite 8, React Router 7, ESLint 10, Vitest 5) | — | ⚠️ Note | Some syntax differs from common tutorials, for example `<Context value>` instead of `<Context.Provider value>`. This is worth knowing when explaining the code. |
| `useMemo` on small lists | Low | ⚠️ Not needed | Harmless (PERF-02). |

### 5.3 Overall

The code is **moderately complex but appropriate**. No layer is pointless, and the extra structure (service interface, typed errors, accessibility) is justified by the Part 2 plan and the agreed non-functional requirements. It is more polished than a minimal Part 1 solution. That helps quality, but it means **the team should be ready to explain** the two-copies-of-data design and the form helpers.

**Possible simplifications (optional, not recommended before the deadline):**

| Simplification | Benefit | Risk / cost |
|---|---|---|
| Write the ten form fields out explicitly instead of using `field()` | Easier to read | Roughly 80 more lines of repeated ARIA wiring; must re-run all form tests |
| Merge `contexts.js` and the hook files into the provider files | 3 fewer files | Requires disabling a lint rule; no functional gain |
| Remove `useMemo` where not needed | Slightly simpler | None functionally; little benefit |
| Extract a shared `useFocusTrap` hook (CQ-05) | Removes duplication | Adds an abstraction, so complexity goes up rather than down |

---

## 6. Requirements Compliance

| Professor's Part 1 requirement | Status | Evidence |
|---|---|---|
| React project | ✅ | React 19.3.1, functional components only |
| Manage one kind of asset | ✅ | Firewalls only |
| Menu to navigate between features | ✅ | `Sidebar.jsx`; tests TC-NAV-01…08 |
| Add elements | ✅ | `AddFirewallPage.jsx`; TC-ADD-01…09 |
| Remove / delete elements | ✅ | `InventoryPage.jsx`, `ConfirmDialog.jsx`; TC-INV-09…11 |
| Update elements | ✅ | `EditFirewallPage.jsx`; TC-UPD-01…07 |
| Search elements | ✅ | `SearchBar.jsx`, `utils/search.js`; TC-INV-05…08 |
| Display elements | ✅ | `FirewallTable.jsx`; TC-INV-01…04 |
| About page with team members (name, student ID) + menu item | ✅ | `AboutPage.jsx`, `data/team.js` (4 members filled in); TC-ABT-01…03 |
| Data as a collection of objects, not a database | ✅ | `firewallService.js` in-memory array |
| AI-generated documentation | ✅ | `docs/ARCHITECTURE.md`, `docs/TECHNICAL_DOCUMENTATION.md` |
| AI-generated tests, run | ✅ | 113 tests (after corrections), `docs/TESTING_REPORT.md` |
| AI-generated code review | ✅ | This document |
| Public GitHub repository | ❌ **Not yet done** | Git is not installed; nothing has been pushed (see REPO-01 first) |
| Groups of three students | ⚠️ **Team has four** | Confirm with the professor |

---

## 7. Documentation Consistency

The documentation was checked statement by statement against the code. Routes, features, the data model, validation rules and messages, ID generation, scripts, library versions and build size all **match the implementation**. The differences found:

| ID | Severity | Document | Statement | Actual behaviour |
|---|---|---|---|---|
| DOC-01 | Low | `ARCHITECTURE.md` §6 | Service validation means "invalid data can never be saved even if a caller skips the form" | Overstated: a caller that passes non-string values can save invalid data (SEC-03). Correct once SEC-03 is fixed, or soften the wording. |
| DOC-02 | Low | `TECHNICAL_DOCUMENTATION.md` §4.6 | "If deletion fails, an error toast is shown" | True when deletion throws; a "not found" result shows a success message (CQ-02). |
| DOC-03 | Low | `ARCHITECTURE.md` §12 | "colours chosen for WCAG AA contrast" | The contrast ratios were **calculated during design**, not measured on the built app. Verify with Lighthouse or axe (Testing Report MT-07), or reword to "designed to meet". |
| DOC-04 | Info | `ARCHITECTURE.md` §4.3 | "Each component has its own CSS Module" | `LoadingState` uses inline styles (CQ-08). The exception is noted only in the Technical Documentation. |
| DOC-05 | Info | `README.md` | Project structure and documentation list | Omits `src/test/`; does not yet link this code review. |
| DOC-06 | Info | Outside the repository | Requirements Analysis and UI/UX Design | Exist only in the AI conversation. They still describe a 3-member team, a "Home" page and a Details page, and are not in `docs/`. |
| DOC-07 | Info | `README`, `ARCHITECTURE`, `TECHNICAL_DOCUMENTATION`, `TESTING_REPORT` | "101 tests" | Correct now; must be updated in all four places if tests are added by fixes. |

> DOC-01, DOC-02, DOC-03 and DOC-07 have since been corrected (Section 10.2).

---

## 8. Recommended Improvements (ranked)

### 8.1 Necessary before submission

These are **not code changes**, but the specification requires them or they carry submission risk.

| # | Item | Severity | Effort |
|---|---|---|---|
| N1 | **Decide on the specification `.docx`** before the first push: move it out of the folder, or add it to `.gitignore` (REPO-01) | Medium | 1 minute |
| N2 | **Install Git and create the public GitHub repository** (specification requirement); one member submits the URL | Required | 15–30 minutes |
| N3 | **Confirm that a four-person team is acceptable** (the specification says three) | Compliance | — |

### 8.2 Recommended code fixes (small, low risk)

| # | Finding | Change | Effort | Risk |
|---|---|---|---|---|
| R1 | CQ-01 | Ignore the `/` shortcut while a modal is open; add 1 test | ~2 lines | Very low |
| R2 | CQ-02 + DOC-02 | Check `deleteFirewall()`'s return value and show the error message when nothing was deleted; add 1 test | ~3 lines | Very low |
| R3 | SEC-03 + DOC-01 | Convert editable fields to strings in `pickEditable()`; add 1 test | ~1 line | Very low |
| R4 | DOC-03 | Run Lighthouse/axe, or reword the contrast claim | Minutes | None |
| R5 | DOC-05, DOC-07 | Link this report from `README.md`; update test counts if R1–R3 add tests | Minutes | None |

### 8.3 Optional

| # | Finding | Suggestion |
|---|---|---|
| O1 | CQ-03 | Check the error summary with a screen reader; remove `role="alert"` if it is re-announced |
| O2 | CQ-11 | Check statistic cards with a screen reader; add `aria-label` if needed |
| O3 | CQ-07, CQ-08, CQ-09 | Remove redundant `aria-required`, move `LoadingState` styles to a CSS Module, un-export `DEFAULT_STATUS` |
| O4 | DOC-06 | Save the Requirements Analysis and UI/UX Design (updated for four members) into `docs/` as evidence of the AI-assisted process |
| O5 | Section 5.3 | The simplifications listed there. **Not recommended before the deadline:** they carry regression risk for little benefit. |

### 8.4 For Part 2 (no action now)

CQ-04 (show the load-error state), SEC-02 (server-side validation), CQ-06 (use or remove `getById`/`search`), SEC-06 (CSP when deployed), and SEC-03 again for request bodies arriving at the backend.

---

## 9. Final Assessment

**CyberTrack is suitable for submission as SE411 Part 1.**

- Every mandatory functional requirement in the professor's specification is implemented and covered by automated tests that pass.
- No high-severity defects were found. The one medium finding (REPO-01) concerns what gets published, not how the code works.
- The five low-severity code findings are edge cases. Three cannot be triggered by a user in Part 1 (CQ-02, CQ-04, SEC-03). One is a minor keyboard-focus issue (CQ-01). One needs screen-reader confirmation (CQ-03).
- Security posture is appropriate for a frontend with no network, storage or authentication: no unsafe rendering, no secrets, no known vulnerable dependencies. This is a statement about what was checked, not a guarantee.
- The design is moderately complex but explainable, and its structure is justified by the planned Part 2 backend.

**Before submitting:** complete N1–N3. Applying R1–R3 is recommended because they are small and safe, but they are not required for Part 1 to work. *(R1–R3 have since been applied; see Section 10.)*

---

## 10. Corrections Applied

At the team's request ("Prompt 7 — Targeted Code Quality Improvements"), **only** the three confirmed low-risk findings were fixed, together with the documentation they affected. For each one a regression test was written first and run against the unchanged code to show the defect (**11 tests failed before the fixes**), then the fix was applied. No dependencies, abstractions or UI changes were added, and no unrelated code was refactored.

### 10.1 Code corrections

| Finding | Root cause | Change | Files | Regression tests | Before → after |
|---|---|---|---|---|---|
| **CQ-01** `/` shortcut escaped the delete dialog | The shortcut only checked whether focus was in a text field | The shortcut does nothing while a modal (`[aria-modal="true"]`) is open (1 condition, 1 comment) | `src/components/ui/SearchBar.jsx` | TC-INV-12 (`App.test.jsx`) | Search box took focus → focus stays on Cancel |
| **CQ-02** Delete reported success when nothing was deleted | `InventoryPage` ignored the `true`/`false` result of `deleteFirewall()` | Success message only when `true`; otherwise an error message *"Firewall "NAME" was not found. It may have already been deleted."* The provider now removes the row in both cases, because the store no longer contains it | `src/pages/InventoryPage.jsx`, `src/context/FirewallProvider.jsx` | TC-INV-13 (regression); TC-INV-14 (error-thrown path, previously untested) | Success toast + stale row → error toast + row removed |
| **SEC-03** Service accepted non-text values | Validation assumed every value was a string | `validateFirewall()` checks each field's type first: a non-text value gets *"Invalid value: text expected"* and is never stored or converted. `firewallService` treats a missing input object (`null`) as empty | `src/utils/validation.js`, `src/services/firewallService.js` | TC-VAL-14 (`validation.test.js`); TC-SVC-14 … 18 (`firewallService.test.js`, 8 tests) | Numeric name stored / `TypeError` → `ValidationError`, nothing stored |

**Design choice for CQ-02:** when the store reports that a firewall does not exist, keeping its row would leave a record that can never be deleted. The data store is the authority on what exists, so the stale row is removed and the user is told what happened.

### 10.2 Documentation corrections

| Finding | Document | Correction |
|---|---|---|
| DOC-01 | `ARCHITECTURE.md` §6 | Reworded the service-validation claim and described the new type rule |
| DOC-02 | `TECHNICAL_DOCUMENTATION.md` §4.6 | Delete now described for all three outcomes: removed, not found, error |
| DOC-03 | `ARCHITECTURE.md` §12 | Contrast now described as *designed* to meet WCAG AA (calculated during design) and *not yet measured*, with a link to manual check MT-07 |
| DOC-07 | `README.md`, `ARCHITECTURE.md`, `TECHNICAL_DOCUMENTATION.md`, `TESTING_REPORT.md` | Test count updated from 101 to 113. Testing Report: new test cases, issues ISS-05 to ISS-07, updated totals |
| — | `TECHNICAL_DOCUMENTATION.md` §4.3, §5.2 | `/` shortcut behaviour while the dialog is open; type rule added to the data model |
| DOC-05 (partly) | `README.md` | Link to this report added (the `src/test/` omission was left unchanged, as unrelated) |

### 10.3 Verification (17 October 2026, after the corrections)

| Check | Result |
|---|---|
| `npm test` | ✅ **113 / 113 passed** (6 files: App 51, firewallService 21, validation 23, FirewallForm 8, format 6, ToastProvider 4) |
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ Succeeded, no warnings. JS 303.58 kB (96.24 kB gzipped), CSS 32.30 kB |
| `npm audit` | ✅ 0 vulnerabilities |

### 10.4 Still open

| Item | Status |
|---|---|
| N1 Specification `.docx` in the project folder (REPO-01) | ✅ Resolved in stage 8: `.gitignore` now excludes `/*.docx` and `/*.pdf` in the project root. The file is kept locally and not deleted |
| N2 Public GitHub repository | ⏳ Prepared (stage 8); Git is not installed and nothing has been published |
| N3 Four-person team vs. "groups of three" | ⏳ Confirm with the professor |
| R4 Measure contrast (Lighthouse/axe) | ⏳ Contrast **calculated** in stage 8 from the colour values (WCAG formula): all text pairs ≥ 4.5 : 1, but the **input border `#94A3B8` is 2.56 : 1**, below the 3 : 1 guideline for form controls (new finding **A11Y-01**, Low; styling not changed; see [UI/UX Design §2.3](UI_UX_DESIGN.md#23-calculated-contrast)). Browser measurement still not done (Testing Report MT-07) |
| CQ-03, CQ-04, CQ-05 … CQ-11, other Info items, O1–O5 | Not changed (outside the requested scope) |
