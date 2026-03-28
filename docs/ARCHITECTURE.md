# TMS Architecture

This document describes the current system architecture of the Test Management System (TMS) and the proposed architectural changes for each roadmap phase.

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Data Model (ERD)](#data-model-erd)
3. [Frontend Component Tree](#frontend-component-tree)
4. [Phase 1 Changes — Core Enhancements](#phase-1-changes)
5. [Phase 2 Changes — New Feature Set](#phase-2-changes)
6. [Phase 3 Changes — Collaboration & Integrations](#phase-3-changes)
7. [Phase 4 Changes — Admin Role & Platform](#phase-4-changes)

---

## Current Architecture

The TMS is a full-stack monolith with three layers: a React single-page application, a Node.js/Express REST API, and an SQLite database.

```mermaid
graph TD
    Browser["Browser\n(React SPA)"]
    Express["Express Server\n(Node.js)"]
    SQLite["SQLite Database\n(/database/tms.db)"]
    StaticFiles["Static Files\n(/client/build)"]

    Browser -->|"REST API calls (axios)"| Express
    Express -->|"Serves"| StaticFiles
    Express -->|"SQL queries (better-sqlite3)"| SQLite
    Browser -->|"Loads"| StaticFiles
```

### Directory Layout

```
project-root/
├── client/                     # React SPA (Vite or CRA)
│   └── src/
│       ├── components/         # Shared UI: Header, Breadcrumb, Grid, etc.
│       ├── pages/              # Route-level page components
│       ├── context/            # AuthContext, ThemeContext
│       └── services/api.js     # Axios wrapper for all API calls
├── server/                     # Express backend
│   ├── database/
│   │   ├── schema.sql          # DDL for all tables
│   │   └── db.js               # SQLite connection + schema init
│   ├── routes/                 # One file per entity group
│   ├── middleware/auth.js       # Session authentication middleware
│   └── server.js               # Entry point, middleware wiring
└── docs/                       # This documentation folder
```

### Request / Response Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant R as React Router
    participant A as Axios (api.js)
    participant E as Express Route Handler
    participant M as Auth Middleware
    participant D as SQLite (db.js)

    U->>R: Navigates to /testsuites
    R->>A: GET /api/testsuites
    A->>E: HTTP GET /api/testsuites
    E->>M: Check session
    M-->>E: Session valid
    E->>D: SELECT * FROM test_suites
    D-->>E: Rows
    E-->>A: 200 JSON array
    A-->>R: Data
    R-->>U: Renders TestSuites grid
```

---

## Data Model (ERD)

The current database schema with all foreign key relationships.

```mermaid
erDiagram
    User {
        int id PK
        text login
        text password
        text user_name
        text role
    }
    TestSuite {
        int id PK
        text name
    }
    TestCase {
        int id PK
        text name
        int test_suite_id FK
        text priority
        text created_date
        int author_id FK
    }
    TestStep {
        int id PK
        int test_case_id FK
        int step_number
        text action
        text expected_result
    }
    TestRun {
        int id PK
        text created_date
        int creator_id FK
    }
    TestRunCase {
        int id PK
        int test_run_id FK
        int test_case_id FK
        boolean executed
        text result
        text executed_date
        int executor_id FK
    }

    User ||--o{ TestCase : "authors"
    User ||--o{ TestRun : "creates"
    User ||--o{ TestRunCase : "executes"
    TestSuite ||--o{ TestCase : "contains"
    TestCase ||--o{ TestStep : "has"
    TestCase ||--o{ TestRunCase : "referenced by"
    TestRun ||--o{ TestRunCase : "contains"
```

---

## Frontend Component Tree

```mermaid
graph TD
    App["App.jsx\n(Router + Providers)"]
    AuthCtx["AuthContext"]
    ThemeCtx["ThemeContext"]

    App --> AuthCtx
    App --> ThemeCtx

    subgraph PublicRoutes ["Public Routes"]
        Login["Login.jsx"]
        Register["Register.jsx"]
    end

    subgraph ProtectedLayout ["Protected Layout"]
        Header["Header.jsx\n(theme toggle, user info, logout)"]
        Breadcrumb["Breadcrumb.jsx"]

        subgraph Pages ["Pages"]
            TS["TestSuites.jsx"]
            TC["TestCases.jsx"]
            TCD["TestCaseDetail.jsx"]
            TCN["TestCaseNew.jsx"]
            TR["TestRuns.jsx"]
            TRN["TestRunNew.jsx"]
            TRD["TestRunDetail.jsx"]
            TRE["TestRunExecution.jsx"]
            REP["Reports.jsx"]
            REPD["ReportDetail.jsx"]
        end
    end

    App --> PublicRoutes
    App --> ProtectedLayout
    ProtectedLayout --> Pages

    subgraph SharedComponents ["Shared Components"]
        Grid["Grid.jsx"]
        ConfirmDialog["ConfirmDialog.jsx"]
        Toast["Toast.jsx"]
        TreeView["TreeView.jsx"]
    end

    Pages --> SharedComponents
```

---

## Phase 1 Changes

**Core Enhancements** — no new tables, minimal backend changes.

### Changes Summary

| Layer | Change |
|-------|--------|
| Frontend | `Grid.jsx` gains sort state, column filter inputs, and checkbox selection column |
| Frontend | New `SearchBar.jsx` component in `Header.jsx` |
| Frontend | New `BulkActionToolbar.jsx` component |
| Frontend | New `CloneModal.jsx` for TestCase cloning |
| Backend | Optional `?sort=`, `?order=`, `?filter=` query parameters on list endpoints |
| Database | No schema changes |

### Search Query Flow

```mermaid
graph LR
    SearchBar["SearchBar\n(Header)"] -->|"?q=login"| ApiJs["api.js"]
    ApiJs -->|"GET /api/testcases?q=login"| ExpressSearch["Express\nSearch Handler"]
    ExpressSearch -->|"LIKE %login%"| SQLite
    SQLite -->|"Filtered rows"| ExpressSearch
    ExpressSearch -->|"200 JSON"| ApiJs
    ApiJs -->|"Update state"| Grid["Grid.jsx"]
```

---

## Phase 2 Changes

**New Feature Set** — new database tables and new frontend pages/components.

### New Database Tables

```mermaid
erDiagram
    Tag {
        int id PK
        text name
    }
    TestCaseTag {
        int test_case_id FK
        int tag_id FK
    }
    Comment {
        int id PK
        int test_case_id FK
        int author_id FK
        text content
        text created_date
    }
    Attachment {
        int id PK
        int test_case_id FK
        int test_run_case_id FK
        text filename
        text filepath
        text uploaded_date
        int uploader_id FK
    }
    TestCaseHistory {
        int id PK
        int test_case_id FK
        int changed_by FK
        text changed_date
        text snapshot
    }

    TestCase ||--o{ TestCaseTag : "tagged with"
    Tag ||--o{ TestCaseTag : "applied to"
    TestCase ||--o{ Comment : "has"
    TestCase ||--o{ Attachment : "has"
    TestRunCase ||--o{ Attachment : "has"
    TestCase ||--o{ TestCaseHistory : "tracks"
```

### New Frontend Components / Pages

```mermaid
graph TD
    Dashboard["/dashboard\nDashboard.jsx"]
    TagFilter["TagFilterBar.jsx"]
    CommentThread["CommentThread.jsx"]
    AttachmentPanel["AttachmentPanel.jsx"]
    HistoryTab["HistoryTab.jsx"]
    ImportExportMenu["ImportExportMenu.jsx"]
    TagCloud["TagCloud.jsx\n(Reports page)"]

    Dashboard --> SummaryCounters["SummaryCounters.jsx"]
    Dashboard --> TrendChart["PassRateTrendChart.jsx"]
    Dashboard --> ActivityFeed["ActivityFeed.jsx"]
    Dashboard --> TopFailed["TopFailedCases.jsx"]
```

### File Upload Flow

```mermaid
sequenceDiagram
    participant U as User
    participant TC as TestCaseDetail.jsx
    participant A as api.js
    participant E as Express /api/attachments
    participant FS as /server/uploads/

    U->>TC: Drops file on AttachmentPanel
    TC->>A: POST /api/attachments (multipart/form-data)
    A->>E: HTTP POST
    E->>FS: Write file to disk
    E-->>A: 201 { id, filename, filepath }
    A-->>TC: Show file in attachment list
```

---

## Phase 3 Changes

**Collaboration & Integrations** — WebSocket server, webhook engine, external links.

### Architecture with WebSockets

```mermaid
graph TD
    Browser1["Browser\n(User A)"]
    Browser2["Browser\n(User B)"]
    ExpressHTTP["Express HTTP\n(REST API)"]
    SocketIO["Socket.io Server\n(attached to HTTP server)"]
    SQLite["SQLite"]

    Browser1 -->|"REST"| ExpressHTTP
    Browser2 -->|"REST"| ExpressHTTP
    Browser1 <-->|"WebSocket"| SocketIO
    Browser2 <-->|"WebSocket"| SocketIO
    SocketIO --> ExpressHTTP
    ExpressHTTP --> SQLite
```

### WebSocket Event Model

| Event (server → client) | Payload | Trigger |
|--------------------------|---------|---------|
| `testruncase:updated` | `{ testRunCaseId, result, executed }` | Any user saves execution result |
| `testcase:updated` | `{ testCaseId, name, priority }` | Any user saves TestCase edits |
| `testrun:completed` | `{ testRunId }` | All cases in a run are executed |

### New Database Tables (Phase 3)

```mermaid
erDiagram
    WebhookConfig {
        int id PK
        text event
        text url
        text secret
        boolean active
    }
    TestRunCaseIssue {
        int id PK
        int test_run_case_id FK
        text issue_url
        text issue_label
    }
    NotificationConfig {
        int id PK
        text event
        text channel
        text target
        boolean active
    }
    TestPlan {
        int id PK
        text name
        text created_date
        int creator_id FK
    }
    TestPlanRun {
        int test_plan_id FK
        int test_run_id FK
    }

    TestRunCase ||--o{ TestRunCaseIssue : "linked to"
    TestPlan ||--o{ TestPlanRun : "contains"
    TestRun ||--o{ TestPlanRun : "part of"
```

---

## Phase 4 Changes

**Admin Role & Platform** — complete Admin section, audit logging, system config.

### New Database Tables (Phase 4)

```mermaid
erDiagram
    AuditLog {
        int id PK
        text entity_type
        int entity_id
        text action
        text changed_fields
        int actor_id FK
        text timestamp
    }
    SystemConfig {
        text key PK
        text value
        text updated_by FK
        text updated_date
    }

    User ||--o{ AuditLog : "generates"
```

### Admin Section Routes

```
/admin                  → Admin dashboard (Phase 4)
/admin/users            → User Management (4.1)
/admin/audit            → Audit Log (4.2)
/admin/config           → System Configuration (4.3)
/admin/archive          → Data Retention / Archive (4.4)
/admin/webhooks         → Webhook Config (Phase 3, managed here)
/admin/notifications    → Notification Config (Phase 3, managed here)
```

---

## Technology Decisions Log

| Decision | Chosen Approach | Reason |
|----------|----------------|--------|
| Database | SQLite (current) | Zero-config, sufficient for 1–10 users |
| Auth | Express session + cookie | Simple, no JWT refresh complexity needed for demo scale |
| Real-time (Phase 3) | Socket.io | Drop-in with Express, automatic fallback to polling |
| File storage (Phase 2) | Local filesystem `/server/uploads/` | Simple; swap to S3-compatible storage later without API change |
| Charts | recharts (current) | React-native, small bundle, sufficient for donut + line charts |
| Import/Export (Phase 2) | CSV (papaparse) + JSON | Universal formats; Excel (.xlsx) can be added later via sheetjs |
