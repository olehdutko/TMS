import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

export default function TestRunExecution() {
  const { testrunId, testrunCaseId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [trc, setTrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('skipped');
  const [executed, setExecuted] = useState(false);
  const [execDate] = useState(new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTestRunCase(testrunCaseId)
      .then(data => {
        setTrc(data);
        setResult(data.result || 'skipped');
        setExecuted(!!data.executed);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [testrunCaseId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateTestRunCase(testrunCaseId, result);
      addToast('Result saved!', 'success', 1000);
      navigate(`/testruns/${testrunId}`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const priorityClass = p => ({ High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[p] || '');

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>;
  if (error) return <div className="inline-error">{error}</div>;
  if (!trc) return null;

  return (
    <div>
      <Breadcrumb items={[
        { label: 'TestRuns', to: '/testruns' },
        { label: `TestRun #${testrunId}`, to: `/testruns/${testrunId}` },
        { label: trc.test_case_name, to: '#' },
      ]} />
      <div className="page-header">
        <h1 className="page-title">{trc.test_case_name}</h1>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate(`/testruns/${testrunId}`)}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          TestCase Details
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={trc.test_case_name} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <div style={{ paddingTop: 6 }}>
              <span className={`badge ${priorityClass(trc.priority)}`}>{trc.priority}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Created</label>
            <input className="form-input" value={trc.created_date} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Author</label>
            <input className="form-input" value={trc.author_name || ''} readOnly />
          </div>
        </div>
      </div>

      {trc.steps?.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Test Steps
          </h3>
          <div className="table-wrapper steps-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Action</th>
                  <th>Expected Result</th>
                </tr>
              </thead>
              <tbody>
                {trc.steps.map(step => (
                  <tr key={step.id}>
                    <td className="step-num">{step.step_number}</td>
                    <td>{step.action}</td>
                    <td>{step.expected_result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Execution
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Result</label>
            <select
              className="form-select"
              value={result}
              onChange={e => setResult(e.target.value)}
            >
              <option value="pass">pass</option>
              <option value="fail">fail</option>
              <option value="skipped">skipped</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Execution Date</label>
            <input className="form-input" value={execDate} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Executor</label>
            <input className="form-input" value={user?.user_name || ''} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
