# TMS API Reference

This document provides a complete reference for all HTTP endpoints in the TMS backend — both the endpoints shipped in the initial release and the planned endpoints for each roadmap phase.

All endpoints are prefixed with `/api`. All protected endpoints require an active session cookie (set by `POST /api/auth/login`).

---

## Table of Contents

1. [Conventions](#conventions)
2. [Authentication](#authentication)
3. [TestSuites](#testsuites)
4. [TestCases](#testcases)
5. [TestSteps](#teststeps)
6. [TestRuns](#testruns)
7. [TestRunCases](#testruncases)
8. [Reports](#reports)
9. [Phase 1 — Search & Filter Extensions](#phase-1--search--filter-extensions)
10. [Phase 2 — Tags, Comments, Attachments, Import/Export, History](#phase-2--tags-comments-attachments-importexport-history)
11. [Phase 2 — Dashboard](#phase-2--dashboard)
12. [Phase 3 — Webhooks, Issues, Notifications, Test Plans](#phase-3--webhooks-issues-notifications-test-plans)
13. [Phase 3 — WebSocket Events](#phase-3--websocket-events)
14. [Phase 4 — Admin](#phase-4--admin)
15. [Error Response Format](#error-response-format)

---

## Conventions

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — successful read or update |
| 201 | Created — successful resource creation |
| 400 | Bad Request — validation error |
| 401 | Unauthorized — no valid session |
| 403 | Forbidden — insufficient role |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — uniqueness constraint violated |
| 500 | Internal Server Error |

### Auth Column

- **None** — public endpoint, no session required
- **Any** — requires a valid session (any role)
- **Admin** — requires `role = 'admin'`

### Request / Response Format

All request bodies and response bodies are `application/json` unless otherwise noted (e.g. file upload endpoints use `multipart/form-data`).

Timestamps are always strings in `YYYY-MM-DD HH:mm` format.

---

## Authentication

### `POST /api/auth/register`

Create a new user account with the QA role.

**Auth**: None

**Request Body**

```json
{
  "login": "jdoe",
  "password": "secret",
  "user_name": "Jane Doe"
}
```

**Validation**
- `login` — required, must be unique
- `password` — required
- `user_name` — required

**Response `201`**

```json
{
  "id": 2,
  "login": "jdoe",
  "user_name": "Jane Doe",
  "role": "QA"
}
```

**Errors**: `400` if validation fails, `409` if login already exists.

---

### `POST /api/auth/login`

Authenticate and start a session.

**Auth**: None

**Request Body**

```json
{
  "login": "jdoe",
  "password": "secret"
}
```

**Response `200`** — sets a `connect.sid` session cookie

```json
{
  "id": 2,
  "login": "jdoe",
  "user_name": "Jane Doe",
  "role": "QA"
}
```

**Errors**: `400` if fields missing, `401` if credentials invalid.

---

### `POST /api/auth/logout`

End the current session.

**Auth**: Any

**Response `200`**

```json
{ "message": "Logged out" }
```

---

### `GET /api/auth/me`

Return the currently authenticated user.

**Auth**: Any

**Response `200`**

```json
{
  "id": 2,
  "login": "jdoe",
  "user_name": "Jane Doe",
  "role": "QA"
}
```

**Errors**: `401` if no active session.

---

## TestSuites

### `GET /api/testsuites`

Get all TestSuites.

**Auth**: Any

**Response `200`**

```json
[
  { "id": 1, "name": "User Authentication" },
  { "id": 2, "name": "Payment Processing" }
]
```

---

### `POST /api/testsuites`

Create a new TestSuite.

**Auth**: Any

**Request Body**

```json
{ "name": "Dashboard Features" }
```

**Validation**: `name` required and unique.

**Response `201`**

```json
{ "id": 3, "name": "Dashboard Features" }
```

**Errors**: `400` if validation fails, `409` if name already exists.

---

### `GET /api/testsuites/:id`

Get a single TestSuite by ID.

**Auth**: Any

**Response `200`**

```json
{ "id": 1, "name": "User Authentication" }
```

**Errors**: `404` if not found.

---

### `PUT /api/testsuites/:id`

Update a TestSuite's name.

**Auth**: Any

**Request Body**

```json
{ "name": "Auth & Sessions" }
```

**Response `200`**

```json
{ "id": 1, "name": "Auth & Sessions" }
```

**Errors**: `400`, `404`, `409`.

---

### `DELETE /api/testsuites/:id`

Delete a TestSuite. Cascade-deletes all TestCases and TestSteps belonging to it.

**Auth**: Any

**Response `200`**

```json
{ "message": "TestSuite deleted" }
```

**Errors**: `404`.

---

## TestCases

### `GET /api/testsuites/:suiteId/testcases`

Get all TestCases for a TestSuite (with author name).

**Auth**: Any

**Response `200`**

```json
[
  {
    "id": 5,
    "name": "Verify login with valid credentials",
    "priority": "High",
    "created_date": "2026-03-01 10:30",
    "author_id": 1,
    "author_name": "Administrator"
  }
]
```

---

### `POST /api/testsuites/:suiteId/testcases`

Create a TestCase in a TestSuite.

**Auth**: Any

**Request Body**

```json
{
  "name": "Verify login with valid credentials",
  "priority": "High"
}
```

`created_date` and `author_id` are set server-side from the current timestamp and session user.

**Response `201`**

```json
{
  "id": 5,
  "name": "Verify login with valid credentials",
  "test_suite_id": 1,
  "priority": "High",
  "created_date": "2026-03-27 09:15",
  "author_id": 2
}
```

---

### `GET /api/testcases/:id`

Get a single TestCase with all its TestSteps.

**Auth**: Any

**Response `200`**

```json
{
  "id": 5,
  "name": "Verify login with valid credentials",
  "test_suite_id": 1,
  "priority": "High",
  "created_date": "2026-03-01 10:30",
  "author_id": 1,
  "author_name": "Administrator",
  "steps": [
    {
      "id": 12,
      "step_number": 1,
      "action": "Navigate to login page",
      "expected_result": "Login page is displayed"
    }
  ]
}
```

---

### `PUT /api/testcases/:id`

Update a TestCase (name, priority) and its TestSteps in a single request.

**Auth**: Any

**Request Body**

```json
{
  "name": "Verify login with valid credentials",
  "priority": "High",
  "steps": [
    { "id": 12, "action": "Navigate to /login", "expected_result": "Login page loads" },
    { "id": null, "action": "Enter username", "expected_result": "Username field accepts input" }
  ]
}
```

Steps with `"id": null` are created. Existing step IDs are updated. Steps absent from the array are deleted. `step_number` is recalculated server-side based on array order.

**Response `200`** — full TestCase object (same shape as `GET /api/testcases/:id`).

---

### `DELETE /api/testcases/:id`

Delete a TestCase and all its TestSteps.

**Auth**: Any

**Response `200`**

```json
{ "message": "TestCase deleted" }
```

---

## TestSteps

### `GET /api/testcases/:testcaseId/teststeps`

Get all TestSteps for a TestCase, ordered by `step_number`.

**Auth**: Any

**Response `200`**

```json
[
  { "id": 12, "step_number": 1, "action": "Navigate to login page", "expected_result": "Login page is displayed" },
  { "id": 13, "step_number": 2, "action": "Enter username", "expected_result": "Field accepts input" }
]
```

---

### `POST /api/testcases/:testcaseId/teststeps`

Add a TestStep to a TestCase. `step_number` is auto-assigned as `max + 1`.

**Auth**: Any

**Request Body**

```json
{
  "action": "Click Submit",
  "expected_result": "Form is submitted"
}
```

**Response `201`**

```json
{ "id": 14, "step_number": 3, "action": "Click Submit", "expected_result": "Form is submitted" }
```

---

### `PUT /api/teststeps/:id`

Update a single TestStep's action and/or expected result.

**Auth**: Any

**Request Body**

```json
{
  "action": "Click the Login button",
  "expected_result": "User is redirected to /testsuites"
}
```

**Response `200`** — updated TestStep object.

---

### `DELETE /api/teststeps/:id`

Delete a TestStep. Renumbers all subsequent steps in the same TestCase.

**Auth**: Any

**Response `200`**

```json
{ "message": "TestStep deleted" }
```

---

## TestRuns

### `GET /api/testruns`

Get all TestRuns with pass rate.

**Auth**: Any

**Response `200`**

```json
[
  {
    "id": 3,
    "created_date": "2026-03-20 14:00",
    "creator_id": 1,
    "creator_name": "Administrator",
    "total": 25,
    "passed": 19,
    "pass_rate": "76.0%"
  }
]
```

---

### `POST /api/testruns`

Create a new TestRun with a selection of TestCases.

**Auth**: Any

**Request Body**

```json
{
  "test_case_ids": [1, 3, 5, 8, 12]
}
```

`created_date` and `creator_id` are set server-side.

**Response `201`**

```json
{
  "id": 4,
  "created_date": "2026-03-27 10:00",
  "creator_id": 2
}
```

---

### `GET /api/testruns/:id`

Get a TestRun with all TestRunCases grouped by TestSuite.

**Auth**: Any

**Response `200`**

```json
{
  "id": 3,
  "created_date": "2026-03-20 14:00",
  "creator_name": "Administrator",
  "suites": [
    {
      "suite_id": 1,
      "suite_name": "User Authentication",
      "cases": [
        {
          "id": 11,
          "test_case_id": 5,
          "test_case_name": "Verify login with valid credentials",
          "executed": false,
          "result": "skipped",
          "executed_date": null,
          "executor_name": null
        }
      ]
    }
  ]
}
```

---

### `DELETE /api/testruns/:id`

Delete a TestRun and all its TestRunCases.

**Auth**: Any

**Response `200`**

```json
{ "message": "TestRun deleted" }
```

---

## TestRunCases

### `GET /api/testruns/:testrunId/testcases`

Get all TestRunCases for a TestRun (flat list).

**Auth**: Any

**Response `200`** — array of TestRunCase objects (same shape as cases in `GET /api/testruns/:id`).

---

### `GET /api/testruncases/:id`

Get a single TestRunCase with full TestCase details and TestSteps (for the execution page).

**Auth**: Any

**Response `200`**

```json
{
  "id": 11,
  "test_run_id": 3,
  "executed": false,
  "result": "skipped",
  "executed_date": null,
  "executor_name": null,
  "test_case": {
    "id": 5,
    "name": "Verify login with valid credentials",
    "priority": "High",
    "created_date": "2026-03-01 10:30",
    "author_name": "Administrator",
    "steps": [
      { "id": 12, "step_number": 1, "action": "Navigate to login page", "expected_result": "Login page is displayed" }
    ]
  }
}
```

---

### `PUT /api/testruncases/:id`

Save the execution result for a TestRunCase.

**Auth**: Any

**Request Body**

```json
{
  "result": "pass"
}
```

`executed` is set to `true`, `executed_date` to the current timestamp, and `executor_id` to the session user server-side.

**Response `200`** — updated TestRunCase object (same shape as `GET /api/testruncases/:id`).

---

## Reports

### `GET /api/reports`

Get all TestRuns with full statistics for the Reports grid.

**Auth**: Any

**Response `200`**

```json
[
  {
    "test_run_id": 3,
    "created_date": "2026-03-20 14:00",
    "total": 25,
    "executed": 20,
    "passed": 15,
    "failed": 3,
    "skipped": 7
  }
]
```

---

### `GET /api/reports/:testrunId`

Get a detailed report for one TestRun.

**Auth**: Any

**Response `200`**

```json
{
  "test_run_id": 3,
  "created_date": "2026-03-20 14:00",
  "creator_name": "Administrator",
  "total": 25,
  "executed": 20,
  "passed": 15,
  "failed": 3,
  "skipped": 7,
  "cases_by_result": {
    "pass": ["Verify login with valid credentials", "Check password validation"],
    "fail": ["Verify logout clears session"],
    "skipped": ["Test forgot password flow"]
  }
}
```

---

## Phase 1 — Search & Filter Extensions

These query parameters are added to existing list endpoints. They are all optional and combinable.

### Query Parameters (applied to list endpoints)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | Full-text search on name/title field | `?q=login` |
| `sort` | string | Column name to sort by | `?sort=priority` |
| `order` | string | `asc` or `desc` (default `asc`) | `?order=desc` |
| `priority` | string | Filter TestCases by priority | `?priority=High` |
| `tag` | string | Filter TestCases by tag name (Phase 2) | `?tag=smoke` |

**Affected endpoints**

| Endpoint | New Parameters |
|----------|----------------|
| `GET /api/testsuites` | `q`, `sort`, `order` |
| `GET /api/testsuites/:suiteId/testcases` | `q`, `sort`, `order`, `priority` |
| `GET /api/testruns` | `sort`, `order` |
| `GET /api/reports` | `sort`, `order` |

### `POST /api/testcases/:id/clone`

Clone a TestCase (with all TestSteps) to a target TestSuite.

**Auth**: Any

**Request Body**

```json
{ "target_suite_id": 2 }
```

**Response `201`** — new TestCase object (same shape as `GET /api/testcases/:id`).

### `DELETE /api/testcases/bulk`

Bulk delete multiple TestCases.

**Auth**: Any

**Request Body**

```json
{ "ids": [5, 8, 12] }
```

**Response `200`**

```json
{ "deleted": 3 }
```

### `PUT /api/testruns/:testrunId/testcases/bulk`

Bulk update the result of multiple TestRunCases in a TestRun.

**Auth**: Any

**Request Body**

```json
{
  "ids": [11, 14, 15],
  "result": "pass"
}
```

**Response `200`**

```json
{ "updated": 3 }
```

---

## Phase 2 — Tags, Comments, Attachments, Import/Export, History

### Tags

#### `GET /api/tags`

Get all tags.

**Auth**: Any

**Response `200`** — `[{ "id": 1, "name": "smoke" }, ...]`

---

#### `POST /api/tags`

Create a tag.

**Auth**: Any

**Request Body**: `{ "name": "regression" }`

**Response `201`**: `{ "id": 4, "name": "regression" }`

---

#### `GET /api/testcases/:id/tags`

Get all tags on a TestCase.

**Auth**: Any

**Response `200`**: `[{ "id": 1, "name": "smoke" }]`

---

#### `PUT /api/testcases/:id/tags`

Replace all tags on a TestCase.

**Auth**: Any

**Request Body**: `{ "tag_ids": [1, 4] }`

**Response `200`**: `[{ "id": 1, "name": "smoke" }, { "id": 4, "name": "regression" }]`

---

### Comments

#### `GET /api/testcases/:id/comments`

Get all comments on a TestCase, newest first.

**Auth**: Any

**Response `200`**

```json
[
  {
    "id": 7,
    "author_name": "Jane Doe",
    "content": "Step 3 needs clearer expected result.",
    "created_date": "2026-03-25 11:00"
  }
]
```

---

#### `POST /api/testcases/:id/comments`

Add a comment.

**Auth**: Any

**Request Body**: `{ "content": "Step 3 needs clearer expected result." }`

**Response `201`** — full comment object.

---

#### `DELETE /api/comments/:id`

Delete a comment. QA users can only delete their own; Admin can delete any.

**Auth**: Any

**Response `200`**: `{ "message": "Comment deleted" }`

---

### Attachments

#### `GET /api/testcases/:id/attachments`

Get all attachments for a TestCase.

**Auth**: Any

**Response `200`**: `[{ "id": 3, "filename": "screenshot.png", "uploaded_date": "2026-03-26 09:00" }]`

---

#### `POST /api/testcases/:id/attachments`

Upload a file attachment to a TestCase.

**Auth**: Any  
**Content-Type**: `multipart/form-data`

**Form Fields**: `file` (the uploaded file)

**Response `201`**: `{ "id": 3, "filename": "screenshot.png", "filepath": "/uploads/3-screenshot.png" }`

---

#### `GET /api/testruncases/:id/attachments`

Get all attachments for a TestRunCase execution result.

**Auth**: Any

**Response `200`** — same shape as TestCase attachments.

---

#### `POST /api/testruncases/:id/attachments`

Upload a file to a TestRunCase execution result.

**Auth**: Any  
**Content-Type**: `multipart/form-data`

**Response `201`** — same shape as TestCase attachment response.

---

#### `DELETE /api/attachments/:id`

Delete an attachment and remove the file from disk.

**Auth**: Any

**Response `200`**: `{ "message": "Attachment deleted" }`

---

### Import / Export

#### `GET /api/testsuites/:id/export?format=csv`

Export a TestSuite with all TestCases and TestSteps.

**Auth**: Any

**Query Params**: `format` = `csv` or `json`

**Response `200`** — file download (`Content-Disposition: attachment`).

---

#### `POST /api/testsuites/import`

Import a TestSuite from a CSV or JSON file. Creates a new TestSuite.

**Auth**: Any  
**Content-Type**: `multipart/form-data`

**Form Fields**: `file`, `format` (`csv` or `json`)

**Response `201`**

```json
{
  "suite_id": 6,
  "suite_name": "Imported Suite",
  "cases_created": 14,
  "steps_created": 52,
  "errors": []
}
```

On validation errors, `errors` lists row-level issues; no data is committed if `errors` is non-empty.

---

### TestCase History

#### `GET /api/testcases/:id/history`

Get the change history for a TestCase.

**Auth**: Any

**Response `200`**

```json
[
  {
    "id": 22,
    "changed_by_name": "Jane Doe",
    "changed_date": "2026-03-26 14:30",
    "changed_fields": ["priority", "steps"],
    "snapshot": { "name": "...", "priority": "Medium", "steps": [...] }
  }
]
```

---

#### `GET /api/testcases/:id/history/:historyId/diff`

Return a diff between two history snapshots.

**Auth**: Any

**Query Params**: `compare_to` (history ID of the other snapshot)

**Response `200`**

```json
{
  "from_id": 21,
  "to_id": 22,
  "changes": {
    "priority": { "before": "Low", "after": "Medium" }
  }
}
```

---

### Dashboard

#### `GET /api/dashboard`

Get summary statistics for the Dashboard page.

**Auth**: Any

**Response `200`**

```json
{
  "total_suites": 5,
  "total_cases": 73,
  "total_runs": 12,
  "pass_rate_trend": [
    { "test_run_id": 11, "created_date": "2026-03-10 09:00", "pass_rate": 72.0 },
    { "test_run_id": 12, "created_date": "2026-03-20 14:00", "pass_rate": 76.0 }
  ],
  "top_failed_cases": [
    { "test_case_id": 8, "name": "Verify logout clears session", "fail_count": 5 }
  ],
  "recent_activity": [
    { "action": "TestCase created", "entity_name": "Check password validation", "actor": "Jane Doe", "timestamp": "2026-03-27 08:45" }
  ]
}
```

---

## Phase 3 — Webhooks, Issues, Notifications, Test Plans

### Webhooks

#### `GET /api/webhooks`

Get all webhook configurations.

**Auth**: Admin

**Response `200`**: `[{ "id": 1, "event": "testrun:completed", "url": "https://...", "active": true }]`

---

#### `POST /api/webhooks`

Create a webhook configuration.

**Auth**: Admin

**Request Body**: `{ "event": "testrun:completed", "url": "https://ci.example.com/hook", "secret": "abc123" }`

**Response `201`** — webhook object.

---

#### `PUT /api/webhooks/:id`

Update a webhook.

**Auth**: Admin

**Response `200`** — updated webhook object.

---

#### `DELETE /api/webhooks/:id`

Delete a webhook.

**Auth**: Admin

**Response `200`**: `{ "message": "Webhook deleted" }`

---

#### `POST /api/webhooks/trigger-run`

Inbound CI/CD trigger: create a new TestRun from a list of TestCase IDs.

**Auth**: Requires `X-TMS-Secret` header matching the configured inbound secret.

**Request Body**: `{ "test_case_ids": [1, 5, 8] }`

**Response `201`**: `{ "test_run_id": 15 }`

---

### Issue Linking

#### `GET /api/testruncases/:id/issues`

Get all linked issues for a TestRunCase.

**Auth**: Any

**Response `200`**: `[{ "id": 3, "issue_url": "https://jira.example.com/TMS-42", "issue_label": "TMS-42" }]`

---

#### `POST /api/testruncases/:id/issues`

Link an issue to a TestRunCase.

**Auth**: Any

**Request Body**: `{ "issue_url": "https://jira.example.com/TMS-42", "issue_label": "TMS-42" }`

**Response `201`** — issue link object.

---

#### `DELETE /api/issues/:id`

Remove an issue link.

**Auth**: Any

**Response `200`**: `{ "message": "Issue link removed" }`

---

### Notifications

#### `GET /api/notifications/config`

Get notification configurations.

**Auth**: Admin

**Response `200`**: `[{ "id": 1, "event": "testrun:completed", "channel": "email", "target": "qa@example.com", "active": true }]`

---

#### `POST /api/notifications/config`

Create a notification rule.

**Auth**: Admin

**Request Body**: `{ "event": "testcase:failed", "channel": "slack", "target": "https://hooks.slack.com/...", "active": true }`

**Response `201`** — config object.

---

#### `DELETE /api/notifications/config/:id`

Delete a notification rule.

**Auth**: Admin

**Response `200`**: `{ "message": "Notification config deleted" }`

---

### Test Plans

#### `GET /api/testplans`

Get all Test Plans.

**Auth**: Any

**Response `200`**: `[{ "id": 1, "name": "Sprint 42 Regression", "created_date": "...", "creator_name": "...", "run_count": 3, "aggregate_pass_rate": "81.3%" }]`

---

#### `POST /api/testplans`

Create a Test Plan.

**Auth**: Any

**Request Body**: `{ "name": "Sprint 42 Regression", "test_run_ids": [10, 11, 12] }`

**Response `201`** — Test Plan object.

---

#### `GET /api/testplans/:id`

Get a Test Plan with all linked TestRuns and aggregate stats.

**Auth**: Any

**Response `200`** — Test Plan with `runs` array.

---

#### `DELETE /api/testplans/:id`

Delete a Test Plan (does not delete the linked TestRuns).

**Auth**: Any

**Response `200`**: `{ "message": "Test Plan deleted" }`

---

## Phase 3 — WebSocket Events

The WebSocket server is attached to the same HTTP server as Express. Clients connect via `io()` from `socket.io-client`.

### Connection

```
ws://localhost:<PORT>  (or wss:// in production)
```

Clients must send the session cookie with the initial handshake. The server validates the session before upgrading.

### Rooms

Clients join a room when they open a page that needs live updates:

| Page | Room joined |
|------|-------------|
| TestRun detail | `testrun:<id>` |
| TestCase detail | `testcase:<id>` |

### Events (Server → Client)

| Event | Room | Payload |
|-------|------|---------|
| `testruncase:updated` | `testrun:<id>` | `{ testRunCaseId, result, executed, executorName }` |
| `testcase:updated` | `testcase:<id>` | `{ testCaseId, name, priority }` |
| `testrun:completed` | `testrun:<id>` | `{ testRunId, passRate }` |

### Events (Client → Server)

| Event | Payload | Purpose |
|-------|---------|---------|
| `join` | `{ room: "testrun:3" }` | Subscribe to updates for a page |
| `leave` | `{ room: "testrun:3" }` | Unsubscribe |

---

## Phase 4 — Admin

### User Management

#### `GET /api/admin/users`

Get all users.

**Auth**: Admin

**Response `200`**: `[{ "id": 1, "login": "admin", "user_name": "Administrator", "role": "admin", "active": true }]`

---

#### `POST /api/admin/users`

Create a user.

**Auth**: Admin

**Request Body**: `{ "login": "tester1", "password": "temp123", "user_name": "Tester One", "role": "QA" }`

**Response `201`** — user object (no password field).

---

#### `PUT /api/admin/users/:id`

Update user_name, role, or active status.

**Auth**: Admin

**Request Body**: `{ "user_name": "Tester One", "role": "admin", "active": false }`

**Response `200`** — updated user object.

---

#### `POST /api/admin/users/:id/reset-password`

Reset a user's password to a temporary value.

**Auth**: Admin

**Request Body**: `{ "new_password": "temp456" }`

**Response `200`**: `{ "message": "Password reset" }`

---

### Audit Log

#### `GET /api/admin/audit`

Get audit log entries with optional filters.

**Auth**: Admin

**Query Params**: `entity_type`, `actor_id`, `from` (date), `to` (date), `page`, `limit`

**Response `200`**

```json
{
  "total": 340,
  "page": 1,
  "limit": 50,
  "entries": [
    {
      "id": 101,
      "entity_type": "TestCase",
      "entity_id": 5,
      "action": "update",
      "changed_fields": ["priority"],
      "actor_name": "Jane Doe",
      "timestamp": "2026-03-26 14:30"
    }
  ]
}
```

---

### System Configuration

#### `GET /api/admin/config`

Get all system configuration values.

**Auth**: Admin

**Response `200`**: `[{ "key": "default_priority", "value": "Medium" }, ...]`

---

#### `PUT /api/admin/config`

Upsert one or more configuration values.

**Auth**: Admin

**Request Body**: `{ "default_priority": "High", "session_timeout_minutes": "60" }`

**Response `200`** — array of updated config entries.

---

### Data Retention

#### `GET /api/admin/archive`

Get all archived TestRuns.

**Auth**: Admin

**Response `200`** — array of TestRun objects with `archived: true`.

---

#### `POST /api/admin/testruns/:id/archive`

Archive a TestRun.

**Auth**: Admin

**Response `200`**: `{ "message": "TestRun archived" }`

---

#### `POST /api/admin/testruns/:id/restore`

Restore an archived TestRun.

**Auth**: Admin

**Response `200`**: `{ "message": "TestRun restored" }`

---

## Error Response Format

All error responses share a consistent JSON shape:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "name", "message": "Name is required" }
  ]
}
```

- `error` — human-readable summary (always present)
- `details` — array of field-level errors (present on `400` validation errors; omitted on `401`, `403`, `404`, `500`)
