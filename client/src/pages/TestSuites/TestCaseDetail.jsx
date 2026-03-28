import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

const PRIORITIES = ['High', 'Medium', 'Low'];

function StepsTable({ steps, onChange, readonly = false }) {
  const handleStepChange = (idx, field, value) => {
    const updated = steps.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    // Auto-create new step when last step gets filled
    const last = updated[updated.length - 1];
    if (last && (last.action || last.expected_result)) {
      onChange([...updated, { action: '', expected_result: '' }]);
    } else {
      onChange(updated);
    }
  };

  const handleRemove = (idx) => {
    const updated = steps.filter((_, i) => i !== idx);
    if (updated.length === 0 || (updated[updated.length - 1].action || updated[updated.length - 1].expected_result)) {
      onChange([...updated, { action: '', expected_result: '' }]);
    } else {
      onChange(updated);
    }
  };

  return (
    <div className="table-wrapper steps-table">
      <table>
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Action</th>
            <th>Expected Result</th>
            {!readonly && <th style={{ width: 50 }} />}
          </tr>
        </thead>
        <tbody>
          {steps.map((step, idx) => (
            <tr key={idx}>
              <td className="step-num">{idx + 1}</td>
              <td>
                {readonly ? (
                  <span>{step.action}</span>
                ) : (
                  <input
                    value={step.action}
                    onChange={e => handleStepChange(idx, 'action', e.target.value)}
                    placeholder="Describe the action..."
                  />
                )}
              </td>
              <td>
                {readonly ? (
                  <span>{step.expected_result}</span>
                ) : (
                  <input
                    value={step.expected_result}
                    onChange={e => handleStepChange(idx, 'expected_result', e.target.value)}
                    placeholder="Expected outcome..."
                  />
                )}
              </td>
              {!readonly && (
                <td>
                  {(step.action || step.expected_result) && (
                    <button
                      className="btn-icon danger"
                      onClick={() => handleRemove(idx)}
                      title="Remove step"
                    >
                      ✕
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TestCaseDetail() {
  const { suiteId, testcaseId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const isNew = !testcaseId || testcaseId === 'new';

  const [suite, setSuite] = useState(null);
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [steps, setSteps] = useState([{ action: '', expected_result: '' }]);
  const [createdDate, setCreatedDate] = useState('');
  const [author, setAuthor] = useState('');
  const [tcId, setTcId] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

  useEffect(() => {
    api.getTestSuite(suiteId).then(setSuite).catch(() => {});
    if (!isNew) {
      api.getTestCase(testcaseId)
        .then(tc => {
          setName(tc.name);
          setPriority(tc.priority);
          setCreatedDate(tc.created_date);
          setAuthor(tc.author);
          setTcId(tc.id);
          setSteps(tc.steps.length > 0
            ? [...tc.steps, { action: '', expected_result: '' }]
            : [{ action: '', expected_result: '' }]
          );
        })
        .catch(err => addToast(err.message, 'error'))
        .finally(() => setLoading(false));
    } else {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      setCreatedDate(now);
      setAuthor(user?.user_name || '');
    }
  }, [suiteId, testcaseId]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    const validSteps = steps.filter(s => s.action && s.expected_result);
    if (validSteps.length === 0) errs.steps = 'At least one complete step is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const validSteps = steps.filter(s => s.action && s.expected_result);
    try {
      if (isNew) {
        await api.createTestCase(suiteId, { name, priority, steps: validSteps });
        addToast('TestCase created successfully');
        navigate(`/testsuites/${suiteId}/testcases`);
      } else {
        await api.updateTestCase(testcaseId, { name, priority, steps: validSteps });
        addToast('TestCase saved successfully');
        setIsDirty(false);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = () => {
    if (isDirty) {
      setPendingNav(`/testsuites/${suiteId}/testcases`);
      setShowUnsaved(true);
    } else {
      navigate(`/testsuites/${suiteId}/testcases`);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteTestCase(testcaseId);
      addToast('TestCase deleted');
      navigate(`/testsuites/${suiteId}/testcases`);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const markDirty = (fn) => (...args) => { fn(...args); setIsDirty(true); };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>;

  const breadcrumbItems = [
    { label: 'TestSuites', to: '/testsuites' },
    { label: suite?.name || '...', to: `/testsuites/${suiteId}/testcases` },
    { label: isNew ? 'New TestCase' : (name || '...'), to: '#' },
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />
      <div className="page-header">
        <h1 className="page-title">{isNew ? 'Add new testcase' : name}</h1>
        <div className="page-actions">
          {!isNew && (
            <button className="btn btn-danger" onClick={() => setShowDelete(true)}>
              Remove
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleReturn}>
            Return
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name <span className="required">*</span></label>
            <input
              className="form-input"
              value={name}
              onChange={markDirty(e => setName(e.target.value))}
              placeholder="TestCase name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          {!isNew && (
            <div className="form-group">
              <label className="form-label">ID</label>
              <input className="form-input" value={tcId || ''} readOnly />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Priority <span className="required">*</span></label>
            <select
              className="form-select"
              value={priority}
              onChange={markDirty(e => setPriority(e.target.value))}
            >
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" value={createdDate} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Author</label>
            <input className="form-input" value={author} readOnly />
          </div>
        </div>
      </div>

      <div className="testcase-steps-section">
        <div className="steps-header">
          <span>Test Steps</span>
          {errors.steps && <span className="form-error">{errors.steps}</span>}
        </div>
        <StepsTable
          steps={steps}
          onChange={s => { setSteps(s); setIsDirty(true); }}
        />
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsaved && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Unsaved Changes</h3>
            <p className="modal-message">You have unsaved changes. Do you want to save before leaving?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowUnsaved(false)}>Cancel</button>
              <button className="btn btn-ghost" onClick={() => navigate(pendingNav)}>Don't Save</button>
              <button className="btn btn-primary" onClick={async () => { await handleSave(); navigate(pendingNav); }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete TestCase"
        message={`Are you sure you want to delete "${name}"? All TestSteps will be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        confirmLabel="Delete"
      />
    </div>
  );
}
