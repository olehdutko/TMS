import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function TestCases() {
  const { suiteId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [suite, setSuite] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.getTestSuite(suiteId), api.getTestCases(suiteId)])
      .then(([s, c]) => { setSuite(s); setCases(c); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [suiteId]);

  const handleDelete = async () => {
    try {
      await api.deleteTestCase(deleteTarget.id);
      setDeleteTarget(null);
      load();
      addToast('TestCase deleted');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const priorityClass = p => ({ High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[p] || '');

  return (
    <div>
      <Breadcrumb items={[
        { label: 'TestSuites', to: '/testsuites' },
        { label: suite?.name || '...', to: `/testsuites/${suiteId}/testcases` },
      ]} />
      <div className="page-header">
        <h1 className="page-title">{suite?.name || 'TestCases'}</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/testsuites/${suiteId}/testcases/new`)}
        >
          + Add TestCase
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>
      ) : error ? (
        <div className="inline-error">{error}</div>
      ) : cases.length === 0 ? (
        <div className="empty-state">
          <h3>No TestCases yet</h3>
          <p>Add your first TestCase to this suite.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 90 }}>Priority</th>
                <th style={{ width: 140 }}>Date</th>
                <th style={{ width: 130 }}>Author</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {cases.map(tc => (
                <tr
                  key={tc.id}
                  className="clickable"
                  onClick={() => navigate(`/testsuites/${suiteId}/testcases/${tc.id}`)}
                >
                  <td style={{ color: 'var(--text-muted)' }}>#{tc.id}</td>
                  <td style={{ fontWeight: 500 }}>{tc.name}</td>
                  <td>
                    <span className={`badge ${priorityClass(tc.priority)}`}>{tc.priority}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tc.created_date}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tc.author}</td>
                  <td className="td-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-icon danger"
                      title="Delete"
                      onClick={() => setDeleteTarget(tc)}
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
        title="Delete TestCase"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All TestSteps will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
