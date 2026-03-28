# TMS Feature Roadmap

This document outlines the planned improvements and new features for the Test Management System (TMS). The roadmap is organized into four phases, ordered by delivery priority and dependency.

---

## Current State

The initial TMS release delivers:
- User authentication (register/login) with QA and Admin roles (Admin is stubbed)
- Full CRUD for TestSuites, TestCases, and TestSteps
- TestRun creation (tree-based test case selection), execution, and cascade deletion
- Reports page with per-TestRun statistics and a donut chart
- Light/dark theme, breadcrumb navigation, confirmation dialogs, and toast notifications

---

## Phase 1 — Core Enhancements

**Theme**: Improve day-to-day usability of existing features.  
**Target users**: QA engineers doing routine test management.

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 1.1 | Search & Filter on all grids | High | Low |
| 1.2 | Sortable columns on all grids | High | Low |
| 1.3 | TestCase cloning (copy with TestSteps) | High | Medium |
| 1.4 | Bulk operations (bulk delete, bulk result update) | Medium | Medium |

### 1.1 Search & Filter

- Global search bar in the header that matches TestSuite names, TestCase names, and TestRun IDs.
- Per-column filter inputs on each grid (TestSuites, TestCases, TestRuns, Reports).
- Filter state persisted in URL query parameters so pages are bookmarkable.

### 1.2 Sortable Columns

- Click any column header to sort ascending; click again to sort descending.
- Visual sort indicator (arrow icon) on the active column.
- Sort state persisted in URL query parameters.

### 1.3 TestCase Cloning

- "Clone" button on the TestCase detail page and in the TestCases grid (per-row action).
- User selects a target TestSuite (can be the same suite).
- New TestCase is created with all TestSteps copied; name gets a " (copy)" suffix.
- User is redirected to the new TestCase's detail page.

### 1.4 Bulk Operations

- Checkbox column on TestCases grid and TestRuns grid.
- "Select All" checkbox in the header row.
- Bulk action toolbar appears when one or more rows are selected:
  - TestCases grid: bulk delete (with confirmation dialog listing count).
  - TestRun detail grid: bulk set result (pass / fail / skipped) for selected TestRunCases.

---

## Phase 2 — New Feature Set

**Theme**: Enrich TestCase data and add high-value QA workflow features.  
**Target users**: QA leads and engineers tracking test quality over time.

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 2.1 | Tagging / Labels | High | Medium |
| 2.2 | TestCase Comments | High | Medium |
| 2.3 | File Attachments | Medium | High |
| 2.4 | TestCase Import / Export (CSV & JSON) | High | Medium |
| 2.5 | TestCase History / Versioning | Medium | High |
| 2.6 | Dashboard landing page | Medium | Medium |

### 2.1 Tagging / Labels

- Free-form tags on TestCases (many-to-many).
- Tag filter chip bar on the TestCases grid.
- Tag cloud widget on the Reports overview page.
- New `Tag` and `TestCaseTag` tables in the database.

### 2.2 TestCase Comments

- Threaded comment thread on the TestCase detail page and on the TestRun execution page.
- Comments show author, timestamp, and text.
- QA users can add and delete their own comments; Admin can delete any comment.
- New `Comment` table linked to `test_case_id` and `author_id`.

### 2.3 File Attachments

- Upload screenshots or files (PDF, image, text) to a TestCase or to a TestRunCase execution result.
- Files stored on the server filesystem under `/server/uploads/`.
- New `Attachment` table linked to `test_case_id` or `test_run_case_id`.
- File preview thumbnail for images; download link for other types.

### 2.4 TestCase Import / Export

- **Export**: download a TestSuite (with all TestCases and TestSteps) as CSV or JSON from the TestSuite row menu.
- **Import**: upload CSV or JSON on the TestSuites page to create a new TestSuite with all cases and steps.
- Validation report shown before import is committed (preview with error rows highlighted).

### 2.5 TestCase History / Versioning

- Every save of a TestCase records a snapshot: changed fields, who changed them, and when.
- "History" tab on the TestCase detail page shows a timeline of changes.
- Diff view between any two history snapshots.
- New `TestCaseHistory` table with a JSON `snapshot` column.

### 2.6 Dashboard

