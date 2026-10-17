# CyberTrack — Firewall Asset Management System

**SE411 Software Engineering · Fall 2026–27 · Project Part 1 (React frontend)**

CyberTrack is a web application for keeping an inventory of an organisation's **firewall devices**. Users can register firewalls, browse and search the inventory, update device details and remove devices from one interface, with a dashboard summarising the inventory by operational status.

## Contents

- [Part 1 scope and objectives](#part-1-scope-and-objectives)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Available commands](#available-commands)
- [Project structure](#project-structure)
- [Team](#team)
- [Documentation](#documentation)
- [Use of AI](#use-of-ai)
- [Limitations](#limitations)

## Part 1 scope and objectives

Part 1 of the SE411 project asks for a **React frontend** that manages one kind of company asset. CyberTrack manages firewalls.

| Objective | How CyberTrack meets it |
|---|---|
| React project with a navigation menu | React 19 single-page app with a sidebar menu |
| Manage the data: add, remove, update, search, display | Full add / edit / delete / search / display of firewalls |
| About page with the team members (name, student ID), opened from a menu item | About page listing the four team members |
| Data as a collection of objects, **no database** | Firewalls are held in memory as JavaScript objects |
| AI-generated requirements, design, code, documentation, tests and code review | See [Use of AI](#use-of-ai) and [Documentation](#documentation) |

The backend will be written by hand in Part 2. Part 1 contains **no backend, database or API**.

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Live counts of total, active, inactive and under-maintenance firewalls, with links to the inventory |
| **Firewall Inventory** | Table of every firewall: Asset ID, name, manufacturer, IP address, location and status |
| **Search** | Results update while typing; matches Asset ID, name, manufacturer, IP address or location (case-insensitive) |
| **Add Firewall** | Form with inline validation; the Asset ID (`FW-0001`, …) is generated automatically and never reused |
| **Edit Firewall** | The same form, pre-filled; the Asset ID is read-only |
| **Delete Firewall** | Confirmation dialog naming the firewall; success or error message afterwards |
| **Validation** | Required fields, IPv4 format, unique name and IP, allowed manufacturers and statuses, length limits, no future purchase dates |
| **Navigation** | Sidebar menu with the active page highlighted; slide-in menu on smaller screens; "Page not found" for unknown URLs |
| **About** | Project overview, course information and the four team members |

Firewall statuses: **Active**, **Inactive**, **Maintenance**, **Decommissioned**.

## Technology stack

| Technology | Purpose |
|---|---|
| [React](https://react.dev/) 19 (JavaScript, JSX) | User interface built from functional components and Hooks |
| [React Router](https://reactrouter.com/) 7 | Page URLs and navigation without page reloads |
| [Vite](https://vite.dev/) 8 | Development server and production build |
| CSS Modules + CSS custom properties | Component-scoped styles and shared design tokens |
| lucide-react, @fontsource/inter | Icons; locally bundled Inter font |
| [Vitest](https://vitest.dev/) + React Testing Library + jsdom | Automated unit, component and integration tests |
| ESLint | Static code checks |

Details and versions: [Technical Documentation §2](docs/TECHNICAL_DOCUMENTATION.md#2-technology-stack).

## Getting started

### Requirements

- [Node.js](https://nodejs.org/) **20.19+ or 22.12+** (developed and tested on Node 24.15) with npm
- A current web browser

### Install and run

```bash
git clone https://github.com/<github-username>/CyberTrack-SE411.git
cd CyberTrack-SE411
npm install
npm run dev
```

Then open the address shown in the terminal (by default http://localhost:5173).

## Available commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with live reload |
| `npm test` | Run all automated tests once |
| `npm run test:watch` | Re-run tests when files change |
| `npm run lint` | Check the code with ESLint |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |

Latest results (17 October 2026): **113 / 113 tests passed**, ESLint 0 problems, production build succeeded, `npm audit` 0 vulnerabilities. See the [Testing Report](docs/TESTING_REPORT.md).

## Project structure

```
CyberTrack-SE411/
├── docs/                    Project documentation (see below)
├── public/                  Static files (favicon)
├── src/
│   ├── components/
│   │   ├── firewalls/       FirewallTable, FirewallForm (shared Add/Edit form)
│   │   ├── layout/          AppLayout, Sidebar, Logo
│   │   └── ui/              Button, Card, StatCard, StatusBadge, SearchBar, ConfirmDialog, …
│   ├── context/             FirewallProvider (firewall list), ToastProvider (messages)
│   ├── data/                Sample firewalls, allowed values, team details
│   ├── hooks/               useFirewalls, useToast
│   ├── pages/               Dashboard, Inventory, Add, Edit, About, Not Found
│   ├── services/            firewallService: in-memory data access (add, update, delete, search)
│   ├── styles/              Design tokens and global styles
│   ├── test/                Test setup and helpers
│   ├── utils/               Validation, search and formatting functions
│   ├── App.jsx              Routes
│   └── main.jsx             Entry point
├── index.html
├── package.json
└── vite.config.js
```

Tests are stored next to the code they test (`*.test.js`, `*.test.jsx`).

## Team

| Name | Student ID |
|---|---|
| Sulaiman AlHoshan | 222110192 |
| Fahad AlSenaidi | 222110662 |
| Saleh AlMurshed | 222110093 |
| Khalid AlAbdulwahab | 221110508 |

The About page reads these details from [`src/data/team.js`](src/data/team.js).

## Documentation

| Document | Contents |
|---|---|
| [Requirements Analysis](docs/REQUIREMENTS_ANALYSIS.md) | Specification requirements, functional and non-functional requirements, acceptance criteria, traceability |
| [UI/UX Design](docs/UI_UX_DESIGN.md) | Design concept, colours and contrast, typography, page layouts, responsive behaviour |
| [Architecture](docs/ARCHITECTURE.md) | Layered architecture, components, state, data flow, routing, Part 2 readiness |
| [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) | Technology stack, project structure, features, data model and validation rules |
| [Testing Report](docs/TESTING_REPORT.md) | Test strategy, test cases and results, issues found, manual test checklist |
| [Code Review](docs/CODE_REVIEW.md) | AI code review (security, performance, quality, complexity) and the corrections applied |

## Use of AI

As the specification requires, an AI tool was used throughout the project: **Claude Code** (Anthropic). The team wrote the prompts, made the decisions and approved each stage. The AI produced the analysis, design, code, tests and documents.

| Stage | Team prompt | AI output |
|---|---|---|
| 0 | Read the project specification | Summary of requirements, constraints and ambiguities |
| 1 | "Prompt 1: Software Requirements Analysis" | Requirements analysis (now [REQUIREMENTS_ANALYSIS.md](docs/REQUIREMENTS_ANALYSIS.md)) |
| 2 | "Prompt 2: UI/UX Design and Interface Planning" | Design specification (now [UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md)) |
| 3 | Design approval, team of four, implement the app | React application, first automated tests, README |
| 4 | "Prompt 4: Software Testing and Quality Assurance" | Additional tests, one defect fixed, [Testing Report](docs/TESTING_REPORT.md) |
| 5 | "Prompt 5: Software Architecture and Technical Documentation" | [Architecture](docs/ARCHITECTURE.md) and [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) |
| 6 | "Prompt 6: AI-Assisted Code Review and Complexity Assessment" | [Code Review](docs/CODE_REVIEW.md) |
| 7 | "Prompt 7: Targeted Code Quality Improvements" | Three review findings fixed, with regression tests |
| 8 | "Prompt 8: Final GitHub Repository Preparation" | This README, repository clean-up, requirements and design documents saved to `docs/` |

Notes:

- The requirements analysis and UI/UX design were first produced in the AI conversation. They were saved as files in stage 8 and updated to match the final application. Both documents say so.
- Some work was done without a dedicated prompt: the first automated tests, ESLint setup and the first README were produced during stage 3.
- The team entered the team members' names and student IDs and reported manual testing of the main features. Results of browser-based manual checks are not recorded in the documentation (see [Testing Report §7](docs/TESTING_REPORT.md#7-manual-testing)).
- The code review was carried out by the same AI that wrote the code, which limits its independence ([Code Review](docs/CODE_REVIEW.md)).

## Limitations

- **Data is stored only in memory.** Reloading the page, closing the tab or opening a new tab resets the inventory to the 10 sample firewalls. Moving between pages with the menu keeps the data. This is intentional for Part 1, which requires a collection of objects instead of a database.
- Single user; no login.
- IPv4 addresses only.
- When deployed to a static web host, the host must serve `index.html` for every route so that links such as `/about` work after a refresh.
- Appearance, responsive layout, browser compatibility and Lighthouse scores have not yet been checked in a browser; the input-field border colour is below the recommended contrast for form controls. See the [Testing Report](docs/TESTING_REPORT.md#7-manual-testing) and [UI/UX Design §2](docs/UI_UX_DESIGN.md#2-colour-palette).
