import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function TestSuites() {
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.getTestSuites()
      .then(setSuites)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { setAddError('Name is required'); return; }
    setAddLoading(true);
    setAddError('');
    try {
      await api.createTestSuite(newName.trim());
      setNewName('');
      setShowAddModal(false);
      load();
      addToast('TestSuite created successfully');
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteTestSuite(deleteTarget.id);
      setDeleteTarget(null);
      load();
      addToast('TestSuite deleted');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'TestSuites', to: '/testsuites' }]} />
      <div className="page-header">
        <h1 className="page-title">TestSuites</h1>
        <button className="btn btn-primary" onClick={() => { setNewName(''); setAddError(''); setShowAddModal(true); }}>
          + Add TestSuite
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>
      ) : error ? (
        <div className="inline-error">{error}</div>
      ) : suites.length === 0 ? (
        <div className="empty-state">
          <h3>No TestSuites yet</h3>
          <p>Create your first TestSuite to get started.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>TestSuite Name</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {suites.map(suite => (
                <tr
                  key={suite.id}
                  className="clickable"
                  onClick={() => navigate(`/testsuites/${suite.id}/testcases`)}
                >
                  <td style={{ color: 'var(--text-muted)' }}>#{suite.id}</td>
                  <td style={{ fontWeight: 500 }}>{suite.name}</td>
                  <td className="td-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-icon danger"
                      title="Delete"
                      onClick={() => setDeleteTarget(suite)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Add TestSuite</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Name <span className="required">*</span></label>
                <input
                  className="form-input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="TestSuite name"
                  autoFocus
                />
                {addError && <span className="form-error">{addError}</span>}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete TestSuite"
        message={`Are you sure you want to delete TestSuite "${deleteTarget?.name}"? All associated TestCases and TestSteps will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
