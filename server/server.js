const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'tms-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

// Initialize database
require('./database/db');

// Routes
const authRoutes = require('./routes/auth');
const testSuiteRoutes = require('./routes/testsuites');
const testCaseRoutes = require('./routes/testcases');
const testRunRoutes = require('./routes/testruns');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/testsuites', testSuiteRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/testruns', testRunRoutes);
app.use('/api/reports', reportRoutes);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`TMS Server running on http://localhost:${PORT}`);
});

module.exports = app;
