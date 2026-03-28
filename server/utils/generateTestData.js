/**
 * Seed script: generates 5 TestSuites with 10-20 TestCases each,
 * each TestCase having 3-8 TestSteps.
 */
const db = require('../database/db');

const suites = [
  'User Authentication',
  'Payment Processing',
  'Dashboard Features',
  'API Integration',
  'Mobile Responsive',
];

const testCaseTemplates = {
  'User Authentication': [
    { name: 'Verify login with valid credentials', priority: 'High' },
    { name: 'Verify login with invalid password', priority: 'High' },
    { name: 'Verify login with empty fields', priority: 'Medium' },
    { name: 'Check password validation rules', priority: 'Medium' },
    { name: 'Verify logout functionality', priority: 'High' },
    { name: 'Test session expiry after timeout', priority: 'Medium' },
    { name: 'Verify remember me functionality', priority: 'Low' },
    { name: 'Check account lockout after failed attempts', priority: 'High' },
    { name: 'Verify password reset flow', priority: 'High' },
    { name: 'Test SSO login integration', priority: 'Medium' },
    { name: 'Verify user registration with valid data', priority: 'High' },
    { name: 'Check duplicate username prevention', priority: 'Medium' },
    { name: 'Verify email validation on registration', priority: 'Medium' },
    { name: 'Test concurrent login sessions', priority: 'Low' },
    { name: 'Verify CSRF protection on login form', priority: 'High' },
  ],
  'Payment Processing': [
    { name: 'Verify successful credit card payment', priority: 'High' },
    { name: 'Test payment with expired card', priority: 'High' },
    { name: 'Verify payment with insufficient funds', priority: 'High' },
    { name: 'Test PayPal payment integration', priority: 'Medium' },
    { name: 'Verify refund process', priority: 'High' },
    { name: 'Check payment receipt generation', priority: 'Medium' },
    { name: 'Test currency conversion accuracy', priority: 'Medium' },
    { name: 'Verify 3D Secure authentication', priority: 'High' },
    { name: 'Test coupon code application', priority: 'Medium' },
    { name: 'Verify tax calculation', priority: 'Medium' },
    { name: 'Check order total calculation', priority: 'High' },
    { name: 'Test payment timeout handling', priority: 'High' },
    { name: 'Verify PCI compliance controls', priority: 'High' },
    { name: 'Test bank transfer payment method', priority: 'Low' },
    { name: 'Verify partial refund processing', priority: 'Medium' },
    { name: 'Check payment history display', priority: 'Low' },
  ],
  'Dashboard Features': [
    { name: 'Verify dashboard loads within 3 seconds', priority: 'High' },
    { name: 'Check all widgets display correctly', priority: 'High' },
    { name: 'Test date range filter on charts', priority: 'Medium' },
    { name: 'Verify data refresh functionality', priority: 'Medium' },
    { name: 'Check export to PDF feature', priority: 'Low' },
    { name: 'Test dashboard with no data', priority: 'Medium' },
    { name: 'Verify chart interactivity', priority: 'Low' },
    { name: 'Check responsive layout at 1024px', priority: 'Medium' },
    { name: 'Test custom widget creation', priority: 'Low' },
    { name: 'Verify real-time data updates', priority: 'High' },
    { name: 'Check user preference persistence', priority: 'Medium' },
    { name: 'Test drag and drop widget repositioning', priority: 'Low' },
    { name: 'Verify legend and tooltips on charts', priority: 'Medium' },
  ],
  'API Integration': [
    { name: 'Verify API authentication with valid token', priority: 'High' },
    { name: 'Test API rate limiting', priority: 'High' },
    { name: 'Check API versioning handling', priority: 'Medium' },
    { name: 'Verify webhook delivery on events', priority: 'High' },
    { name: 'Test API response format consistency', priority: 'Medium' },
    { name: 'Check error response structure', priority: 'High' },
    { name: 'Verify pagination on list endpoints', priority: 'Medium' },
    { name: 'Test API with malformed JSON body', priority: 'High' },
    { name: 'Check CORS headers in responses', priority: 'Medium' },
    { name: 'Verify API key rotation process', priority: 'Medium' },
    { name: 'Test bulk data import via API', priority: 'Medium' },
    { name: 'Verify idempotency of PUT requests', priority: 'Medium' },
    { name: 'Check API documentation accuracy', priority: 'Low' },
    { name: 'Test third-party OAuth integration', priority: 'High' },
  ],
  'Mobile Responsive': [
    { name: 'Verify layout on iPhone 14 (375px)', priority: 'High' },
    { name: 'Check layout on iPad (768px)', priority: 'High' },
    { name: 'Test touch gestures and swipe actions', priority: 'Medium' },
    { name: 'Verify font sizes are readable on mobile', priority: 'Medium' },
    { name: 'Check form inputs on mobile keyboard', priority: 'High' },
    { name: 'Test navigation menu on small screen', priority: 'High' },
    { name: 'Verify images scale correctly', priority: 'Medium' },
    { name: 'Check button tap targets are 44px+', priority: 'High' },
    { name: 'Test scroll behavior on mobile', priority: 'Medium' },
    { name: 'Verify modal dialogs on mobile', priority: 'Medium' },
    { name: 'Check table horizontal scrolling', priority: 'Medium' },
    { name: 'Test landscape orientation layout', priority: 'Low' },
    { name: 'Verify offline mode behavior', priority: 'Low' },
    { name: 'Check performance on low-end device', priority: 'Medium' },
    { name: 'Test deep-linking on mobile', priority: 'Low' },
  ],
};

