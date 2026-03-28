import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function TestRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.getTestRuns()
      .then(setRuns)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    try {
      await api.deleteTestRun(deleteTarget.id);
      setDeleteTarget(null);
      load();
      addToast('TestRun deleted');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'TestRuns', to: '/testruns' }]} />
      <div className="page-header">
        <h1 className="page-title">TestRuns</h1>
        <button className="btn btn-primary" onClick={() => navigate('/testruns/new')}>
          + New TestRun
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>
      ) : error ? (
        <div className="inline-error">{error}</div>
      ) : runs.length === 0 ? (
        <div className="empty-state">
          <h3>No TestRuns yet</h3>
          <p>Create your first TestRun to start executing tests.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th style={{ width: 160 }}>Date</th>
                <th style={{ width: 120 }}>Pass Rate</th>
                <th>Creator</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr
                  key={run.id}
                  className="clickable"
                  onClick={() => navigate(`/testruns/${run.id}`)}
                >
                  <td style={{ color: 'var(--text-muted)' }}>#{run.id}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{run.created_date}</td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: parseFloat(run.pass_rate) >= 80
                        ? 'var(--success)'
                        : parseFloat(run.pass_rate) >= 50
                        ? 'var(--warning)'
                        : 'var(--danger)'
                    }}>
                      {run.pass_rate}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>
                      ({run.total_cases} tests)
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{run.creator_name}</td>
                  <td className="td-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-icon danger"
                      onClick={() => setDeleteTarget(run)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete TestRun"
        message={`Are you sure you want to delete TestRun #${deleteTarget?.id}? All execution data will be lost.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
