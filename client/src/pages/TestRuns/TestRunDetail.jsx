import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';

export default function TestRunDetail() {
  const { testrunId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTestRun(testrunId)
      .then(setRun)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [testrunId]);

  const resultClass = r => ({ pass: 'result-pass', fail: 'result-fail', skipped: 'result-skipped' }[r] || '');

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>;
  if (error) return <div className="inline-error">{error}</div>;
  if (!run) return null;

  // Group cases by suite
  const grouped = {};
  (run.cases || []).forEach(c => {
    if (!grouped[c.suite_name]) grouped[c.suite_name] = [];
    grouped[c.suite_name].push(c);
  });

  return (
    <div>
      <Breadcrumb items={[
        { label: 'TestRuns', to: '/testruns' },
        { label: `TestRun #${run.id}`, to: `/testruns/${run.id}` },
      ]} />
      <div className="page-header">
        <h1 className="page-title">TestRun #{run.id} — {run.created_date}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/testruns')}>
          ← Back
        </button>
      </div>

      {run.cases?.length === 0 ? (
        <div className="empty-state"><h3>No test cases in this run</h3></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Executed</th>
                <th>TestSuite</th>
                <th>TestCase Name</th>
                <th style={{ width: 100 }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([suiteName, cases]) => (
                <React.Fragment key={suiteName}>
                  <tr className="suite-group-row">
                    <td colSpan={4}>{suiteName}</td>
                  </tr>
                  {cases.map(c => (
                    <tr
                      key={c.id}
                      className="clickable"
                      onClick={() => navigate(`/testruns/${testrunId}/testcases/${c.id}`)}
                    >
                      <td style={{ textAlign: 'center' }}>
                        {c.executed ? (
                          <span style={{ color: 'var(--success)' }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{suiteName}</td>
                      <td>{c.test_case_name}</td>
                      <td>
                        <span className={resultClass(c.result)}>
                          {c.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
