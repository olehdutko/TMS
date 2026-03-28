# 🧪 TMS — Test Management System

A lightweight, full-stack web-based Test Management System for QA teams. Supports test suites, test cases with step-by-step instructions, test run execution, and visual reports.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![React](https://img.shields.io/badge/react-18-61DAFB)

---

## Screenshots

| TestSuites | TestCase Detail | Report |
|:---:|:---:|:---:|
| Browse and manage test suites | Edit test cases with steps | Visual donut chart reports |

---

## Features

- **TestSuites** — Create and organize test suites; cascade delete with all related cases
- **TestCases** — Full CRUD with step-by-step test instructions and dynamic step creation
- **TestRuns** — Tree-based test case selection, grouped execution view
- **Test Execution** — Mark tests as pass / fail / skipped with executor tracking
- **Reports** — Per-run statistics with a donut chart and collapsible pass/fail/skipped lists
- **Authentication** — Session-based login, registration, and logout
- **Two Roles** — `QA` (full access) and `Admin` (placeholder for future features)
- **Light / Dark Theme** — Toggle persisted in `localStorage`
- **Toast Notifications** — Success and error feedback on all actions
- **Confirmation Dialogs** — For all destructive operations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite |
| Backend | Node.js, Express |
| Database | SQLite (`better-sqlite3`) |
| Charts | Recharts |
| Styling | Custom CSS — no UI framework |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### 1. Clone the repository

```bash
git clone https://github.com/your-username/tms.git
cd tms
```

### 2. Start the backend

```bash
cd server
npm install
node server.js
```

API server starts at **http://localhost:5000**

> On first run, the database schema is created automatically and an `admin` user is seeded.

### 3. Start the frontend

```bash
cd client
npm install
npm run dev
```

React app starts at **http://localhost:5173**

### 4. (Optional) Seed demo data

```bash
cd server
npm run seed
```

Generates **5 TestSuites** with **73 TestCases** and realistic step-by-step instructions.

---

## Default Credentials

| Role | Login | Password |
|------|-------|----------|
| Admin | `admin` | `admin` |

New QA accounts can be registered at `/register`.

---

## Project Structure

```
tms/
├── client/                        # React SPA (Vite)
│   └── src/
│       ├── components/            # Shared UI components
│       │   ├── Header.jsx         # Navigation + theme toggle + user info
│       │   ├── Breadcrumb.jsx     # Clickable breadcrumb trail
│       │   ├── ConfirmDialog.jsx  # Reusable confirmation modal
│       │   ├── Toast.jsx          # Toast notification system
│       │   └── TreeView.jsx       # Suite/case tree for TestRun creation
│       ├── context/
│       │   ├── AuthContext.jsx    # Login state + current user
│       │   └── ThemeContext.jsx   # Light/dark theme
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── TestSuites/        # Suite list, case list, case detail/create
│       │   ├── TestRuns/          # Run list, new run, run detail, execution
│       │   └── Reports/           # Reports grid, detailed report with chart
│       ├── services/api.js        # Axios wrapper for all API calls
│       └── styles.css             # Global CSS + CSS variables for theming
│
├── server/                        # Express backend
│   ├── database/db.js             # SQLite connection + schema init
│   ├── middleware/auth.js         # Session authentication middleware
│   ├── routes/
│   │   ├── auth.js                # Register, login, logout, /me
│   │   ├── testsuites.js          # Suites + testcases under suite
│   │   ├── testcases.js           # TestCase CRUD + steps
│   │   ├── testruns.js            # Runs + run case execution
│   │   └── reports.js             # Aggregated report data
│   ├── utils/generateTestData.js  # Demo seed script
│   └── server.js                  # Express entry point
│
├── database/                      # SQLite DB file (auto-created, git-ignored)
├── docs/                          # Architecture, API, Features, Roadmap docs
└── README.md
```

---

## API Overview

All endpoints are prefixed with `/api`. Protected endpoints require a session cookie (set on `POST /api/auth/login`).

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new QA user |
| `POST` | `/api/auth/login` | Login and start session |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/auth/me` | Get current user |

### TestSuites & TestCases

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/testsuites` | List all suites |
| `POST` | `/api/testsuites` | Create a suite |
| `DELETE` | `/api/testsuites/:id` | Delete suite (cascades to cases & steps) |
| `GET` | `/api/testsuites/:id/testcases` | List cases in a suite |
| `POST` | `/api/testsuites/:id/testcases` | Create a case in a suite |
| `GET` | `/api/testcases/:id` | Get case with all steps |
| `PUT` | `/api/testcases/:id` | Update case and steps |
| `DELETE` | `/api/testcases/:id` | Delete case (cascades to steps) |

### TestRuns

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/testruns` | List all runs with pass rate |
| `POST` | `/api/testruns` | Create a run with selected cases |
| `GET` | `/api/testruns/:id` | Get run with all cases grouped by suite |
| `DELETE` | `/api/testruns/:id` | Delete run |
| `GET` | `/api/testruns/cases/:id` | Get a test run case with steps |
| `PUT` | `/api/testruns/cases/:id` | Save execution result |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | Summary stats for all runs |
| `GET` | `/api/reports/:id` | Detailed report with case breakdown |

---

## Database Schema

```
users            → id, login, password, user_name, role
test_suites      → id, name
test_cases       → id, name, test_suite_id, priority, created_date, author_id
test_steps       → id, test_case_id, step_number, action, expected_result
test_runs        → id, created_date, creator_id
test_run_cases   → id, test_run_id, test_case_id, executed, result, executed_date, executor_id
```

Foreign key constraints and cascade deletes are enabled via SQLite `PRAGMA foreign_keys = ON`.

---

## Roadmap

Planned features per the project roadmap:

- **Phase 1** — Search & filter, sortable columns, TestCase cloning, bulk operations
- **Phase 2** — Tags/labels, comments, file attachments, import/export CSV, version history, dashboard
- **Phase 3** — Real-time collaboration (Socket.io), CI/CD webhooks, JIRA linking, Slack/email notifications, Test Plans
- **Phase 4** — Admin user management, audit log, system configuration, data archival

See [`docs/ROADMAP.md`](docs/ROADMAP.md) and [`docs/FEATURES.md`](docs/FEATURES.md) for full details.

---

## License

MIT
