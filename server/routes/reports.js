const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/reports
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(`
      SELECT
        tr.id,
        tr.created_date,
        COUNT(trc.id) as total_tests,
        SUM(CASE WHEN trc.executed = 1 THEN 1 ELSE 0 END) as executed,
        SUM(CASE WHEN trc.result = 'pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN trc.result = 'fail' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN trc.result = 'skipped' THEN 1 ELSE 0 END) as skipped
      FROM test_runs tr
      LEFT JOIN test_run_cases trc ON tr.id = trc.test_run_id
      GROUP BY tr.id
      ORDER BY tr.id DESC
    `)
    .all();
  res.json(rows);
});

// GET /api/reports/:testrunId
router.get('/:testrunId', requireAuth, (req, res) => {
  const run = db
    .prepare(`
      SELECT tr.id, tr.created_date, u.user_name as creator_name
      FROM test_runs tr
      LEFT JOIN users u ON tr.creator_id = u.id
      WHERE tr.id = ?
    `)
    .get(req.params.testrunId);
  if (!run) return res.status(404).json({ error: 'TestRun not found' });

  const summary = db
    .prepare(`
      SELECT
        COUNT(id) as total_tests,
        SUM(CASE WHEN executed = 1 THEN 1 ELSE 0 END) as executed,
        SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN result = 'fail' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN result = 'skipped' THEN 1 ELSE 0 END) as skipped
      FROM test_run_cases
      WHERE test_run_id = ?
    `)
    .get(req.params.testrunId);

  const cases = db
    .prepare(`
      SELECT trc.id, trc.result, trc.executed,
             tc.name as test_case_name,
             ts.name as suite_name
      FROM test_run_cases trc
      JOIN test_cases tc ON trc.test_case_id = tc.id
      JOIN test_suites ts ON tc.test_suite_id = ts.id
      WHERE trc.test_run_id = ?
      ORDER BY trc.result ASC, tc.name ASC
    `)
    .all(req.params.testrunId);

  res.json({ run, summary, cases });
});

module.exports = router;
