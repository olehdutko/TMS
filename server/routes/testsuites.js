const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/testsuites
router.get('/', requireAuth, (req, res) => {
  const suites = db.prepare('SELECT id, name FROM test_suites ORDER BY id ASC').all();
  res.json(suites);
});

// POST /api/testsuites
router.post('/', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const existing = db.prepare('SELECT id FROM test_suites WHERE name = ?').get(name.trim());
  if (existing) {
    return res.status(409).json({ error: 'TestSuite name already exists' });
  }
  const result = db.prepare('INSERT INTO test_suites (name) VALUES (?)').run(name.trim());
  const suite = db.prepare('SELECT id, name FROM test_suites WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(suite);
});

// GET /api/testsuites/:id
router.get('/:id', requireAuth, (req, res) => {
  const suite = db.prepare('SELECT id, name FROM test_suites WHERE id = ?').get(req.params.id);
  if (!suite) return res.status(404).json({ error: 'TestSuite not found' });
  res.json(suite);
});

// PUT /api/testsuites/:id
router.put('/:id', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const suite = db.prepare('SELECT id FROM test_suites WHERE id = ?').get(req.params.id);
  if (!suite) return res.status(404).json({ error: 'TestSuite not found' });
  const existing = db
    .prepare('SELECT id FROM test_suites WHERE name = ? AND id != ?')
    .get(name.trim(), req.params.id);
  if (existing) return res.status(409).json({ error: 'TestSuite name already exists' });
  db.prepare('UPDATE test_suites SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  res.json({ id: parseInt(req.params.id), name: name.trim() });
});

// DELETE /api/testsuites/:id
router.delete('/:id', requireAuth, (req, res) => {
  const suite = db.prepare('SELECT id FROM test_suites WHERE id = ?').get(req.params.id);
  if (!suite) return res.status(404).json({ error: 'TestSuite not found' });
  db.prepare('DELETE FROM test_suites WHERE id = ?').run(req.params.id);
  res.json({ message: 'TestSuite deleted' });
});

// GET /api/testsuites/:suiteId/testcases
router.get('/:suiteId/testcases', requireAuth, (req, res) => {
  const suite = db.prepare('SELECT id FROM test_suites WHERE id = ?').get(req.params.suiteId);
  if (!suite) return res.status(404).json({ error: 'TestSuite not found' });
  const testcases = db
    .prepare(`
      SELECT tc.id, tc.name, tc.priority, tc.created_date, u.user_name as author
      FROM test_cases tc
      LEFT JOIN users u ON tc.author_id = u.id
      WHERE tc.test_suite_id = ?
      ORDER BY tc.id ASC
    `)
    .all(req.params.suiteId);
  res.json(testcases);
});

// POST /api/testsuites/:suiteId/testcases
router.post('/:suiteId/testcases', requireAuth, (req, res) => {
  const { name, priority, steps } = req.body;
  const suiteId = req.params.suiteId;
  const suite = db.prepare('SELECT id FROM test_suites WHERE id = ?').get(suiteId);
  if (!suite) return res.status(404).json({ error: 'TestSuite not found' });
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (!priority || !['High', 'Medium', 'Low'].includes(priority)) {
    return res.status(400).json({ error: 'priority must be High, Medium, or Low' });
  }
  if (!steps || !Array.isArray(steps) || steps.filter(s => s.action && s.expected_result).length === 0) {
    return res.status(400).json({ error: 'At least one step with action and expected_result is required' });
  }
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const authorId = req.session.userId;
  const insertCase = db.prepare(
    'INSERT INTO test_cases (name, test_suite_id, priority, created_date, author_id) VALUES (?, ?, ?, ?, ?)'
  );
  const insertStep = db.prepare(
    'INSERT INTO test_steps (test_case_id, step_number, action, expected_result) VALUES (?, ?, ?, ?)'
  );
  const createTestCase = db.transaction(() => {
    const caseResult = insertCase.run(name.trim(), suiteId, priority, now, authorId);
    const caseId = caseResult.lastInsertRowid;
    let stepNum = 1;
    for (const step of steps) {
      if (step.action && step.expected_result) {
        insertStep.run(caseId, stepNum++, step.action, step.expected_result);
      }
    }
    return caseId;
  });
  const caseId = createTestCase();
  const created = db
    .prepare(`
      SELECT tc.id, tc.name, tc.priority, tc.created_date, u.user_name as author
      FROM test_cases tc
      LEFT JOIN users u ON tc.author_id = u.id
      WHERE tc.id = ?
    `)
    .get(caseId);
  res.status(201).json(created);
});

module.exports = router;
