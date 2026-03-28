import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getReports()
      .then(setReports)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Reports', to: '/reports' }]} />
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>
      ) : error ? (
        <div className="inline-error">{error}</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <h3>No TestRuns yet</h3>
          <p>Create a TestRun to see reports here.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>TestRun</th>
                <th style={{ width: 160 }}>Date</th>
                <th style={{ width: 100 }}>Total Tests</th>
                <th style={{ width: 100 }}>Executed</th>
                <th style={{ width: 100 }}>Passed</th>
                <th style={{ width: 100 }}>Failed</th>
                <th style={{ width: 100 }}>Skipped</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr
                  key={r.id}
                  className="clickable"
                  onClick={() => navigate(`/reports/${r.id}`)}
                >
                  <td style={{ color: 'var(--text-muted)' }}>#{r.id}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.created_date}</td>
                  <td style={{ fontWeight: 600 }}>{r.total_tests}</td>
                  <td>{r.executed}</td>
                  <td><span className="result-pass">{r.passed}</span></td>
                  <td><span className="result-fail">{r.failed}</span></td>
                  <td><span className="result-skipped">{r.skipped}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
