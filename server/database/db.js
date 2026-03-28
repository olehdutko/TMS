const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../../database');
const DB_PATH = path.join(DB_DIR, 'tms.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      login     TEXT UNIQUE NOT NULL,
      password  TEXT NOT NULL,
      user_name TEXT NOT NULL,
      role      TEXT NOT NULL CHECK(role IN ('admin', 'QA'))
    );

    CREATE TABLE IF NOT EXISTS test_suites (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      test_suite_id INTEGER NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
      priority      TEXT NOT NULL CHECK(priority IN ('High', 'Medium', 'Low')),
      created_date  TEXT NOT NULL,
      author_id     INTEGER REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_test_cases_suite ON test_cases(test_suite_id);
    CREATE INDEX IF NOT EXISTS idx_test_cases_author ON test_cases(author_id);

    CREATE TABLE IF NOT EXISTS test_steps (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      test_case_id    INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
      step_number     INTEGER NOT NULL,
      action          TEXT NOT NULL,
      expected_result TEXT NOT NULL,
      UNIQUE(test_case_id, step_number)
    );

    CREATE INDEX IF NOT EXISTS idx_test_steps_case ON test_steps(test_case_id);

    CREATE TABLE IF NOT EXISTS test_runs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      created_date TEXT NOT NULL,
      creator_id   INTEGER REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_test_runs_creator ON test_runs(creator_id);

    CREATE TABLE IF NOT EXISTS test_run_cases (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      test_run_id   INTEGER NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
      test_case_id  INTEGER NOT NULL REFERENCES test_cases(id),
      executed      INTEGER NOT NULL DEFAULT 0,
      result        TEXT NOT NULL DEFAULT 'skipped' CHECK(result IN ('pass', 'fail', 'skipped')),
      executed_date TEXT,
      executor_id   INTEGER REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_trc_run ON test_run_cases(test_run_id);
    CREATE INDEX IF NOT EXISTS idx_trc_case ON test_run_cases(test_case_id);
  `);

  // Insert admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE login = ?').get('admin');
  if (!adminExists) {
    db.prepare(
      "INSERT INTO users (login, password, user_name, role) VALUES ('admin', 'admin', 'Administrator', 'admin')"
    ).run();
    console.log('Admin user created.');
  }
}

initSchema();

module.exports = db;
