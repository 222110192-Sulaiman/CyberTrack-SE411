# CyberTrack — Technical Documentation

| | |
|---|---|
| **Project** | CyberTrack — Firewall Asset Management System |
| **Course** | SE411 Software Engineering · Fall 2026–27 · Project Part 1 |
| **Version** | 1.0.0 · 17 October 2026 |
| **Related documents** | [Requirements Analysis](REQUIREMENTS_ANALYSIS.md) · [UI/UX Design](UI_UX_DESIGN.md) · [Architecture](ARCHITECTURE.md) · [Testing Report](TESTING_REPORT.md) · [Code Review](CODE_REVIEW.md) · [README](../README.md) |

---

## 1. Purpose and Scope

CyberTrack lets an organisation keep an inventory of one kind of asset, **firewall devices**. Users can add, display, search, update and delete firewalls through a web interface with a navigation menu, and an About page lists the project team.

This document describes **what is actually implemented in Part 1**:

- a **React** frontend built with **Vite**;
- data held **in memory** as a collection of JavaScript objects;
- **no backend, database or API.** These are planned for Part 2, which the specification says will be coded manually.

### 1.1 How the professor's Part 1 requirements are met

| Specification requirement | Implementation |
|---|---|
| The project must be a React project | React 19 application (Section 2) |
| Manage one kind of asset | Firewall devices only |
| Menu to navigate between features | Sidebar menu: Dashboard, Firewall Inventory, Add Firewall, About (§4.8) |
| Add, remove/delete, update, search, display elements | §4.2 – §4.6 |
| About page with team members (name, student ID), opened from a menu item | §4.9 |
| Data as a collection of objects, not a database | In-memory array in `firewallService` (§5.5) |
| AI-generated documentation, tests and code review | This document, [ARCHITECTURE.md](ARCHITECTURE.md), [TESTING_REPORT.md](TESTING_REPORT.md), [CODE_REVIEW.md](CODE_REVIEW.md) |

---

## 2. Technology Stack

Versions are the ones installed in `node_modules` on 17 October 2026.

### 2.1 Runtime (shipped to the browser)

| Technology | Version | Purpose | Why it suits Part 1 |
|---|---|---|---|
| **JavaScript** (ES2022+, ES modules) | — | Programming language for all application code | Required by the course brief; runs directly in the browser |
| **JSX** | — | HTML-like syntax inside JavaScript for describing UI | Standard way to write React components |
| **React** + React DOM | 19.3.1 | Builds the UI from **functional components** and Hooks (`useState`, `useEffect`, `useMemo`, `useContext` …) | Required by the specification; re-renders the screen automatically when data changes |
| **React Router** (`react-router-dom`) | 7.18.4 | Client-side routing: maps URLs to pages, provides `Link`, `useNavigate`, `useParams` | Gives every page its own URL and makes the menu work without page reloads, so in-memory data is kept |
| **CSS** with **CSS Modules** and **custom properties** | — | Styling. Design tokens in `tokens.css`; one `.module.css` file per component | Built into Vite with no extra library; class names are scoped so components cannot clash |
| **lucide-react** | 1.59.0 | Outline SVG icons (shield, pencil, trash …) | Small, consistent icon set; only the icons used are bundled |
| **@fontsource/inter** | 5.3.0 | The Inter typeface, bundled with the app | No request to an external font service at runtime |

### 2.2 Development tools (not shipped)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js / npm** | 24.15.0 / 11.12.1 (Vite requires Node 20.19+ or 22.12+) | Runs the tools; installs packages |
| **Vite** + `@vitejs/plugin-react` | 8.3.4 / 6.1.2 | Development server with instant reload; production build (bundling, minifying) into `dist/` |
| **Vitest** | 5.0.5 | Test runner (Jest-compatible API, reuses the Vite configuration) |
| **jsdom** | 30.1.3 | Simulated browser DOM so React components can be tested in Node |
| **React Testing Library** + **user-event** + **jest-dom** | 16.3.3 / 14.6.8 / 7.0.1 | Render components, simulate clicks and typing, and assert on what the user sees |
| **ESLint** (+ `react-hooks`, `react-refresh` plugins) | 10.13.0 | Static code checks, including the rules of React Hooks |

### 2.3 Not used

TypeScript, Redux or other state libraries, Bootstrap/Tailwind, Java, Spring Boot, any database, any backend server or REST API, `localStorage`. None of these are part of Part 1.

---

## 3. Project Structure

About 1,760 lines of application JavaScript/JSX (excluding tests and CSS).

