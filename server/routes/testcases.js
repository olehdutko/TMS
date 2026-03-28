const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/testcases/:id
router.get('/:id', requireAuth, (req, res) => {
  const tc = db
    .prepare(`
      SELECT tc.id, tc.name, tc.priority, tc.created_date, tc.test_suite_id,
             u.user_name as author, ts.name as suite_name
      FROM test_cases tc
      LEFT JOIN users u ON tc.author_id = u.id
      LEFT JOIN test_suites ts ON tc.test_suite_id = ts.id
      WHERE tc.id = ?
    `)
    .get(req.params.id);
  if (!tc) return res.status(404).json({ error: 'TestCase not found' });
  const steps = db
    .prepare('SELECT id, step_number, action, expected_result FROM test_steps WHERE test_case_id = ? ORDER BY step_number ASC')
    .all(req.params.id);
  res.json({ ...tc, steps });
});

// PUT /api/testcases/:id
router.put('/:id', requireAuth, (req, res) => {
  const { name, priority, steps } = req.body;
  const tc = db.prepare('SELECT id FROM test_cases WHERE id = ?').get(req.params.id);
  if (!tc) return res.status(404).json({ error: 'TestCase not found' });
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (!priority || !['High', 'Medium', 'Low'].includes(priority)) {
    return res.status(400).json({ error: 'priority must be High, Medium, or Low' });
  }
  if (!steps || !Array.isArray(steps) || steps.filter(s => s.action && s.expected_result).length === 0) {
    return res.status(400).json({ error: 'At least one step with action and expected_result is required' });
  }

  const updateCase = db.prepare('UPDATE test_cases SET name = ?, priority = ? WHERE id = ?');
  const deleteSteps = db.prepare('DELETE FROM test_steps WHERE test_case_id = ?');
  const insertStep = db.prepare(
    'INSERT INTO test_steps (test_case_id, step_number, action, expected_result) VALUES (?, ?, ?, ?)'
  );

  const saveTestCase = db.transaction(() => {
    updateCase.run(name.trim(), priority, req.params.id);
    deleteSteps.run(req.params.id);
    let stepNum = 1;
    for (const step of steps) {
      if (step.action && step.expected_result) {
        insertStep.run(req.params.id, stepNum++, step.action, step.expected_result);
      }
    }
  });
  saveTestCase();

  const updated = db
    .prepare(`
      SELECT tc.id, tc.name, tc.priority, tc.created_date, tc.test_suite_id,
             u.user_name as author, ts.name as suite_name
      FROM test_cases tc
      LEFT JOIN users u ON tc.author_id = u.id
      LEFT JOIN test_suites ts ON tc.test_suite_id = ts.id
      WHERE tc.id = ?
    `)
    .get(req.params.id);
  const updatedSteps = db
    .prepare('SELECT id, step_number, action, expected_result FROM test_steps WHERE test_case_id = ? ORDER BY step_number ASC')
    .all(req.params.id);
  res.json({ ...updated, steps: updatedSteps });
});

// DELETE /api/testcases/:id
router.delete('/:id', requireAuth, (req, res) => {
  const tc = db.prepare('SELECT id FROM test_cases WHERE id = ?').get(req.params.id);
  if (!tc) return res.status(404).json({ error: 'TestCase not found' });
  db.prepare('DELETE FROM test_cases WHERE id = ?').run(req.params.id);
  res.json({ message: 'TestCase deleted' });
});

// GET /api/testcases/:testcaseId/teststeps
router.get('/:testcaseId/teststeps', requireAuth, (req, res) => {
  const steps = db
    .prepare('SELECT id, step_number, action, expected_result FROM test_steps WHERE test_case_id = ? ORDER BY step_number ASC')
    .all(req.params.testcaseId);
  res.json(steps);
});

// POST /api/testcases/:testcaseId/teststeps
router.post('/:testcaseId/teststeps', requireAuth, (req, res) => {
  const { action, expected_result } = req.body;
  if (!action || !expected_result) {
    return res.status(400).json({ error: 'action and expected_result are required' });
  }
  const tc = db.prepare('SELECT id FROM test_cases WHERE id = ?').get(req.params.testcaseId);
  if (!tc) return res.status(404).json({ error: 'TestCase not found' });
  const maxStep = db
    .prepare('SELECT MAX(step_number) as max FROM test_steps WHERE test_case_id = ?')
    .get(req.params.testcaseId);
  const stepNum = (maxStep.max || 0) + 1;
  const result = db
    .prepare('INSERT INTO test_steps (test_case_id, step_number, action, expected_result) VALUES (?, ?, ?, ?)')
    .run(req.params.testcaseId, stepNum, action, expected_result);
  const step = db
    .prepare('SELECT id, step_number, action, expected_result FROM test_steps WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(step);
});

// PUT /api/teststeps/:id - Note: accessed via /api/testcases but also can be direct
router.put('/steps/:id', requireAuth, (req, res) => {
  const { action, expected_result } = req.body;
  const step = db.prepare('SELECT id FROM test_steps WHERE id = ?').get(req.params.id);
  if (!step) return res.status(404).json({ error: 'TestStep not found' });
  db.prepare('UPDATE test_steps SET action = ?, expected_result = ? WHERE id = ?')
    .run(action, expected_result, req.params.id);
  const updated = db
    .prepare('SELECT id, step_number, action, expected_result FROM test_steps WHERE id = ?')
    .get(req.params.id);
  res.json(updated);
});

// DELETE /api/teststeps/:id
router.delete('/steps/:id', requireAuth, (req, res) => {
  const step = db
    .prepare('SELECT id, test_case_id, step_number FROM test_steps WHERE id = ?')
    .get(req.params.id);
  if (!step) return res.status(404).json({ error: 'TestStep not found' });
  const deleteAndRenumber = db.transaction(() => {
    db.prepare('DELETE FROM test_steps WHERE id = ?').run(req.params.id);
    // Renumber remaining steps
    const remaining = db
      .prepare('SELECT id FROM test_steps WHERE test_case_id = ? ORDER BY step_number ASC')
      .all(step.test_case_id);
    remaining.forEach((s, idx) => {
      db.prepare('UPDATE test_steps SET step_number = ? WHERE id = ?').run(idx + 1, s.id);
    });
  });
  deleteAndRenumber();
  res.json({ message: 'TestStep deleted' });
});

module.exports = router;
