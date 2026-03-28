# Project: Test Management System (TMS)

## Project Overview
Create a lightweight web-based Test Management System (TMS) for demonstration purposes. The application should support 1-10 concurrent users with two roles: Admin and QA. The UI should be clean and JIRA-like with English as the application language.

## Technology Stack
- **Frontend**: React
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Authentication**: Any simple authentication mechanism
- **Styling**: Modern, clean UI with light/dark theme support

## Project Structure
Set up a full-stack application with:
- `/client` - React frontend
- `/server` - Node.js/Express backend
- `/database` - SQLite database file and schema

## Core Entities & Database Schema

### User
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `login` (TEXT, UNIQUE, NOT NULL)
- `password` (TEXT, NOT NULL) - can be plain text for demo purposes
- `user_name` (TEXT, NOT NULL)
- `role` (TEXT, NOT NULL) - values: 'admin' or 'QA'

### TestSuite
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `name` (TEXT, UNIQUE, NOT NULL)

### TestCase
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `name` (TEXT, NOT NULL)
- `test_suite_id` (INTEGER, FOREIGN KEY -> TestSuite.id, CASCADE DELETE)
- `priority` (TEXT, NOT NULL) - values: 'High', 'Medium', 'Low'
- `created_date` (TEXT, NOT NULL) - format: 'YYYY-MM-DD HH:mm'
- `author_id` (INTEGER, FOREIGN KEY -> User.id)

### TestStep
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `test_case_id` (INTEGER, FOREIGN KEY -> TestCase.id, CASCADE DELETE)
- `step_number` (INTEGER, NOT NULL) - starts from 1, unique within test case
- `action` (TEXT, NOT NULL)
- `expected_result` (TEXT, NOT NULL)

### TestRun
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `created_date` (TEXT, NOT NULL) - format: 'YYYY-MM-DD HH:mm'
- `creator_id` (INTEGER, FOREIGN KEY -> User.id)

### TestRunCase
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `test_run_id` (INTEGER, FOREIGN KEY -> TestRun.id, CASCADE DELETE)
- `test_case_id` (INTEGER, FOREIGN KEY -> TestCase.id)
- `executed` (BOOLEAN, DEFAULT FALSE)
- `result` (TEXT, DEFAULT 'skipped') - values: 'pass', 'fail', 'skipped'
- `executed_date` (TEXT, NULLABLE) - format: 'YYYY-MM-DD HH:mm'
- `executor_id` (INTEGER, FOREIGN KEY -> User.id, NULLABLE)

## Initial Data Setup
1. **Pre-installed Admin User**:
   - login: "admin"
   - password: "admin"
   - user_name: "Administrator"
   - role: "admin"

2. **Test Data Generation**: After application is complete, generate and insert:
   - 5 TestSuites with unique names
   - 10-20 TestCases per TestSuite (varying priorities)
   - 3-8 TestSteps per TestCase with realistic testing scenarios

## Authentication & User Management

### Registration Page
- Fields: login, password, user_name
- Default role: "QA"
- Validate: login must be unique
- Redirect to login page after successful registration

### Login Page
- Fields: login, password
- Support both admin and registered users
- Store user session/token
- Redirect to TestSuites page after successful login

### Header (for authenticated users)
- Theme toggle button (light/dark mode)
- Display: user_name
- Display: role
- Logout button
- Always visible across all pages

## Navigation Structure

### Main Navigation Menu
- Always visible horizontal menu with three sections:
  - TestSuites
  - TestRuns
  - Reports

### Breadcrumb Navigation
- Display current location path
- Example: "TestSuites > Suite Name > TestCase Name"
- Clickable breadcrumb items for navigation
- Update dynamically based on current page

## User Permissions

### QA Role
- Full CRUD operations on ALL TestSuites
- Full CRUD operations on ALL TestCases
- Full CRUD operations on ALL TestRuns
- Can execute tests in ANY TestRun

### Admin Role
- All functionality should be marked as "TBD" (use stubs/placeholders)
- Show "Admin functionality coming soon" messages

## Section 1: TestSuites

### TestSuites Grid Page (default landing page)
**URL**: `/testsuites`

**Display**:
- Grid/table with columns:
  - ID (auto-increment)
  - TestSuite Name
  - Remove button (per row)

**Actions**:
- "Add TestSuite" button -> opens creation modal/page
- Click on TestSuite row -> navigate to TestCases grid for that suite
- Remove button -> show confirmation dialog -> delete on confirm (CASCADE delete all related TestCases and TestSteps)

**Validation**:
- TestSuite Name must be unique
- TestSuite Name is required

### TestCases Grid Page
**URL**: `/testsuites/:suiteId/testcases`