```
CyberTrack-SE411/
├── index.html                  HTML page that loads the app (one <div id="root">)
├── package.json                Dependencies and npm scripts
├── vite.config.js              Vite + React plugin; Vitest settings (jsdom, setup file)
├── eslint.config.js            Lint rules
├── public/favicon.svg          Browser tab icon
├── docs/                       REQUIREMENTS_ANALYSIS.md, UI_UX_DESIGN.md, ARCHITECTURE.md,
│                               TECHNICAL_DOCUMENTATION.md, TESTING_REPORT.md, CODE_REVIEW.md
└── src/
    ├── main.jsx                Entry point: router + providers + <App/>
    ├── App.jsx                 Route table
    ├── components/
    │   ├── layout/             AppLayout (page shell, mobile drawer), Sidebar (menu), Logo
    │   ├── firewalls/          FirewallTable, FirewallForm (shared Add/Edit form)
    │   └── ui/                 Generic components: Button, Card, PageHeader, StatCard, StatusBadge,
    │                           SearchBar, EmptyState, LoadingState, ConfirmDialog, FormField,
    │                           Inputs (TextInput, SelectInput, TextArea), TeamMemberCard
    ├── pages/                  DashboardPage, InventoryPage, AddFirewallPage, EditFirewallPage,
    │                           AboutPage, NotFoundPage
    ├── context/                contexts.js, FirewallProvider (firewall state), ToastProvider (messages)
    ├── hooks/                  useFirewalls(), useToast()
    ├── services/               firewallService.js: in-memory data access (CRUD + search)
    ├── utils/                  validation.js, search.js, format.js
    ├── data/                   seedFirewalls.js (10 samples), constants.js (lists, empty form), team.js
    ├── styles/                 tokens.css (design variables), global.css (base styles)
    └── test/                   setup.js, renderApp.jsx (test helper)
```

Test files sit next to the code they test (`*.test.js` / `*.test.jsx`).

