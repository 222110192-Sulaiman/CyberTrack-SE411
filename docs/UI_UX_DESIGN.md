# CyberTrack — UI/UX Design Specification

| | |
|---|---|
| **Project** | CyberTrack — Firewall Asset Management System |
| **Course** | SE411 Software Engineering · Fall 2026–27 · Project Part 1 |
| **Document date** | 17 October 2026 |
| **Related documents** | [Requirements Analysis](REQUIREMENTS_ANALYSIS.md) · [Architecture](ARCHITECTURE.md) · [Technical Documentation](TECHNICAL_DOCUMENTATION.md) |

> **About this document (retrospective).** The original UI/UX design specification was produced by the AI assistant (Claude Code) in response to the team's "Prompt 2 — UI/UX Design and Interface Planning", approved by the team, and presented in the AI conversation without being saved as a file. This file was **written afterwards** ("Prompt 8"). It describes the design **as implemented**: colour values, sizes and breakpoints are taken from the source code (`src/styles/tokens.css` and the CSS Modules). Differences from the original design are listed in [Section 9](#9-differences-from-the-original-design).

---

## 1. Design Concept

**"Calm command centre":** an operations console for security teams that feels trustworthy and precise rather than flashy.

| Principle | Applied as |
|---|---|
| Clarity over decoration | Light, low-noise content area. Colour is reserved for meaning: status, actions, focus |
| Consistency | Every page uses the same shell (sidebar, page header, content cards) and the same components |
| Safety by design | Destructive actions are red and always confirmed; validation messages are inline and in plain language; every action gives feedback |

**Visual identity:** a dark navy sidebar, a light main area, blue for primary actions, teal for brand accents and the active menu item. The logo is a shield-with-check icon plus the wordmark "Cyber**Track**", with "Track" in teal. Icons come from one outline set (`lucide-react`) and are always paired with text or an accessible label.

---

## 2. Colour Palette

