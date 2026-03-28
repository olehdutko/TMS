const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/testruns
router.get('/', requireAuth, (req, res) => {
  const runs = db
    .prepare(`
      SELECT tr.id, tr.created_date, tr.creator_id, u.user_name as creator_name,
        COUNT(trc.id) as total_cases,
        SUM(CASE WHEN trc.result = 'pass' THEN 1 ELSE 0 END) as passed_cases
      FROM test_runs tr
      LEFT JOIN users u ON tr.creator_id = u.id
      LEFT JOIN test_run_cases trc ON tr.id = trc.test_run_id
      GROUP BY tr.id
      ORDER BY tr.id DESC
    `)
    .all();
  const result = runs.map(r => ({
    id: r.id,
    created_date: r.created_date,
    creator_name: r.creator_name,
    total_cases: r.total_cases,
    pass_rate:
      r.total_cases > 0
        ? ((r.passed_cases / r.total_cases) * 100).toFixed(1) + '%'
        : '0%',
  }));
  res.json(result);
});

// POST /api/testruns
router.post('/', requireAuth, (req, res) => {
  const { test_case_ids } = req.body;
  if (!test_case_ids || !Array.isArray(test_case_ids) || test_case_ids.length === 0) {
    return res.status(400).json({ error: 'test_case_ids is required and must be non-empty' });
  }
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const creatorId = req.session.userId;

  const insertRun = db.prepare('INSERT INTO test_runs (created_date, creator_id) VALUES (?, ?)');
  const insertRunCase = db.prepare(
    "INSERT INTO test_run_cases (test_run_id, test_case_id, executed, result) VALUES (?, ?, 0, 'skipped')"
  );

  const createRun = db.transaction(() => {
    const runResult = insertRun.run(now, creatorId);
    const runId = runResult.lastInsertRowid;
    for (const caseId of test_case_ids) {
      insertRunCase.run(runId, caseId);
    }
    return runId;
  });

  const runId = createRun();
  const run = db
    .prepare(`
      SELECT tr.id, tr.created_date, u.user_name as creator_name
      FROM test_runs tr
      LEFT JOIN users u ON tr.creator_id = u.id
      WHERE tr.id = ?
    `)
    .get(runId);
  res.status(201).json(run);
});

// GET /api/testruns/:id
router.get('/:id', requireAuth, (req, res) => {
  const run = db
    .prepare(`
      SELECT tr.id, tr.created_date, u.user_name as creator_name
      FROM test_runs tr
      LEFT JOIN users u ON tr.creator_id = u.id
      WHERE tr.id = ?
    `)
    .get(req.params.id);
  if (!run) return res.status(404).json({ error: 'TestRun not found' });

  const cases = db
    .prepare(`
      SELECT trc.id, trc.executed, trc.result, trc.executed_date,
             tc.name as test_case_name, tc.id as test_case_id,
             ts.name as suite_name, ts.id as suite_id,
             u.user_name as executor_name
      FROM test_run_cases trc
      JOIN test_cases tc ON trc.test_case_id = tc.id
      JOIN test_suites ts ON tc.test_suite_id = ts.id
      LEFT JOIN users u ON trc.executor_id = u.id
      WHERE trc.test_run_id = ?
      ORDER BY ts.name ASC, tc.name ASC
    `)
    .all(req.params.id);
  res.json({ ...run, cases });
});

// DELETE /api/testruns/:id
router.delete('/:id', requireAuth, (req, res) => {
  const run = db.prepare('SELECT id FROM test_runs WHERE id = ?').get(req.params.id);
  if (!run) return res.status(404).json({ error: 'TestRun not found' });
  db.prepare('DELETE FROM test_runs WHERE id = ?').run(req.params.id);
  res.json({ message: 'TestRun deleted' });
});

// GET /api/testruns/:testrunId/testcases
router.get('/:testrunId/testcases', requireAuth, (req, res) => {
  const cases = db
    .prepare(`
      SELECT trc.id, trc.executed, trc.result, trc.executed_date,
             tc.name as test_case_name, tc.id as test_case_id, tc.priority,
             ts.name as suite_name,
             u.user_name as executor_name
      FROM test_run_cases trc
      JOIN test_cases tc ON trc.test_case_id = tc.id
      JOIN test_suites ts ON tc.test_suite_id = ts.id
      LEFT JOIN users u ON trc.executor_id = u.id
      WHERE trc.test_run_id = ?
      ORDER BY ts.name ASC, tc.name ASC
    `)
    .all(req.params.testrunId);
  res.json(cases);
});

// GET /api/testruncases/:id
router.get('/cases/:id', requireAuth, (req, res) => {
  const trc = db
    .prepare(`
      SELECT trc.id, trc.executed, trc.result, trc.executed_date, trc.test_run_id,
             tc.id as test_case_id, tc.name as test_case_name, tc.priority, tc.created_date,
             ts.name as suite_name,
             ua.user_name as author_name,
             ue.user_name as executor_name
      FROM test_run_cases trc
      JOIN test_cases tc ON trc.test_case_id = tc.id
      JOIN test_suites ts ON tc.test_suite_id = ts.id
      LEFT JOIN users ua ON tc.author_id = ua.id
      LEFT JOIN users ue ON trc.executor_id = ue.id
      WHERE trc.id = ?
    `)
    .get(req.params.id);
  if (!trc) return res.status(404).json({ error: 'TestRunCase not found' });
  const steps = db
    .prepare('SELECT id, step_number, action, expected_result FROM test_steps WHERE test_case_id = ? ORDER BY step_number ASC')
    .all(trc.test_case_id);
  res.json({ ...trc, steps });
});

// PUT /api/testruncases/:id
router.put('/cases/:id', requireAuth, (req, res) => {
  const { result } = req.body;
  if (!result || !['pass', 'fail', 'skipped'].includes(result)) {
    return res.status(400).json({ error: 'result must be pass, fail, or skipped' });
  }
  const trc = db.prepare('SELECT id FROM test_run_cases WHERE id = ?').get(req.params.id);
  if (!trc) return res.status(404).json({ error: 'TestRunCase not found' });
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  db.prepare('UPDATE test_run_cases SET executed = 1, result = ?, executed_date = ?, executor_id = ? WHERE id = ?')
    .run(result, now, req.session.userId, req.params.id);
  const updated = db
    .prepare(`
      SELECT trc.id, trc.executed, trc.result, trc.executed_date, trc.test_run_id,
             tc.name as test_case_name,
             u.user_name as executor_name
      FROM test_run_cases trc
      JOIN test_cases tc ON trc.test_case_id = tc.id
      LEFT JOIN users u ON trc.executor_id = u.id
      WHERE trc.id = ?
    `)
    .get(req.params.id);
  res.json(updated);
});

module.exports = router;