const stepTemplates = [
  [
    { action: 'Open the application in browser', expected_result: 'Application homepage is loaded' },
    { action: 'Navigate to the login page', expected_result: 'Login form is displayed with username and password fields' },
    { action: 'Enter valid username in the login field', expected_result: 'Username is accepted without errors' },
    { action: 'Enter valid password in the password field', expected_result: 'Password is masked and accepted' },
    { action: 'Click the Login button', expected_result: 'User is authenticated and redirected to dashboard' },
  ],
  [
    { action: 'Navigate to the target page', expected_result: 'Page loads successfully' },
    { action: 'Verify page title matches expected value', expected_result: 'Correct page title is displayed' },
    { action: 'Check all required elements are visible', expected_result: 'All UI elements render correctly' },
    { action: 'Interact with the main feature', expected_result: 'Feature responds as expected' },
    { action: 'Verify success message appears', expected_result: 'Confirmation message is shown to the user' },
    { action: 'Validate data is persisted correctly', expected_result: 'Data appears correctly after page refresh' },
  ],
  [
    { action: 'Set up prerequisite test data', expected_result: 'Test data is created successfully' },
    { action: 'Navigate to the feature under test', expected_result: 'Feature page loads without errors' },
    { action: 'Perform the primary test action', expected_result: 'System processes the action correctly' },
    { action: 'Verify the expected outcome', expected_result: 'Result matches the acceptance criteria' },
    { action: 'Check for error messages or warnings', expected_result: 'No unexpected errors are displayed' },
    { action: 'Clean up test data', expected_result: 'Test environment is restored to original state' },
    { action: 'Confirm feature is stable after test', expected_result: 'Feature continues to work normally' },
  ],
  [
    { action: 'Open developer tools and go to the Network tab', expected_result: 'Network tab is open and monitoring requests' },
    { action: 'Trigger the relevant action in the application', expected_result: 'API request is sent to the server' },
    { action: 'Verify the HTTP status code is 200 or 201', expected_result: 'Response indicates success' },
    { action: 'Inspect the response body', expected_result: 'Response contains expected data fields' },
    { action: 'Verify the UI updates with the response data', expected_result: 'UI reflects the latest data from API' },
  ],
];

function getRandomSteps(min = 3, max = 8) {
  const template = stepTemplates[Math.floor(Math.random() * stepTemplates.length)];
  const count = Math.min(template.length, min + Math.floor(Math.random() * (max - min + 1)));
  return template.slice(0, count);
}

function randomDateInPast30Days() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const random = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
  const d = new Date(random);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function seed() {
  console.log('Starting seed...');
  const adminUser = db.prepare("SELECT id FROM users WHERE login = 'admin'").get();
  if (!adminUser) {
    console.error('Admin user not found. Run the server first to initialize the DB.');
    process.exit(1);
  }

  const insertSuite = db.prepare('INSERT OR IGNORE INTO test_suites (name) VALUES (?)');
  const insertCase = db.prepare(
    'INSERT INTO test_cases (name, test_suite_id, priority, created_date, author_id) VALUES (?, ?, ?, ?, ?)'
  );
  const insertStep = db.prepare(
    'INSERT INTO test_steps (test_case_id, step_number, action, expected_result) VALUES (?, ?, ?, ?)'
  );

  const seedAll = db.transaction(() => {
    for (const suiteName of suites) {
      insertSuite.run(suiteName);
      const suite = db.prepare('SELECT id FROM test_suites WHERE name = ?').get(suiteName);
      const cases = testCaseTemplates[suiteName] || [];

      for (const tc of cases) {
        const result = insertCase.run(
          tc.name,
          suite.id,
          tc.priority,
          randomDateInPast30Days(),
          adminUser.id
        );
        const caseId = result.lastInsertRowid;
        const steps = getRandomSteps(3, 7);
        steps.forEach((step, idx) => {
          insertStep.run(caseId, idx + 1, step.action, step.expected_result);
        });
      }
      console.log(`Seeded suite: ${suiteName} with ${cases.length} test cases`);
    }
  });

  seedAll();
  console.log('Seed complete!');
}

seed();