**Breadcrumb**: TestSuites > [TestSuite Name]

**Display**:
- Grid/table with columns:
  - ID
  - Name
  - Priority
  - Date (created_date)
  - Author (user_name from author_id)
  - Remove button (per row)

**Actions**:
- "Add TestCase" button -> navigate to TestCase creation page
- Click on TestCase row -> navigate to TestCase detail/edit page
- Remove button -> show confirmation dialog -> delete on confirm (CASCADE delete all TestSteps)

### TestCase Detail/Edit Page
**URL**: `/testsuites/:suiteId/testcases/:testcaseId`

**Page Title**: [TestCase Name]

**Breadcrumb**: TestSuites > [TestSuite Name] > [TestCase Name]

**Fields**:
- Name (TEXT input, required, must be unique)
- ID (readonly, display only)
- Priority (dropdown: High/Medium/Low, required)
- Date (readonly, auto-filled with creation date, format: YYYY-MM-DD HH:mm)
- Author (readonly, auto-filled with current logged-in user's user_name)

**TestSteps Section** (below main fields):
- Display all TestSteps belonging to this TestCase
- Each TestStep shows:
  - Step ID (auto-numbered starting from 1)
  - Action (editable on double-click, auto-save on blur)
  - Expected Result (editable on double-click, auto-save on blur)
  - Remove button (per step)

**TestStep Dynamic Creation**:
- When user fills in Action OR Expected Result of the last TestStep, automatically create a new empty TestStep row below
- Step IDs auto-increment starting from 1

**TestStep Deletion**:
- Remove button deletes the TestStep
- Automatically renumber all subsequent TestSteps (update step_number)

**Buttons**:
- "Save" -> save all TestCase data and TestSteps -> show success notification (3 seconds) -> stay on page
- "Return" -> navigate back to TestCases grid
  - If unsaved changes exist -> show confirmation dialog: "You have unsaved changes. Do you want to save before leaving?" (Save/Don't Save/Cancel)
- "Remove" -> show confirmation dialog -> delete TestCase -> navigate back to TestCases grid

**Validation**:
- TestCase Name is required and must be unique
- At least one TestStep with Action and Expected Result is required

### TestCase Creation Page
**URL**: `/testsuites/:suiteId/testcases/new`

**Page Title**: Add new testcase

**Breadcrumb**: TestSuites > [TestSuite Name] > New TestCase

**Same structure as TestCase Detail/Edit Page** but:
- ID auto-generated on save
- Date auto-filled with current timestamp
- Author auto-filled with current logged-in user
- All fields are empty initially
- Dynamic TestStep creation works the same way

## Section 2: TestRuns

### TestRuns Grid Page
**URL**: `/testruns`

**Breadcrumb**: TestRuns

**Display**:
- Grid/table with columns:
  - ID (auto-increment)
  - Date (created_date, format: YYYY-MM-DD HH:mm)
  - Pass Rate (calculated: % of test cases with result='pass' out of total test cases in this TestRun)
  - Remove button (per row)

**Actions**:
- "New TestRun" button -> navigate to TestRun creation page
- Click on TestRun row -> navigate to TestRun detail page
- Remove button -> show confirmation dialog -> delete on confirm

**Pass Rate Calculation**:
- Formula: (count of TestRunCases with result='pass' / total count of TestRunCases) * 100
- Display as percentage with 1 decimal place (e.g., "75.5%")
- If no test cases: display "0%"

### TestRun Creation Page
**URL**: `/testruns/new`

**Page Title**: New TestRun

**Breadcrumb**: TestRuns > New TestRun

**Display**:
- Tree structure showing all TestSuites with expand/collapse functionality
- Each TestSuite node shows:
  - Checkbox for TestSuite
  - TestSuite Name
  - Expandable list of TestCases
- Each TestCase node shows:
  - Checkbox for TestCase
  - TestCase Name

**Behavior**:
- Checking a TestSuite checkbox automatically checks all its TestCases
- Unchecking a TestSuite checkbox automatically unchecks all its TestCases
- Individual TestCases can be checked/unchecked independently
- If all TestCases in a TestSuite are manually checked, the TestSuite checkbox should auto-check

**Actions**:
- "Save" button -> create TestRun with:
  - created_date: current timestamp (YYYY-MM-DD HH:mm)
  - creator_id: current logged-in user's ID
  - Create TestRunCase entries for all selected TestCases with:
    - executed: FALSE
    - result: 'skipped'
    - executed_date: NULL
    - executor_id: NULL
  - Navigate to TestRuns grid
  - Show success notification (1 second)

### TestRun Detail Page
**URL**: `/testruns/:testrunId`

**Page Title**: TestRun #[ID] - [Date]

**Breadcrumb**: TestRuns > TestRun #[ID]

**Display**:
- Grid/table grouped by TestSuite Name with columns:
  - Executed (boolean, shows TRUE/FALSE or checkbox icon)
  - TestSuite Name (grouped rows with same TestSuite name)
  - TestCase Name
  - Result (pass/fail/skipped with color coding)

**Result Color Coding**:
- pass -> green text
- fail -> red text
- skipped -> yellow/orange text

**Actions**:
- Click on TestCase row -> navigate to TestRun TestCase execution page

**Grouping**:
- Group all TestRunCases by their TestCase's TestSuite
- Display TestSuite name as a group header or merged cells

### TestRun TestCase Execution Page
**URL**: `/testruns/:testrunId/testcases/:testrunCaseId`

**Page Title**: [TestCase Name]

**Breadcrumb**: TestRuns > TestRun #[ID] > [TestCase Name]

**Display**:
- Show all TestCase details (readonly):
  - TestCase Name
  - Priority
  - Created Date
  - Author
- Show all TestSteps (readonly):
  - Step Number
  - Action
  - Expected Result

**Execution Fields**:
- Executed (boolean checkbox, default: FALSE)
- Date (auto-filled with current timestamp when page loads, readonly, format: YYYY-MM-DD HH:mm)
- Executor (auto-filled with current logged-in user's user_name, readonly)
- Result (dropdown: pass/fail/skipped, default: 'skipped')

**Buttons**:
- "Save" -> 
  - Update TestRunCase:
    - executed: TRUE
    - result: selected value
    - executed_date: current timestamp
    - executor_id: current logged-in user's ID
  - Navigate back to TestRun detail grid
  - Show success notification (1 second)

## Section 3: Reports

### Reports Grid Page
**URL**: `/reports`

**Breadcrumb**: Reports

**Display**:
- Grid/table with one row per TestRun, columns:
  - TestRun ID
  - Date (created_date)
  - Total Tests (count of all TestRunCases)
  - Executed (count of TestRunCases where executed=TRUE)
  - Passed (count of TestRunCases where result='pass')
  - Failed (count of TestRunCases where result='fail')
  - Skipped (count of TestRunCases where result='skipped')

**Actions**:
- Click on TestRun row -> navigate to detailed TestRun report page

### TestRun Detailed Report Page
**URL**: `/reports/:testrunId`

**Page Title**: Report - TestRun #[ID]

**Breadcrumb**: Reports > TestRun #[ID]

**Display Sections**:

1. **Summary Information**:
   - Date (created_date of TestRun)
   - Executor (user_name of creator)

2. **Donut Chart**:
   - Visual representation with segments for:
     - Total Tests
     - Executed
     - Passed (green)
     - Failed (red)
     - Skipped (yellow/orange)
   - Use any React chart library (e.g., recharts, chart.js)

3. **TestCases List** (grouped by status):
   - Three collapsible sections:
     - Passed (green header) - show count
     - Failed (red header) - show count
     - Skipped (yellow header) - show count
   - Each section can expand/collapse
   - Within each section, list TestCase names
   - Default state: all sections collapsed

## UI/UX Requirements

### Theme Support
- Implement light and dark theme
- Theme toggle button in header
- Persist theme preference in localStorage
- Smooth transition between themes

### Notifications/Toasts
- Success notifications: green, auto-dismiss after specified time
- Error notifications: red, auto-dismiss after 5 seconds
- Position: top-right corner

### Confirmation Dialogs
- Modal dialogs for destructive actions
- Clear "Confirm" and "Cancel" buttons
- Explain what will be deleted
- Example: "Are you sure you want to delete TestSuite '[Name]'? All associated TestCases and TestSteps will also be deleted."

### Responsive Design
- Should work on desktop screens (1024px and above)
- Mobile responsive is optional for this demo

### Loading States
- Show loading spinners/skeletons when fetching data
- Disable buttons during API calls to prevent double-submission

### Form Validation
- Show validation errors inline
- Required fields marked with asterisk (*)
- Prevent form submission if validation fails

### Grid/Table Features
- Sortable columns (optional but nice to have)
- Clean, JIRA-like styling
- Hover effects on rows
- Clear visual separation between rows

## API Endpoints Structure

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### TestSuites
- `GET /api/testsuites` - Get all TestSuites
- `POST /api/testsuites` - Create TestSuite
- `GET /api/testsuites/:id` - Get TestSuite by ID
- `PUT /api/testsuites/:id` - Update TestSuite
- `DELETE /api/testsuites/:id` - Delete TestSuite (cascade)

### TestCases

TestCases (continued)
- `POST /api/testsuites/:suiteId/testcases` - Create TestCase
GET /api/testcases/:id - Get TestCase by ID (with TestSteps)
PUT /api/testcases/:id - Update TestCase (with TestSteps)
DELETE /api/testcases/:id - Delete TestCase (cascade)

TestSteps
GET /api/testcases/:testcaseId/teststeps - Get all TestSteps for a TestCase
POST /api/testcases/:testcaseId/teststeps - Create TestStep
PUT /api/teststeps/:id - Update TestStep
DELETE /api/teststeps/:id - Delete TestStep

TestRuns
GET /api/testruns - Get all TestRuns (with pass rate calculation)
POST /api/testruns - Create TestRun (with selected TestCases)
GET /api/testruns/:id - Get TestRun by ID (with all TestRunCases grouped by TestSuite)
DELETE /api/testruns/:id - Delete TestRun (cascade)

TestRunCases
GET /api/testruns/:testrunId/testcases - Get all TestRunCases for a TestRun
GET /api/testruncases/:id - Get TestRunCase by ID (with full TestCase details and TestSteps)
PUT /api/testruncases/:id - Update TestRunCase execution result

Reports
GET /api/reports - Get all TestRuns with statistics
GET /api/reports/:testrunId - Get detailed report for specific TestRun

Implementation Guidelines

Backend
Set up Express server with proper middleware (cors, body-parser, express-session)
Create SQLite database connection and initialize schema
Implement all API endpoints with proper error handling
Add authentication middleware to protect routes
Implement cascade deletes using foreign key constraints
Use prepared statements to prevent SQL injection
Return proper HTTP status codes (200, 201, 400, 401, 404, 500)

Frontend
Use Create React App or Vite for project setup
Implement React Router for navigation
Create reusable components:
   Header
   Breadcrumb
   Grid/Table
   ConfirmDialog
   Toast/Notification
   ThemeToggle
   TreeView (for TestRun creation)
Use React Context or state management for:
   Authentication state
   Theme state
   Current user data
Implement protected routes (redirect to login if not authenticated)
Use axios or fetch for API calls
Implement proper error handling and display error messages

Database Initialization
Create database schema on server startup
Insert admin user if not exists
Create indexes on foreign keys for performance
Enable foreign key constraints in SQLite

Testing Data Generation
After the application is complete, create a separate script or endpoint to:
Generate 5 TestSuites with realistic names (e.g., "User Authentication", "Payment Processing", "Dashboard Features", "API Integration", "Mobile Responsive")
For each TestSuite, create 10-20 TestCases with:
   Varied priorities (mix of High, Medium, Low)
   Realistic names (e.g., "Verify login with valid credentials", "Check password validation")
   Random author (can be admin user)
   Created dates spread over the last 30 days
For each TestCase, create 3-8 TestSteps with:
   Sequential step numbers
   Realistic actions (e.g., "Navigate to login page", "Enter username")
   Corresponding expected results (e.g., "Login page is displayed", "Username field accepts input")

Code Quality Requirements
Use meaningful variable and function names
Add comments for complex logic
Follow consistent code formatting
Implement proper error handling (try-catch blocks)
Validate all user inputs on both frontend and backend
Use environment variables for configuration (port, database path)
Add console logs for debugging during development

File Structure Example
project-root/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Breadcrumb.jsx
│   │   │   ├── Grid.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── TreeView.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── TestSuites/
│   │   │   ├── TestRuns/
│   │   │   └── Reports/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
├── server/
│   ├── database/
│   │   ├── schema.sql
│   │   └── db.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── testsuites.js
│   │   ├── testcases.js
│   │   ├── testruns.js
│   │   └── reports.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── generateTestData.js
│   ├── server.js
│   └── package.json
└── README.md
Deliverables
Fully functional web application with all specified features
Clean, maintainable code
SQLite database with proper schema and constraints
Pre-populated database with admin user
Test data generation completed (5 TestSuites with 10-20 TestCases each)
README with setup and running instructions

Priority Order for Implementation
Database schema and backend setup
Authentication (register, login, session management)
TestSuites section (CRUD operations)
TestCases and TestSteps (CRUD operations with dynamic step creation)
TestRuns section (creation with tree selection, execution)
Reports section (grid and detailed report with chart)
UI polish (theme toggle, breadcrumbs, notifications)
Test data generation

Notes
Focus on functionality over perfect design
Use simple, clean UI components (can use a UI library like Material-UI, Ant Design, or build custom)
Ensure all cascade deletions work properly
Make sure auto-increment IDs work correctly
Test all confirmation dialogs
Verify all calculations (pass rate, report statistics)