Values from `src/styles/tokens.css`. **Contrast ratios were calculated** with the WCAG 2.x formula from these hex values on 17 October 2026. They have **not** been measured on the rendered pages with a browser tool (see [Testing Report §7](TESTING_REPORT.md#7-manual-testing), MT-07).

### 2.1 Structure and accents

| Token | Hex | Used for |
|---|---|---|
| `--navy-900` | `#0B1F3A` | Sidebar, mobile top bar |
| `--navy-800` | `#12305A` | Sidebar hover and active item |
| `--navy-100` | `#CBD5E1` | Sidebar text and icons |
| `--bg` | `#F4F7FB` | Page background |
| `--surface` | `#FFFFFF` | Cards, table, forms, dialogs |
| `--border` | `#E2E8F0` | Card and table borders |
| `--border-strong` | `#94A3B8` | Input and secondary-button borders |
| `--blue-600` / `--blue-700` | `#2563EB` / `#1D4ED8` | Primary buttons, links, focus ring / hover |
| `--blue-50` | `#EFF6FF` | Row hover, tags |
| `--teal-400` | `#2DD4BF` | Active-menu bar and logo accent (on navy only) |
| `--teal-700` / `--teal-50` | `#0F766E` / `#F0FDFA` | Teal text and icons on light backgrounds / icon tiles |
| `--text` / `--text-muted` / `--text-subtle` | `#0F172A` / `#475569` / `#64748B` | Body text / labels / placeholders |
| `--danger-600` / `--danger-700` / `--danger-50` | `#DC2626` / `#B91C1C` / `#FEF2F2` | Delete button / error text / error background |
| `--success-700` | `#15803D` | Success message accent |

### 2.2 Status colours

Each status is shown as a **dot + tinted pill + text label**, so it never relies on colour alone.

| Status | Text | Background | Dot | Calculated contrast |
|---|---|---|---|---|
| Active | `#166534` | `#DCFCE7` | `#16A34A` | 6.49 : 1 |
| Inactive | `#374151` | `#F1F5F9` | `#64748B` | 9.41 : 1 |
| Maintenance | `#92400E` | `#FEF3C7` | `#D97706` | 6.37 : 1 |
| Decommissioned | `#991B1B` | `#FEE2E2` | `#DC2626` | 6.80 : 1 |

### 2.3 Calculated contrast

WCAG AA thresholds: text ≥ 4.5 : 1; boundaries of form controls and other UI components ≥ 3 : 1.

| Pair | Ratio | Result |
|---|---|---|
| Body text on white | 17.85 : 1 | ✅ |
| Muted text on white / on page background | 7.58 : 1 / 7.05 : 1 | ✅ |
| Subtle (placeholder) text on white | 4.76 : 1 | ✅ |
| Sidebar text on navy | 11.13 : 1 | ✅ |
| White on navy / on active item | 16.52 : 1 / 13.16 : 1 | ✅ |
| Teal-400 on navy | 8.87 : 1 | ✅ |
| White on primary button / hover | 5.17 : 1 / 6.70 : 1 | ✅ |
| Blue link on white | 5.17 : 1 | ✅ |
| Teal-700 on white / on teal-50 | 5.47 : 1 / 5.25 : 1 | ✅ |
| White on delete button | 4.83 : 1 | ✅ |
| Error text on white / on error summary | 6.47 : 1 / 5.91 : 1 | ✅ |
| **Input border (`#94A3B8`) on white** | **2.56 : 1** | ⚠️ **Below the 3 : 1 guideline for component boundaries (WCAG 1.4.11)** |

> The original design document stated 3.0 : 1 for the input border. Recalculation shows 2.56 : 1. Inputs still have visible labels and a strong blue focus ring, but a darker border (for example `#64748B`, 4.76 : 1) would meet the guideline. This is recorded as an open item; the styling has not been changed.

---

## 3. Typography and Spacing

| Item | Value |
|---|---|
| UI font | **Inter** (bundled with `@fontsource/inter`, weights 400/500/600/700), falling back to the system font |
| Data font | System monospace (`ui-monospace`, Cascadia Code, Consolas …) for Asset IDs, IP addresses, serial numbers and firmware versions |
| Type scale | 12 · 14 · 16 (base) · 18 · 24 (page title) · 32 px (dashboard numbers), set in `rem` so browser zoom works |
| Headings | One H1 per page (in the page header); H2 for sections and cards |
| Spacing scale | 4 · 8 · 12 · 16 · 24 · 32 · 48 px |
| Page padding | 32 px desktop · 24 px tablet · 16 px mobile |
| Corner radius | 6 px controls · 10 px cards and dialogs · pill-shaped badges |
| Controls | 40 px high (44 px on phones, for touch) |
| Focus | 2 px blue outline + soft blue ring on every focusable element (`:focus-visible`) |
| Motion | 150 ms transitions; turned off when the user prefers reduced motion |
| Layout widths | Sidebar 240 px · content up to 1280 px · mobile top bar 56 px |

---

## 4. Navigation

| Menu item | Icon | Route |
|---|---|---|
| Dashboard | Layout grid | `/` |
| Firewall Inventory | Shield | `/firewalls` |
| Add Firewall | Plus in circle | `/firewalls/new` |
| About | Info | `/about` |

- The **active item** has a navy-800 background, white bold text and a teal bar on its left edge, and is marked `aria-current="page"`.
- "Firewall Inventory" stays active on the Edit page (`/firewalls/:id/edit`); "Add Firewall" is active only on `/firewalls/new`.
- A **"Skip to main content"** link appears first when using the keyboard.

```
Dashboard ─[View Firewall Inventory]─► Inventory ─[✎ Edit]─► Edit ─Save─► Inventory (+ message, row highlighted)
    └─[Add Firewall]──────────────────► Add ─Save─► Inventory (+ message, row highlighted)
                                         Inventory ─[🗑 Delete]─► Confirm dialog ─Delete─► Inventory (+ message)
```

---

## 5. Page Layouts

### 5.1 Application shell

```
┌────────────────────┬─────────────────────────────────────────┐
│ CyberTrack (logo)  │  Page title (H1)             [Action]   │
│                    │  Subtitle                               │
│ ▌Dashboard         │  ───────────────────────────────────────│
│  Firewall Inventory│                                         │
│  Add Firewall      │        Page content in cards            │
│  About             │                                         │
│                    │                                         │
│ SE411 · Project    │                                         │
│ Part 1      v1.0.0 │                                         │
└────────────────────┴─────────────────────────────────────────┘
```

### 5.2 Dashboard

Four statistic cards (Total, with "incl. *N* decommissioned"; Active; Inactive; Under Maintenance, each with "*X*% of total"). Each card is a link to the inventory. Below them, a quick-access card with "View Firewall Inventory" and "Add New". When there are no firewalls, it shows "No firewalls registered yet" and "Add your first firewall".

### 5.3 Firewall Inventory

A search box (with ✕ clear button and `/` shortcut hint) and a "Showing *X* of *Y*" count, then the table: **Asset ID · Firewall Name · Manufacturer · IP Address · Location · Status · Actions** (✎ Edit, 🗑 Delete). After an add or edit, the affected row is briefly highlighted. Two empty states: *No firewalls registered* (with Add button) and *No firewalls match your search* (with Clear search button). Delete opens a confirmation dialog: warning icon, "Delete firewall?", the firewall's name and ID, and **Cancel** (focused first) and **Delete** (red) buttons.

### 5.4 Add / Edit Firewall

One shared form in three labelled sections: **Identification** (in Edit mode, a read-only Asset ID; then Name, Manufacturer, Model, Serial Number), **Network & Location** (IP Address with format hint, Location) and **Operational Details** (Status, Firmware Version, Purchase Date, Notes with a 0 / 500 counter). Required fields are marked with a red asterisk. Errors appear under each field after the first Save attempt and update live. With two or more errors, a summary with links to each field appears at the top. Buttons: **Cancel** (secondary) and **Save Firewall** / **Save Changes** (primary). The Edit page header shows the Asset ID and the "Last updated" time.

### 5.5 About

A project overview card with highlight tags; a course information card (SE411 – Software Engineering, Fall 2026–27, Project Part 1 – React Frontend); and **Project Team: four cards**, each with an initials avatar, full name and student ID.

### 5.6 Not Found

A centred message, "Page not found", with a "Go to Dashboard" button.

---

## 6. Reusable Components

| Component | Purpose |
|---|---|
| `AppLayout`, `Sidebar`, `Logo` | Page shell, menu, mobile drawer |
| `PageHeader`, `Card` | Page title area; content container |
| `Button` | Primary, secondary, danger and ghost styles; renders a link when given `to` |
| `StatCard`, `StatusBadge` | Dashboard statistics; status pill |
| `SearchBar` | Live search with clear button and `/` shortcut |
| `FirewallTable` | Inventory table (cards on phones) |
| `FirewallForm`, `FormField`, `TextInput` / `SelectInput` / `TextArea` | Shared Add/Edit form and accessible field wrapper |
| `ConfirmDialog` | Accessible confirmation dialog |
| `EmptyState`, `LoadingState` | Empty, not-found and loading messages |
| `TeamMemberCard` | About page team card |
| `ToastProvider` | Success and error messages (top right; top centre on phones; 4 seconds) |

Styling: CSS custom properties in `tokens.css` plus one CSS Module per component (one exception: `LoadingState` uses a small inline style).

---

## 7. Responsive Behaviour

| Width | Navigation | Dashboard cards | Inventory | Form | About team |
|---|---|---|---|---|---|
| ≥ 1024 px | Fixed sidebar | 4 per row | Full table | 2 columns | 4 per row (≥ 1200 px), else 2 |
| 640–1023 px | Top bar + ☰ slide-in drawer | 2 per row | Table; Manufacturer and Location hidden below 900 px | 2 columns | 2 per row |
| < 640 px | Top bar + drawer | 1 per row | Each row becomes a card showing all fields; labelled Edit/Delete buttons | 1 column; full-width buttons | 1 per row below 560 px |

The drawer moves focus to the first link, keeps focus inside, and closes with Esc, a backdrop click or a menu choice. These layouts are implemented in CSS but have **not yet been checked in a real browser** (Testing Report MT-01 to MT-03).

---

## 8. Accessibility Features

- Semantic landmarks (`nav`, `main`), one H1 per page, a table with column headers and a hidden caption.
- Visible labels on all fields; errors linked to their fields (`aria-invalid`, `aria-describedby`).
- Focus management: the delete dialog and mobile drawer keep focus inside and return it when closed; the `/` shortcut is ignored while the dialog is open.
- Live regions announce messages and the search result count.
- Icon-only buttons have descriptive labels, for example "Delete HQ-EDGE-FW-01".
- Status is shown as text as well as colour.
- Reduced-motion preference respected.

Contrast: see Section 2 (text passes by calculation; input borders do not meet the 3 : 1 guideline).

---

## 9. Differences from the Original Design

| Area | Original design ("Prompt 2") | As implemented | Reason |
|---|---|---|---|
| About page team grid | 3 cards | **4 cards** | Team has four members |
| Dashboard card links | Optionally pre-filter the inventory by status | All cards open the full inventory | Optional item not built |
| Status filter and column sorting | Optional | Not implemented | Kept out to limit scope |
| Details page | Not designed (dropped) | Not implemented | — |
| Search box | Clear button and `/` shortcut | Also: **Esc** clears the search; `/` ignored while a dialog is open | Usability; code review CQ-01 |
| Loading state | Not specified | "Loading firewalls…" message | Needed because data loading is asynchronous |
| Delete result | Success message | Error message when nothing was deleted | Code review CQ-02 |
| Input border contrast | Stated as 3.0 : 1 | **2.56 : 1** (recalculated) | Calculation error in the original; recorded as an open item |
