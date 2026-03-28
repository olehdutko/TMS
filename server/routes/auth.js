const express = require('express');
const router = express.Router();
const db = require('../database/db');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { login, password, user_name } = req.body;
  if (!login || !password || !user_name) {
    return res.status(400).json({ error: 'login, password, and user_name are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE login = ?').get(login);
  if (existing) {
    return res.status(409).json({ error: 'Login already exists' });
  }
  const result = db
    .prepare("INSERT INTO users (login, password, user_name, role) VALUES (?, ?, ?, 'QA')")
    .run(login, password, user_name);
  const user = db.prepare('SELECT id, login, user_name, role FROM users WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(user);
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'login and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE login = ?').get(login);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.userId = user.id;
  req.session.userRole = user.role;
  return res.json({ id: user.id, login: user.login, user_name: user.user_name, role: user.role });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = db
    .prepare('SELECT id, login, user_name, role FROM users WHERE id = ?')
    .get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json(user);
});

module.exports = router;