- New `/dashboard` page becomes the default landing page after login.
- Widgets:
  - Total TestSuites, TestCases, TestRuns (summary counters).
  - Pass rate trend line chart over the last 10 TestRuns.
  - Most-failed TestCases (top 5).
  - Recent activity feed (last 10 create/update events).

---

## Phase 3 — Collaboration & Integrations

**Theme**: Connect TMS to external tools and enable multi-user real-time workflows.  
**Target users**: Engineering teams running TMS alongside CI/CD pipelines.

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 3.1 | Real-time collaboration (WebSockets) | Medium | High |
| 3.2 | CI/CD Webhooks | High | Medium |
| 3.3 | JIRA / Issue Tracker Linking | Medium | Medium |
| 3.4 | Email & Slack Notifications | Low | Medium |
| 3.5 | Test Plans | Medium | High |

### 3.1 Real-time Collaboration

- WebSocket server (Socket.io) added to the Express backend.
- TestRun detail page subscribes to a room for that TestRun.
- When any user saves an execution result, all other connected clients see the row update immediately.
- Online presence indicator: avatars of currently-viewing users shown at the top of the page.

### 3.2 CI/CD Webhooks

- **Outbound**: when a TestRun is completed (all cases executed), POST a configurable webhook URL with the run summary JSON.
- **Inbound**: `POST /api/webhooks/trigger-run` accepts a list of TestCase IDs and creates a TestRun, returning the new run ID. Secured with a shared secret header.
- Webhook config stored in a `WebhookConfig` table managed through the Admin panel.

### 3.3 JIRA / Issue Tracker Linking

- On the TestRun execution page, a "Link Issue" field accepts an external issue URL (e.g. a JIRA ticket URL).
- Linked issues displayed as clickable badges on the TestRun detail page.
- New `TestRunCaseIssue` table: `test_run_case_id`, `issue_url`, `issue_label`.

### 3.4 Email & Slack Notifications

- Configurable notification rules in the Admin panel:
  - Notify on TestRun completion (summary email/Slack message).
  - Notify when a TestCase result changes to "fail".
- Email via SMTP (nodemailer); Slack via Incoming Webhook URL.
- New `NotificationConfig` table for per-event settings.

### 3.5 Test Plans

- A Test Plan groups multiple TestRuns under a named milestone (e.g. "Sprint 42 Regression").
- Test Plan page shows aggregate pass rate and execution progress across all linked runs.
- New `TestPlan` and `TestPlanRun` tables.

---

## Phase 4 — Admin Role & Platform

**Theme**: Complete the currently-stubbed Admin section and add operational tooling.  
**Target users**: System administrators managing the TMS instance.

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 4.1 | User Management | High | Medium |
| 4.2 | Audit Log | Medium | Medium |
| 4.3 | System Configuration | Medium | Low |
| 4.4 | Data Retention / Archival | Low | Medium |

### 4.1 User Management

- Admin-only `/admin/users` page with a grid of all users.
- Admin can: create users, edit user_name and role, deactivate (soft-delete) accounts.
- Deactivated users cannot log in; their historical data (authorship, execution records) is preserved.
- Password reset by Admin (generates a temporary password).

### 4.2 Audit Log

- System-wide audit log at `/admin/audit`.
- Every create, update, and delete event is recorded: entity type, entity ID, changed fields, actor user, timestamp.
- Filterable by entity type, actor, and date range.
- New `AuditLog` table.

### 4.3 System Configuration

- Admin-only `/admin/config` page.
- Configurable settings:
  - Default TestCase priority.
  - Session timeout duration.
  - Maximum attachment file size.
  - Webhook secret key management.

### 4.4 Data Retention / Archival

- Admin can configure a retention policy: auto-archive TestRuns older than N days.
- Archived runs are hidden from the main UI but accessible via `/admin/archive`.
- Manual "Archive" and "Restore" actions per TestRun.
- New `archived` boolean column on `TestRun`.

---

## Success Metrics

| Phase | Key Metric |
|-------|-----------|
| 1 | Time to find a specific TestCase reduced by search/filter |
| 2 | Tags and comments actively used on >50% of TestCases |
| 3 | At least one active CI/CD webhook integration per team |
| 4 | Zero manual admin interventions needed for routine user management |

---

## Out of Scope (for now)

- Mobile-native application
- Multi-tenancy / workspace isolation
- SSO / OAuth login
- Migration away from SQLite to a client-server database (tracked separately)
