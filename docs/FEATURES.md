# TMS Feature Specifications

This document provides detailed specifications for every planned feature in the TMS roadmap. Each feature is described with a user story, acceptance criteria, data model changes, API changes, and UI changes.

Features are organized by roadmap phase. Cross-references to `ROADMAP.md` and `API.md` are included where relevant.

---

## Table of Contents

### Phase 1 — Core Enhancements
- [1.1 Search & Filter](#11-search--filter)
- [1.2 Sortable Columns](#12-sortable-columns)
- [1.3 TestCase Cloning](#13-testcase-cloning)
- [1.4 Bulk Operations](#14-bulk-operations)

### Phase 2 — New Feature Set
- [2.1 Tagging / Labels](#21-tagging--labels)
- [2.2 TestCase Comments](#22-testcase-comments)
- [2.3 File Attachments](#23-file-attachments)
- [2.4 TestCase Import / Export](#24-testcase-import--export)
- [2.5 TestCase History / Versioning](#25-testcase-history--versioning)
- [2.6 Dashboard](#26-dashboard)

### Phase 3 — Collaboration & Integrations
- [3.1 Real-time Collaboration](#31-real-time-collaboration)
- [3.2 CI/CD Webhooks](#32-cicd-webhooks)
- [3.3 JIRA / Issue Tracker Linking](#33-jira--issue-tracker-linking)
- [3.4 Email & Slack Notifications](#34-email--slack-notifications)
- [3.5 Test Plans](#35-test-plans)

### Phase 4 — Admin Role & Platform
- [4.1 User Management](#41-user-management)
- [4.2 Audit Log](#42-audit-log)
- [4.3 System Configuration](#43-system-configuration)
- [4.4 Data Retention / Archival](#44-data-retention--archival)

---

## 1.1 Search & Filter

### User Story

> As a QA engineer with a large number of TestCases, I want to quickly search and filter grids by name or attribute so that I can find relevant tests without scrolling through hundreds of rows.

### Acceptance Criteria

- [ ] A search input field appears above each grid (TestSuites, TestCases, TestRuns, Reports).
- [ ] Typing in the search box filters rows in real time (debounced at 300 ms).
- [ ] Search matches the primary name/title column (case-insensitive, substring match).
- [ ] The TestCases grid additionally supports filtering by Priority (High / Medium / Low / All) via a dropdown.
- [ ] (Phase 2 prerequisite) The TestCases grid supports filtering by Tag via a chip bar.
- [ ] Active search/filter state is reflected in the URL (`?q=login&priority=High`) so the page is bookmarkable and shareable.
- [ ] Clearing the search input restores all rows instantly.
- [ ] A "X results" counter is shown below the search bar when a filter is active.
- [ ] Empty state message "No results match your search." is shown when the filter returns zero rows.

### Data Model Changes

None. Filtering is applied at the query level in the existing tables.

### API Changes

Optional query parameters added to existing list endpoints:

| Endpoint | New Params |
|----------|-----------|
| `GET /api/testsuites` | `?q=` |
| `GET /api/testsuites/:suiteId/testcases` | `?q=`, `?priority=` |
| `GET /api/testruns` | `?q=` |
| `GET /api/reports` | `?q=` |

Backend implementation: `WHERE name LIKE '%' || :q || '%'` with parameterized queries.

### UI Changes

| Component | Change |
|-----------|--------|
| `Grid.jsx` | Add `onSearch` and `onFilter` props; show result count |
| `TestCases.jsx` | Add priority filter dropdown |
| `api.js` | Pass query params from component state to API calls |
| React Router | Sync filter state to URL with `useSearchParams` |

---

## 1.2 Sortable Columns

### User Story

> As a QA engineer, I want to sort the TestCases grid by priority or date so that I can quickly triage the most important tests.

### Acceptance Criteria

- [ ] Every column header in every grid is clickable.
- [ ] First click sorts ascending; second click on the same header sorts descending; third click removes the sort.
- [ ] An arrow icon (↑ / ↓) is shown on the active sort column.
- [ ] Only one column is sorted at a time.
- [ ] Sort state is reflected in the URL (`?sort=priority&order=desc`).
- [ ] Default sort for TestSuites: by `id` ascending. Default for TestCases: by `id` ascending. Default for TestRuns: by `created_date` descending.

### Data Model Changes

None.

### API Changes

`?sort=<column>&?order=asc|desc` query parameters on all list endpoints. The server validates that `sort` is a whitelisted column name before interpolating into the SQL `ORDER BY` clause.

### UI Changes

| Component | Change |
|-----------|--------|
| `Grid.jsx` | Column headers become buttons; sort indicator icon added; `sortBy`/`sortOrder` props |
| All page components | Pass sort state from URL to `Grid.jsx` and include in API call |

---

## 1.3 TestCase Cloning

### User Story

> As a QA engineer, I want to duplicate an existing TestCase (including all its TestSteps) into the same or a different TestSuite so that I can reuse test structure without rebuilding from scratch.

### Acceptance Criteria

- [ ] A "Clone" action is available in the TestCase row's action menu (kebab menu or dedicated button) on the TestCases grid.
- [ ] A "Clone" button is also present on the TestCase detail page.
- [ ] Clicking "Clone" opens a modal with a TestSuite dropdown (all suites listed, current suite pre-selected).
- [ ] User confirms by clicking "Clone". The modal closes and a toast "TestCase cloned successfully" appears.
- [ ] The user is redirected to the new TestCase's detail page.
- [ ] The cloned TestCase has the same name with " (copy)" appended. The user can rename it immediately.
- [ ] All TestSteps are copied with the same `action`, `expected_result`, and `step_number` values.
- [ ] `author_id` and `created_date` of the new TestCase are set to the current user and timestamp.
- [ ] Cloning does NOT copy comments, attachments, or history (those belong to the original).

### Data Model Changes

None. Cloning creates new rows in `test_cases` and `test_steps`.

### API Changes

```
POST /api/testcases/:id/clone
Body: { "target_suite_id": 2 }
Response 201: new TestCase object
```

### UI Changes

| Component | Change |
|-----------|--------|
| `TestCases.jsx` | Add "Clone" action to each row |
| `TestCaseDetail.jsx` | Add "Clone" button in the button bar |
| New `CloneModal.jsx` | TestSuite dropdown + Clone/Cancel buttons |
| `api.js` | `cloneTestCase(id, targetSuiteId)` method |

---

## 1.4 Bulk Operations

### User Story

> As a QA lead, I want to select multiple TestCases and delete them in one action, and select multiple TestRunCases to set their result at once, so that I can manage large test sets efficiently.

### Acceptance Criteria

**Bulk Delete (TestCases grid)**
- [ ] A checkbox column appears as the first column of the TestCases grid.
- [ ] A "Select All" checkbox in the column header checks/unchecks all visible rows.
- [ ] When one or more rows are checked, a bulk action toolbar appears above the grid.
- [ ] The toolbar shows a "Delete selected (N)" button.
- [ ] Clicking it opens a confirmation dialog: "Are you sure you want to delete N TestCases and all their TestSteps?"
- [ ] On confirm, all selected TestCases are deleted and the grid refreshes.

**Bulk Result Update (TestRun detail grid)**
- [ ] The TestRun detail grid gains a checkbox column.
- [ ] When rows are selected, a toolbar offers a "Set result to..." dropdown (pass / fail / skipped) and "Apply" button.
- [ ] On Apply, all selected TestRunCases are updated; the grid refreshes immediately.

### Data Model Changes

None.

### API Changes

```
DELETE /api/testcases/bulk
Body: { "ids": [5, 8, 12] }

PUT /api/testruns/:testrunId/testcases/bulk
Body: { "ids": [11, 14], "result": "pass" }
```

### UI Changes

| Component | Change |
|-----------|--------|
| `Grid.jsx` | Optional `selectable` prop adds checkbox column; exposes `selectedIds` to parent |
| New `BulkActionToolbar.jsx` | Rendered above grid when `selectedIds.length > 0` |
| `TestCases.jsx` | Wire up bulk delete flow with confirmation dialog |
| `TestRunDetail.jsx` | Wire up bulk result update flow |

---

## 2.1 Tagging / Labels

### User Story

> As a QA engineer, I want to apply tags (e.g. "smoke", "regression", "login") to TestCases so that I can quickly filter and report on specific categories of tests.

### Acceptance Criteria

- [ ] A "Tags" field appears on the TestCase detail and creation pages.
- [ ] Tags are free-form text; the user types a tag name and presses Enter to add it.
- [ ] Existing tags auto-suggest as the user types (typeahead dropdown).
- [ ] Tags display as removable chips on the TestCase detail page.
- [ ] The TestCases grid shows a "Tags" column with chip previews (max 3 shown; "+N more" if overflow).
- [ ] A tag filter chip bar appears above the TestCases grid.
- [ ] Clicking a tag chip filters the grid to TestCases with that tag (multi-select: clicking a second tag narrows further).
- [ ] The Reports overview page shows a tag cloud widget where tag size reflects frequency across all TestCases.
- [ ] Saving a TestCase with tag changes records the tag change in TestCase History.

### Data Model Changes

```sql
CREATE TABLE tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE test_case_tags (
  test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  tag_id       INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (test_case_id, tag_id)
);
```

### API Changes

```
GET    /api/tags
POST   /api/tags                        Body: { name }
GET    /api/testcases/:id/tags
PUT    /api/testcases/:id/tags          Body: { tag_ids: [1, 4] }
GET    /api/testsuites/:suiteId/testcases?tag=smoke
```

### UI Changes

| Component | Change |
|-----------|--------|
| `TestCaseDetail.jsx` & `TestCaseNew.jsx` | Add `TagInput.jsx` field |
| New `TagInput.jsx` | Typeahead chip input with create-on-enter behavior |
| `TestCases.jsx` | Tags column; `TagFilterBar.jsx` above grid |
| New `TagFilterBar.jsx` | Clickable filter chips |
| `ReportDetail.jsx` | `TagCloud.jsx` widget |
| New `TagCloud.jsx` | SVG/CSS tag cloud |

---

## 2.2 TestCase Comments

### User Story

> As a QA engineer, I want to leave comments on TestCases to communicate issues, questions, or context to my teammates without altering the test itself.

### Acceptance Criteria

- [ ] A "Comments" section appears at the bottom of the TestCase detail page and the TestRun execution page.
- [ ] Comments show: author's `user_name`, relative timestamp (e.g. "2 hours ago"), and text content.
- [ ] A text area + "Post" button allows adding a new comment.
- [ ] A user can delete their own comment (confirmation: "Delete this comment?").
- [ ] An Admin can delete any comment.
- [ ] Comments are shown newest-first by default.
- [ ] Comment count is shown in a badge on the "Comments" section header (e.g. "Comments (3)").

### Data Model Changes

```sql
CREATE TABLE comments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  author_id    INTEGER NOT NULL REFERENCES users(id),
  content      TEXT NOT NULL,
  created_date TEXT NOT NULL
);

CREATE INDEX idx_comments_test_case ON comments(test_case_id);
```

### API Changes

```
GET    /api/testcases/:id/comments
POST   /api/testcases/:id/comments    Body: { content }
DELETE /api/comments/:id
```

### UI Changes

| Component | Change |
|-----------|--------|
| `TestCaseDetail.jsx` | Render `<CommentThread testCaseId={id} />` at page bottom |
| `TestRunExecution.jsx` | Render `<CommentThread testCaseId={testCase.id} />` (readonly title, same component) |
| New `CommentThread.jsx` | List of comments + post form |
| New `Comment.jsx` | Single comment display with delete action |

---

## 2.3 File Attachments

### User Story

> As a QA engineer, I want to attach screenshots or documents to a TestCase or to a test execution result so that I can provide evidence and context directly within the TMS.

### Acceptance Criteria

- [ ] An "Attachments" panel appears on the TestCase detail page and on the TestRun execution page.
- [ ] Users can upload files via drag-and-drop or a file picker. Accepted types: images (jpg, png, gif, webp), PDF, plain text. Max size: 10 MB (configurable via Admin in Phase 4).
- [ ] Uploaded images show a thumbnail preview.
- [ ] Non-image files show a file-type icon and filename.
- [ ] Clicking an image opens a lightbox. Clicking a non-image file downloads it.
- [ ] Each attachment has a delete button (visible to the uploader and Admin).
- [ ] The attachment count is shown in the panel header badge.
- [ ] Files are stored on the server at `/server/uploads/<attachment_id>-<filename>` and served at `/uploads/<filename>`.

### Data Model Changes

```sql
CREATE TABLE attachments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  test_case_id     INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
  test_run_case_id INTEGER REFERENCES test_run_cases(id) ON DELETE CASCADE,
  filename         TEXT NOT NULL,
  filepath         TEXT NOT NULL,
  mime_type        TEXT NOT NULL,
  uploaded_date    TEXT NOT NULL,
  uploader_id      INTEGER NOT NULL REFERENCES users(id),
  CHECK (
    (test_case_id IS NOT NULL AND test_run_case_id IS NULL) OR
    (test_case_id IS NULL AND test_run_case_id IS NOT NULL)
  )
);
```

### API Changes

```
GET    /api/testcases/:id/attachments
POST   /api/testcases/:id/attachments       multipart/form-data, field: file
GET    /api/testruncases/:id/attachments
POST   /api/testruncases/:id/attachments    multipart/form-data, field: file
DELETE /api/attachments/:id
GET    /uploads/:filename                   (static file serving via Express)
```

Server uses `multer` for multipart parsing.

### UI Changes

| Component | Change |
|-----------|--------|
| `TestCaseDetail.jsx` | Render `<AttachmentPanel entityType="testcase" entityId={id} />` |
| `TestRunExecution.jsx` | Render `<AttachmentPanel entityType="testrunccase" entityId={id} />` |
| New `AttachmentPanel.jsx` | Drop zone + file list with thumbnails |
| New `ImageLightbox.jsx` | Full-screen image overlay |

---

## 2.4 TestCase Import / Export

### User Story

> As a QA lead, I want to export a TestSuite to CSV so that I can share it via email or review it in a spreadsheet, and import a CSV to quickly create a suite from an existing document.

### Acceptance Criteria

**Export**
- [ ] An "Export" dropdown menu on the TestSuites grid (per-row action menu) offers "Export as CSV" and "Export as JSON".
- [ ] The exported file is named `<suite-name>-<date>.csv` (or `.json`).
- [ ] CSV columns: `suite_name`, `case_name`, `priority`, `step_number`, `action`, `expected_result`.
- [ ] Each TestStep is its own row; TestCase fields are repeated across step rows (denormalized).
- [ ] JSON format is the structured object matching `GET /api/testsuites/:id` response.

**Import**
- [ ] An "Import TestSuite" button appears on the TestSuites grid page.
- [ ] Clicking it opens a modal with a file picker (CSV or JSON) and format selector.
- [ ] After file selection, a preview table is shown before committing:
  - Valid rows shown in white.
  - Error rows shown in red with an error message (e.g. "Missing priority on row 5").
- [ ] "Import" button is disabled if there are any errors.
- [ ] On success, a toast "Imported 14 TestCases across 1 TestSuite" is shown and the grid refreshes.
- [ ] Duplicate TestSuite names receive a numeric suffix (e.g. "User Authentication (2)").

### Data Model Changes

None. Import creates rows in existing tables.

### API Changes

```
GET  /api/testsuites/:id/export?format=csv|json
POST /api/testsuites/import    multipart/form-data fields: file, format
```

Libraries: `papaparse` (CSV parsing/generation), native `JSON.stringify` (JSON export).

### UI Changes

| Component | Change |
|-----------|--------|
| `TestSuites.jsx` | Export dropdown on each row; "Import TestSuite" button |
| New `ImportModal.jsx` | File picker, format selector, preview table, Import/Cancel buttons |
| `api.js` | `exportTestSuite(id, format)` triggers browser download; `importTestSuite(file, format)` |

---

## 2.5 TestCase History / Versioning

### User Story

> As a QA engineer, I want to see the full edit history of a TestCase — what changed, who changed it, and when — so that I can understand how the test evolved and recover from accidental changes.

### Acceptance Criteria

- [ ] A "History" tab appears on the TestCase detail page alongside the default (details) tab.
- [ ] The History tab shows a chronological list of change events (newest first):
  - Editor's `user_name`
  - Relative and absolute timestamp
  - Summary of changed fields (e.g. "Priority changed · Steps edited")
- [ ] Clicking a history entry expands an inline diff:
  - Text changes shown with red (removed) and green (added) highlights.
  - Step additions/deletions clearly marked.
- [ ] A "Restore this version" button reverts the TestCase to that snapshot (with a confirmation dialog).
- [ ] History is immutable — it cannot be deleted by QA users. Admin can purge all history for a TestCase via the Admin panel (Phase 4).
- [ ] The initial save (creation) is recorded as the first history entry with action "Created".

### Data Model Changes

```sql
CREATE TABLE test_case_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  changed_by   INTEGER NOT NULL REFERENCES users(id),
  changed_date TEXT NOT NULL,
  action       TEXT NOT NULL,   -- 'created', 'updated', 'restored'
  snapshot     TEXT NOT NULL    -- JSON blob of full TestCase + steps at this point
);

CREATE INDEX idx_history_test_case ON test_case_history(test_case_id);
```

### API Changes

```
GET /api/testcases/:id/history
GET /api/testcases/:id/history/:historyId/diff?compare_to=<historyId>
POST /api/testcases/:id/history/:historyId/restore
```

History is written server-side inside the `PUT /api/testcases/:id` handler — no client change needed to trigger recording.

### UI Changes

| Component | Change |
|-----------|--------|
| `TestCaseDetail.jsx` | Add tab bar: "Details" / "History" |
| New `HistoryTab.jsx` | Timeline list of history entries |
| New `HistoryEntry.jsx` | Expandable diff view per entry; Restore button |
| New `DiffView.jsx` | Red/green text diff renderer |

---

## 2.6 Dashboard

### User Story

> As a QA lead, I want a dashboard landing page that gives me an instant overview of the project's testing health so that I don't have to navigate multiple pages to get a status snapshot.

### Acceptance Criteria

- [ ] `/dashboard` is the default landing page after login (replaces `/testsuites` as the redirect target).
- [ ] The navigation menu gains a "Dashboard" item as the first entry.
- [ ] The dashboard shows four widgets:
  1. **Summary Counters**: Total TestSuites, Total TestCases, Total TestRuns, Average Pass Rate (last 5 runs).
  2. **Pass Rate Trend**: Line chart of pass rate % for the last 10 TestRuns (x-axis: run date, y-axis: 0–100%).
  3. **Top Failed TestCases**: Table listing the 5 TestCases with the most "fail" results across all runs.
  4. **Recent Activity Feed**: Last 10 events (creates, edits, run completions) with actor, entity name, and timestamp.
- [ ] Each counter card is a link to the relevant section (e.g. clicking "TestSuites" goes to `/testsuites`).
- [ ] The dashboard auto-refreshes every 60 seconds.
- [ ] All widgets show a loading skeleton while data is being fetched.

### Data Model Changes

None. Dashboard data is derived from existing tables via aggregation queries.

### API Changes

```
GET /api/dashboard
Response: {
  total_suites, total_cases, total_runs, avg_pass_rate,
  pass_rate_trend: [{ test_run_id, created_date, pass_rate }],
  top_failed_cases: [{ test_case_id, name, fail_count }],
  recent_activity: [{ action, entity_name, actor, timestamp }]
}
```

### UI Changes

| Component | Change |
|-----------|--------|
| New `Dashboard.jsx` (page) | Layout of all four widgets |
| New `SummaryCounters.jsx` | Four stat cards with links |
| New `PassRateTrendChart.jsx` | recharts `LineChart` |
| New `TopFailedCasesTable.jsx` | Simple 2-column table |
| New `ActivityFeed.jsx` | Scrollable list of events |
| `App.jsx` | Default redirect after login → `/dashboard` |
| `Header.jsx` | Add "Dashboard" nav item |

---

## 3.1 Real-time Collaboration

### User Story

> As a QA engineer, I want to see test execution results update in real time while my teammates are running the same TestRun so that we don't need to refresh the page to see progress.

### Acceptance Criteria

- [ ] When two users have the same TestRun detail page open, any execution save by either user immediately updates the other's view (no page refresh).
- [ ] The updated row flashes briefly (highlight animation) to draw attention.
- [ ] A presence bar at the top of the TestRun detail page shows avatars/initials of all users currently viewing the same run.
- [ ] Presence updates within 5 seconds of a user joining or leaving the page.
- [ ] If the WebSocket connection drops, the client falls back to polling every 30 seconds and shows a "Reconnecting..." badge.
- [ ] Real-time updates also apply to the TestCase detail page: if another user saves changes, all viewers see the updated name/priority.

### Data Model Changes

None. WebSocket state is in-memory on the server.

### API Changes

WebSocket server added via `socket.io` attached to the existing HTTP server. See `API.md` Phase 3 WebSocket Events section for the full event model.

No new REST endpoints for this feature.

### UI Changes

| Component | Change |
|-----------|--------|
| `TestRunDetail.jsx` | Join `testrun:<id>` room on mount; handle `testruncase:updated` event; animate updated rows |
| `TestCaseDetail.jsx` | Join `testcase:<id>` room; handle `testcase:updated` event |
| New `PresenceBar.jsx` | Shows online users for the current page |
| New `useSocket.js` (hook) | Wraps `socket.io-client` connection lifecycle |
| `App.jsx` | Initialize `socket.io` client once; provide via context |

---

## 3.2 CI/CD Webhooks

### User Story

> As a DevOps engineer, I want TMS to send a webhook when a TestRun completes so that my CI pipeline can react to test results, and I want to trigger a new TestRun from the pipeline by calling a TMS endpoint.

### Acceptance Criteria

**Outbound Webhook**
- [ ] When a TestRun reaches 100% execution (all cases have `executed = true`), TMS POSTs to all active webhook URLs configured for the `testrun:completed` event.
- [ ] The payload includes: `testRunId`, `createdDate`, `total`, `passed`, `failed`, `skipped`, `passRate`.
- [ ] The request includes an `X-TMS-Signature` header (HMAC-SHA256 of the payload body using the stored secret).
- [ ] Failed webhook deliveries are retried up to 3 times with exponential backoff.
- [ ] Webhook delivery status (success / failed) is logged and visible in the Admin panel.

**Inbound Trigger**
- [ ] `POST /api/webhooks/trigger-run` creates a new TestRun with the provided `test_case_ids`.
- [ ] The request must include `X-TMS-Secret` matching the configured inbound secret.
- [ ] Response includes the new `test_run_id` for the pipeline to poll.

### Data Model Changes

```sql
CREATE TABLE webhook_configs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event      TEXT NOT NULL,
  url        TEXT NOT NULL,
  secret     TEXT NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE webhook_deliveries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id      INTEGER REFERENCES webhook_configs(id) ON DELETE CASCADE,
  test_run_id     INTEGER,
  status          TEXT NOT NULL,   -- 'success', 'failed'
  response_code   INTEGER,
  delivered_at    TEXT
);
```

### API Changes

```
GET    /api/webhooks                Admin only
POST   /api/webhooks                Admin only
PUT    /api/webhooks/:id            Admin only
DELETE /api/webhooks/:id            Admin only
POST   /api/webhooks/trigger-run    Requires X-TMS-Secret header
```

### UI Changes

| Component | Change |
|-----------|--------|
| New `AdminWebhooks.jsx` (page) | Webhook config grid + create/edit form |
| New `WebhookDeliveryLog.jsx` | Per-webhook delivery history table |

---

## 3.3 JIRA / Issue Tracker Linking

### User Story

> As a QA engineer, I want to link a failed test execution to a JIRA ticket so that developers can see the failing test directly from the issue tracker and I have a traceable record of defects.

### Acceptance Criteria

- [ ] On the TestRun execution page, after setting the result to "fail", a "Link Issue" section appears.
- [ ] The user can enter an issue URL and a label (e.g. `TMS-42`).
- [ ] Multiple issues can be linked to a single TestRunCase.
- [ ] Linked issues are displayed as clickable badges on the TestRun detail page and on the execution page.
- [ ] Badges open the issue URL in a new browser tab.
- [ ] Issue links can be removed from the execution page.

### Data Model Changes

```sql
CREATE TABLE test_run_case_issues (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  test_run_case_id INTEGER NOT NULL REFERENCES test_run_cases(id) ON DELETE CASCADE,
  issue_url        TEXT NOT NULL,
  issue_label      TEXT NOT NULL
);
```

### API Changes

```
GET    /api/testruncases/:id/issues
POST   /api/testruncases/:id/issues    Body: { issue_url, issue_label }
DELETE /api/issues/:id
```

### UI Changes

| Component | Change |
|-----------|--------|
| `TestRunExecution.jsx` | Add "Link Issue" form (URL + label inputs); show linked issue badges |
| `TestRunDetail.jsx` | Show issue badges on each result row |
| New `IssueBadge.jsx` | Clickable chip linking to issue URL |

---

## 3.4 Email & Slack Notifications

### User Story

> As a QA lead, I want to receive a Slack message when a TestRun completes so that I know immediately whether the regression suite passed without checking the TMS manually.

### Acceptance Criteria

- [ ] Admin can configure notification rules at `/admin/notifications`:
  - Trigger events: `testrun:completed`, `testcase:failed`
  - Channels: `email` (SMTP) or `slack` (Incoming Webhook URL)
  - Target: email address or Slack webhook URL
- [ ] For `testrun:completed`: notification includes run ID, date, pass/fail/skipped counts, and a link to the report.
- [ ] For `testcase:failed`: notification includes TestCase name, TestRun ID, executor name, and a link to the execution page.
- [ ] Notifications are sent asynchronously (non-blocking; errors logged but do not fail the API response).
- [ ] A "Test" button in the admin panel sends a sample notification immediately.

### Data Model Changes

```sql
CREATE TABLE notification_configs (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  event   TEXT NOT NULL,    -- 'testrun:completed', 'testcase:failed'
  channel TEXT NOT NULL,    -- 'email', 'slack'
  target  TEXT NOT NULL,    -- email address or Slack webhook URL
  active  INTEGER NOT NULL DEFAULT 1
);
```

### API Changes

```
GET    /api/notifications/config           Admin only
POST   /api/notifications/config           Admin only
PUT    /api/notifications/config/:id       Admin only
DELETE /api/notifications/config/:id       Admin only
POST   /api/notifications/config/:id/test  Admin only — sends test message
```

**Backend dependencies**: `nodemailer` (email), `axios` (Slack POST to Incoming Webhook URL).

### UI Changes

| Component | Change |
|-----------|--------|
| New `AdminNotifications.jsx` (page) | Grid of notification rules + create/edit form with Test button |

---

## 3.5 Test Plans

### User Story

> As a QA lead, I want to group multiple TestRuns under a named milestone (e.g. "Sprint 42 Regression") so that I can track aggregate test coverage and pass rate for that milestone in one view.

### Acceptance Criteria

- [ ] A "Test Plans" section is added to the navigation menu.
- [ ] The Test Plans grid shows: ID, Name, Created Date, Number of TestRuns, Aggregate Pass Rate.
- [ ] "New Test Plan" page: user provides a name and selects one or more existing TestRuns via a multi-select list.
- [ ] Test Plan detail page shows:
  - Summary: aggregate total / passed / failed / skipped across all linked TestRuns.
  - Donut chart (same as individual report, but combined).
  - List of linked TestRuns with individual pass rates (each row links to its TestRun detail page).
- [ ] TestRuns can be added to or removed from a Test Plan after creation.
- [ ] A TestRun can belong to multiple Test Plans.

### Data Model Changes

```sql
CREATE TABLE test_plans (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  created_date TEXT NOT NULL,
  creator_id   INTEGER REFERENCES users(id)
);

CREATE TABLE test_plan_runs (
  test_plan_id INTEGER NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
  test_run_id  INTEGER NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  PRIMARY KEY (test_plan_id, test_run_id)
);
```

### API Changes

```
GET    /api/testplans
POST   /api/testplans              Body: { name, test_run_ids }
GET    /api/testplans/:id
PUT    /api/testplans/:id          Body: { name, test_run_ids }
DELETE /api/testplans/:id
```

### UI Changes

| Component | Change |
|-----------|--------|
| New `TestPlans.jsx` (page) | Grid of Test Plans |
| New `TestPlanNew.jsx` (page) | Create form with multi-select TestRun list |
| New `TestPlanDetail.jsx` (page) | Summary + donut chart + linked runs table |
| `Header.jsx` | Add "Test Plans" nav item |

---

## 4.1 User Management

### User Story

> As a system Admin, I want to create, edit, and deactivate user accounts so that I can onboard new team members and revoke access for departed ones without touching the database directly.

### Acceptance Criteria

- [ ] `/admin/users` shows a grid of all users: ID, Login, Name, Role, Status (Active / Inactive).
- [ ] Admin can create a new user (all fields + role selection; password set by Admin).
- [ ] Admin can edit `user_name` and `role` inline or via an edit modal.
- [ ] Admin can deactivate an account (toggle). Deactivated users see "Your account has been deactivated." on login.
- [ ] Admin can reset a user's password to a specified temporary value.
- [ ] Admin cannot delete their own account or the primary "admin" account.
- [ ] All user management actions are recorded in the Audit Log (Phase 4.2).

### Data Model Changes

```sql
ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
```

### API Changes

```
GET    /api/admin/users
POST   /api/admin/users               Body: { login, password, user_name, role }
PUT    /api/admin/users/:id           Body: { user_name, role, active }
POST   /api/admin/users/:id/reset-password  Body: { new_password }
```

Login endpoint: if `active = 0`, return `403 { error: "Account deactivated" }`.

### UI Changes

| Component | Change |
|-----------|--------|
| New `AdminUsers.jsx` (page) | User grid with edit/deactivate/reset-password actions |
| `Login.jsx` | Display "Account deactivated" message on `403` response |

---

## 4.2 Audit Log

### User Story

> As a system Admin, I want a searchable log of all significant actions in the TMS so that I can investigate incidents and verify compliance.

### Acceptance Criteria

- [ ] `/admin/audit` shows a filterable grid: Timestamp, Actor, Action, Entity Type, Entity ID, Changed Fields.
- [ ] Filters: entity type dropdown, actor name search, date range picker.
- [ ] Events logged: create, update, delete for TestSuite, TestCase, TestStep, TestRun, User.
- [ ] Log entries are never deleted by regular users. Admins can archive logs older than a configurable date.
- [ ] Clicking an entity ID in the log navigates to that entity (if it still exists).
- [ ] Audit writes are non-blocking (fire-and-forget inside route handlers).

### Data Model Changes

```sql
CREATE TABLE audit_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type    TEXT NOT NULL,
  entity_id      INTEGER,
  action         TEXT NOT NULL,    -- 'create', 'update', 'delete'
  changed_fields TEXT,             -- JSON array of field names
  actor_id       INTEGER REFERENCES users(id),
  timestamp      TEXT NOT NULL
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_entity    ON audit_log(entity_type, entity_id);
```

### API Changes

```
GET /api/admin/audit
  Query: entity_type, actor_id, from, to, page, limit
  Response: { total, page, limit, entries: [...] }
```

Audit writes happen inside existing route handlers — no separate audit endpoint for writes.

### UI Changes

| Component | Change |
|-----------|--------|
| New `AdminAudit.jsx` (page) | Filterable grid with date range picker |

---

## 4.3 System Configuration

### User Story

> As a system Admin, I want to configure application defaults (default priority, session timeout, max attachment size) from the UI so that I don't need to edit code or environment files to change behaviour.

### Acceptance Criteria

- [ ] `/admin/config` shows a settings form with all configurable keys.
- [ ] Changes are saved with a "Save Settings" button. A success toast confirms.
- [ ] Settings take effect immediately for new requests (no server restart required).
- [ ] The server reads config values from the `system_config` table on each relevant operation (cached in memory, invalidated on write).

**Configurable settings**

| Key | Default | Description |
|-----|---------|-------------|
| `default_priority` | `Medium` | Pre-selected priority on new TestCase form |
| `session_timeout_minutes` | `480` | Minutes before an idle session expires |
| `max_attachment_size_mb` | `10` | Maximum file upload size in MB |
| `inbound_webhook_secret` | `""` | Secret for `POST /api/webhooks/trigger-run` |

### Data Model Changes

```sql
CREATE TABLE system_config (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL,
  updated_by   INTEGER REFERENCES users(id),
  updated_date TEXT
);
```

### API Changes

```
GET /api/admin/config
PUT /api/admin/config    Body: { key: value, ... }
```

### UI Changes

| Component | Change |
|-----------|--------|
| New `AdminConfig.jsx` (page) | Settings form with labeled inputs and Save button |

---

## 4.4 Data Retention / Archival

### User Story

> As a system Admin, I want to archive old TestRuns so that the main UI stays uncluttered without permanently losing historical data.

### Acceptance Criteria

- [ ] `/admin/archive` lists all archived TestRuns with their original date and statistics.
- [ ] Admin can manually archive any TestRun from the TestRuns grid (new "Archive" action) or from the Admin archive page.
- [ ] Archived TestRuns are hidden from the main `/testruns` grid and from `/reports`.
- [ ] Admin can restore an archived TestRun back to the active state.
- [ ] A configurable retention policy (set in System Config: `auto_archive_after_days`) automatically archives TestRuns older than N days. A scheduled server-side job runs at midnight.
- [ ] Archiving does not delete any data; it only sets `archived = 1` on the TestRun row.

### Data Model Changes

```sql
ALTER TABLE test_runs ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
```

Add `WHERE archived = 0` to all existing TestRun list queries.

### API Changes

```
GET  /api/admin/archive                   Admin only
POST /api/admin/testruns/:id/archive      Admin only
POST /api/admin/testruns/:id/restore      Admin only
```

### UI Changes

| Component | Change |
|-----------|--------|
| `TestRuns.jsx` | Add "Archive" row action (Admin only, hidden for QA) |
| New `AdminArchive.jsx` (page) | Grid of archived runs with Restore button |
| `AdminConfig.jsx` | Add `auto_archive_after_days` field |