| Folder | Responsibility | Layer (see [Architecture §1](ARCHITECTURE.md#1-overview)) |
|---|---|---|
| `pages/` | One component per URL; connects UI to data and handles user actions | Presentation |
| `components/` | Reusable building blocks; receive data via props | Presentation |
| `styles/` | Global design tokens and base styles | Presentation |
| `context/`, `hooks/` | Shared application state and access to it | State management |
| `utils/` | Pure functions: validation, search, formatting | Business logic |
| `services/` | The only code that reads/writes stored firewalls | Data access |
| `data/` | Static data: samples, allowed values, team | Data |

---

## 4. Functional Features

### 4.1 Dashboard (`/`)

**What it does:** gives an overview of the inventory.

- **Four statistic cards:** Total Firewalls (with the caption "incl. *N* decommissioned"), Active, Inactive and Under Maintenance (each with "*X*% of total"). Every card links to the inventory.
- **Quick access card:** "View Firewall Inventory" and "Add New" buttons. When there are no firewalls it shows "No firewalls registered yet" and "Add your first firewall".
- **How it works:** `countByStatus()` counts the `firewalls` array from `useFirewalls()` inside `useMemo`, so the numbers always match the current data.

**Files:** `pages/DashboardPage.jsx`, `components/ui/StatCard.jsx`, `utils/format.js` (`percentOf`).

### 4.2 Firewall Inventory, display (`/firewalls`)

- Table columns: **Asset ID, Firewall Name, Manufacturer, IP Address, Location, Status, Actions** (Edit ✎ link, Delete 🗑 button).
- Status is shown by `StatusBadge` as a coloured pill **with the status text**, so it is not shown by colour alone.
- A counter shows "Showing *X* of *Y*".
- **Empty state** when the collection is empty: "No firewalls registered" with an Add Firewall button.
- After an add or edit, the affected row is briefly **highlighted**. The page receives the ID through router navigation state (`highlightId`).
- **Responsive:** below 900 px the Manufacturer and Location columns are hidden; below 640 px each row is restyled as a card showing all fields, using CSS only.

**Files:** `pages/InventoryPage.jsx`, `components/firewalls/FirewallTable.jsx`, `components/ui/StatusBadge.jsx`, `components/ui/EmptyState.jsx`.

### 4.3 Search (Inventory page)

- **Live search:** results update on every keystroke; no Search button is needed.
- Matches a **case-insensitive substring** in **Asset ID, name, manufacturer, IP address or location**. Leading and trailing spaces are ignored. Notes, model and serial number are not searched.
- **Clear** with the ✕ button or **Esc**. Press **/** anywhere on the page to jump to the search box (ignored while the delete dialog is open, so focus stays in the dialog).
- **No-match state:** "No firewalls match your search", with a Clear search button.
- **How it works:** `InventoryPage` keeps the search text in local state and calls `filterFirewalls(firewalls, query)` from `utils/search.js` inside `useMemo`.

**Files:** `pages/InventoryPage.jsx`, `components/ui/SearchBar.jsx`, `utils/search.js`.

### 4.4 Add Firewall (`/firewalls/new`)

- Reached from the menu, the Dashboard, or the Inventory "Add Firewall" button.
- The form is grouped into **Identification** (name, manufacturer, model, serial number), **Network & Location** (IP, location) and **Operational Details** (status, firmware version, purchase date, notes). Status defaults to **Active**.
- **Save Firewall:** the form validates (§4.7). The page calls `addFirewall()`, which calls `firewallService.create()`. A toast reports *Firewall "NAME" added as FW-00xx*, and the app goes to the Inventory with the new row highlighted.
- **Cancel:** goes back to the previous page, or to the Inventory if the Add page was opened directly. Nothing is saved.

**Files:** `pages/AddFirewallPage.jsx`, `components/firewalls/FirewallForm.jsx`, `context/FirewallProvider.jsx`, `services/firewallService.js`.

### 4.5 Edit Firewall (`/firewalls/:id/edit`)

- Opened with the ✎ action on an inventory row. The `:id` part of the URL (e.g. `FW-0003`) identifies the firewall.
- Uses the **same `FirewallForm`** in `mode="edit"`. Fields are pre-filled. The **Asset ID is shown read-only**, and the header shows the ID and the "Last updated" time.
- **Save Changes:** validates, calls `updateFirewall()` → `firewallService.update()`, which refreshes `updatedAt`. A toast reports *Firewall "NAME" updated*, and the app returns to the Inventory with the row highlighted.
- **Cancel:** returns to the Inventory; changes are discarded.
- **Unknown ID:** shows "Firewall not found" with a Back to Inventory button.

**Files:** `pages/EditFirewallPage.jsx`, `components/firewalls/FirewallForm.jsx`, `services/firewallService.js`.

### 4.6 Delete Firewall (Inventory page)

- The 🗑 action opens a **confirmation dialog**: "Delete firewall?" with the message *"NAME (ID) will be permanently removed. This cannot be undone."*
- Focus starts on **Cancel** (the safe option). **Tab** stays inside the dialog. **Esc** or clicking outside the dialog cancels.
- **Delete:** calls `deleteFirewall()` → `firewallService.remove()`, which returns `true` if a firewall was removed and `false` if it was not found.
  - **Removed:** the row disappears and a success toast reports *Firewall "NAME" deleted*.
  - **Not found** (for example, already deleted): no success message. An error toast reports *Firewall "NAME" was not found. It may have already been deleted.*, and the stale row is removed so the list matches the store.
  - **Error thrown** (not possible with in-memory data; possible with a Part 2 backend): an error toast reports *The firewall could not be deleted. Please try again.* and the row stays.
- "Remove" and "delete" in the specification are treated as the same operation: a permanent delete.

**Files:** `pages/InventoryPage.jsx`, `components/ui/ConfirmDialog.jsx`.

### 4.7 Form Validation

- **When errors appear:** nothing is shown while the user first fills the form. Pressing **Save** checks every field. After that first attempt, errors update **live** as fields are corrected.
- **How errors are shown:** a red message under the field, a red border, `aria-invalid="true"`, and the message linked to the field with `aria-describedby` so screen readers read it. Focus moves to the **first invalid field**. With **two or more errors**, a summary box at the top lists them as links to each field.
- **Where the rules live:** `validateFirewall()` in `utils/validation.js`. It is used by the form, for immediate feedback, and again by `firewallService`, as a safety net. The rules are listed in §5.2.

**Files:** `utils/validation.js`, `components/firewalls/FirewallForm.jsx`, `components/ui/FormField.jsx`.

### 4.8 Navigation

- **Sidebar menu** (dark navy) with **Dashboard, Firewall Inventory, Add Firewall, About**. The current page is highlighted with a teal bar and marked `aria-current="page"`. "Firewall Inventory" also stays highlighted while editing.
- **Below 1024 px:** a top bar with a ☰ button opens the menu as a slide-in drawer. Focus moves into the drawer, Esc closes it, and choosing an item closes it.
- **Skip to main content** link for keyboard users.
- **Unknown URLs** show "Page not found" with a link to the Dashboard.

**Files:** `App.jsx` (routes), `components/layout/AppLayout.jsx`, `components/layout/Sidebar.jsx`, `pages/NotFoundPage.jsx`.

### 4.9 About Page (`/about`)

- Project overview: *"CyberTrack — Firewall Asset Management System"*.
- Course information: SE411 – Software Engineering, Fall 2026–27, Project Part 1 – React Frontend.
- **Project Team: four members**, each on a card with an initials avatar, **full name** and **student ID**:

| Name | Student ID |
|---|---|
| Sulaiman AlHoshan | 222110192 |
| Fahad AlSenaidi | 222110662 |
| Saleh AlMurshed | 222110093 |
| Khalid AlAbdulwahab | 221110508 |

- The team list is stored in one place, `src/data/team.js`, and the page renders whatever that file contains.

**Files:** `pages/AboutPage.jsx`, `components/ui/TeamMemberCard.jsx`, `data/team.js`.

### 4.10 Notifications

Success and error messages (toasts) appear in the top-right corner (top centre on phones), disappear after **4 seconds**, and can be closed with ✕. They are announced to screen readers through a polite live region.

**Files:** `context/ToastProvider.jsx`, `hooks/useToast.js`.

---

## 5. Data Model

### 5.1 Firewall object

Each firewall is a plain JavaScript object:

```js
{
  id: 'FW-0001',                          // system-generated, never changes
  name: 'HQ-EDGE-FW-01',
  manufacturer: 'Fortinet',
  model: 'FortiGate 100F',
  serialNumber: 'FGT100FTK2209A001',
  ipAddress: '10.0.0.1',
  location: 'Riyadh HQ – Server Room A',
  status: 'Active',
  firmwareVersion: '7.4.3',
  purchaseDate: '2024-03-15',             // 'YYYY-MM-DD' or ''
  notes: 'Primary perimeter firewall',
  createdAt: '2026-09-01T08:00:00.000Z',  // system-generated (ISO 8601, UTC)
  updatedAt: '2026-10-01T09:00:00.000Z',  // system-generated, refreshed on every update
}
```

Optional fields that are left blank are stored as an empty string `''`.

### 5.2 Attributes and validation rules

All text values are **trimmed** before validation and storage. Rules are implemented in `src/utils/validation.js`.

**Type rule (all user fields):** each value must be text or missing. A number, object, array or boolean is rejected with *"Invalid value: text expected"* and is never stored or converted. Missing values count as empty, and a missing input object counts as all fields empty. The form always sends text; this rule protects the data service from incorrect direct calls.

| Attribute | Type | Required | Set by | Validation rule | Error message (example) |
|---|---|---|---|---|---|
| `id` | string | ✅ | System | Format `FW-` + 4-digit number; read-only | — |
| `name` | string | ✅ | User | 2–50 characters; letters, digits, space, `.` `_` `-` only; **unique** (case-insensitive) | "A firewall with this name already exists" |
| `manufacturer` | string | ✅ | User | One of: Cisco, Fortinet, Palo Alto Networks, Check Point, Juniper Networks, SonicWall, Sophos, Other | "Select a manufacturer" |
| `model` | string | ✅ | User | 1–50 characters | "Model is required" |
| `serialNumber` | string | — | User | ≤ 40 characters; letters, digits, `-` only | "Serial number may contain only letters, digits and hyphens" |
| `ipAddress` | string | ✅ | User | IPv4 dotted decimal: 4 numbers 0–255, no leading zeros; **unique** | "Enter a valid IPv4 address (e.g. 192.168.1.1)" / "This IP address is already assigned" |
| `location` | string | ✅ | User | 2–100 characters | "Location is required" |
| `status` | string | ✅ | User | One of: **Active, Inactive, Maintenance, Decommissioned** (default Active) | "Select a status" |
| `firmwareVersion` | string | — | User | ≤ 20 characters | "Firmware version cannot exceed 20 characters" |
| `purchaseDate` | string | — | User | A real calendar date `YYYY-MM-DD`, not in the future | "Purchase date cannot be in the future" |
| `notes` | string | — | User | ≤ 500 characters (a live counter is shown) | "Notes cannot exceed 500 characters" |
| `createdAt` | string | ✅ | System | Set once on creation | — |
| `updatedAt` | string | ✅ | System | Set on creation and on every update | — |

When a firewall is **edited**, the uniqueness checks ignore that firewall itself, so it can keep its own name and IP address.

### 5.3 Asset ID generation

Implemented in `createFirewallService()` (`src/services/firewallService.js`):

1. At start-up the service finds the **highest ID number** in the initial data. For the sample data this is 10, from `FW-0010`.
2. Each `create()` **increases a counter by 1** and formats it as `FW-` plus at least 4 digits: `FW-0011`, `FW-0012`, …
3. The counter **only goes up**, so the ID of a deleted firewall is **never reused** during a session. This was added after QA found that IDs were being reused (Testing Report, ISS-01).
4. IDs, `createdAt` and `updatedAt` sent by a caller are **ignored**. Only the service sets them.

### 5.4 Sample data

`src/data/seedFirewalls.js` contains **10 fictitious firewalls** across 8 manufacturer options, at sites in Riyadh, Jeddah, Dammam and Khobar. All use private (RFC 1918) IP addresses. Status mix: 6 Active, 2 Inactive, 1 Maintenance, 1 Decommissioned.

### 5.5 In-memory storage and its limitations

The service keeps the firewalls in a private JavaScript array, and `FirewallProvider` keeps a copy in React state for the UI.

| Situation | Data kept? |
|---|---|
| Moving between pages with the menu or links | ✅ Yes (no page reload) |
| Browser back / forward buttons | ✅ Yes |
| **Reloading the page (F5), closing the tab, opening a new tab** | ❌ **No: resets to the 10 sample firewalls** |
| Two users or two browsers | ❌ No sharing; each tab has its own copy |

This is intentional. The specification states that in Part 1 *"the data will be defined as a collection of objects (not stored in a database)."* Persistent, shared storage is planned for the Part 2 backend (see [Architecture §11](ARCHITECTURE.md#11-preparing-for-part-2-backend)).

---

## 6. Build, Run and Configuration

| Command | What it does |
|---|---|
| `npm install` | Installs dependencies listed in `package.json` |
| `npm run dev` | Starts the Vite development server (default http://localhost:5173) with instant reload |
| `npm run build` | Creates an optimised production build in `dist/` (about 303 kB JavaScript, 96 kB gzipped) |
| `npm run preview` | Serves the `dist/` build locally for checking |
| `npm test` | Runs all automated tests once (Vitest) |
| `npm run test:watch` | Re-runs tests when files change |
| `npm run lint` | Runs ESLint |

| File | Configures |
|---|---|
| `vite.config.js` | React plugin; Vitest uses the `jsdom` environment, global test functions and `src/test/setup.js` |
| `eslint.config.js` | Recommended JavaScript rules, React Hooks rules, React Refresh rules; `dist/` ignored |
| `.gitignore` | Excludes `node_modules/`, `dist/`, `coverage/`, `.env` files, editor/OS files |

No environment variables or secrets are needed.

---

## 7. Testing Summary

- **113 automated tests** in 6 files, all passing: unit tests (validation, search, formatting, data service), component tests (form, notifications) and integration tests (the whole app driven like a user).
- Every mandatory feature (create, display, update, delete, search, navigation, validation, About) is covered.
- Production build, ESLint and `npm audit --omit=dev` all pass with no problems.

Full details, test cases and issues found: **[TESTING_REPORT.md](TESTING_REPORT.md)**.

---

## 8. Coding Conventions

- **Functional components and Hooks only**, with no class components. One component per file, named in PascalCase (`FirewallTable.jsx`).
- Styles in a **CSS Module** next to the component (`FirewallTable.module.css`), using variables from `tokens.css`. *Exception:* `LoadingState.jsx` uses a small inline style.
- Pages read shared data only through the **hooks** `useFirewalls()` and `useToast()`; they never import the service directly.
- Business rules live in `utils/` as **pure functions** (same input → same output, no side effects).
- Tests are placed next to the file they test and query the UI by **accessible role and name**.

---

## 9. Known Limitations

| Limitation | Reason / plan |
|---|---|
| Data resets on reload | Part 1 requirement (in-memory only); Part 2 backend |
| No login or user roles | Outside Part 1 scope |
| No error screen if loading data fails | Cannot happen with in-memory data; to be added with the Part 2 backend |
| IPv4 only | IPv6 is a possible future enhancement |
| Deployment to a static host needs an "SPA fallback" so deep links such as `/about` work after refresh | Standard for client-side routing; not needed for `npm run dev` / `preview` |
| Visual layout, browser compatibility and Lighthouse scores are not covered by automated tests | Manual checklist in [TESTING_REPORT.md §7](TESTING_REPORT.md#7-manual-testing) |
