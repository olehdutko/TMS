import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';
import TreeView from '../../components/TreeView';
import { useToast } from '../../components/Toast';

export default function TestRunNew() {
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.getTestSuites()
      .then(async (s) => {
        const suitesWithCases = await Promise.all(
          s.map(async suite => ({
            ...suite,
            cases: await api.getTestCases(suite.id),
          }))
        );
        setSuites(suitesWithCases.filter(s => s.cases.length > 0));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one TestCase.');
      return;
    }
    setSaving(true);
    try {
      await api.createTestRun(selectedIds);
      addToast('TestRun created!', 'success', 1000);
      navigate('/testruns');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[
        { label: 'TestRuns', to: '/testruns' },
        { label: 'New TestRun', to: '/testruns/new' },
      ]} />
      <div className="page-header">
        <h1 className="page-title">New TestRun</h1>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/testruns')}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : `Save (${selectedIds.length} selected)`}
          </button>
        </div>
      </div>

      {error && <div className="inline-error">{error}</div>}

      <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 13 }}>
        Select the TestCases to include in this run. Expand a TestSuite to see its cases.
      </p>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>
      ) : suites.length === 0 ? (
        <div className="empty-state">
          <h3>No TestCases available</h3>
          <p>Create TestSuites and TestCases first.</p>
        </div>
      ) : (
        <TreeView suites={suites} onSelectionChange={setSelectedIds} />
      )}
    </div>
  );
}
