import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import Breadcrumb from '../../components/Breadcrumb';

const COLORS = {
  Passed: '#00875a',
  Failed: '#de350b',
  Skipped: '#ff8b00',
};

function CollapsibleSection({ title, items, colorClass }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="collapsible-section">
      <div
        className={`collapsible-header ${colorClass}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{title} ({items.length})</span>
        <span>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className="collapsible-content">
          {items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>None</p>
          ) : (
            <ul>
              {items.map((item, i) => (
                <li key={i}>{item.test_case_name} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({item.suite_name})</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportDetail() {
  const { testrunId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getReport(testrunId)
      .then(setReport)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [testrunId]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>;
  if (error) return <div className="inline-error">{error}</div>;
  if (!report) return null;

  const { run, summary, cases } = report;
  const passed = cases.filter(c => c.result === 'pass');
  const failed = cases.filter(c => c.result === 'fail');
  const skipped = cases.filter(c => c.result === 'skipped');

  const chartData = [
    { name: 'Passed', value: summary.passed || 0 },
    { name: 'Failed', value: summary.failed || 0 },
    { name: 'Skipped', value: summary.skipped || 0 },
  ].filter(d => d.value > 0);

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Reports', to: '/reports' },
        { label: `TestRun #${testrunId}`, to: '#' },
      ]} />
      <div className="page-header">
        <h1 className="page-title">Report — TestRun #{run.id}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}>← Back</button>
      </div>

      <div className="section-card" style={{ marginBottom: 24 }}>
        <div className="section-card-title">Summary</div>
        <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
          <div><strong>Date:</strong> <span style={{ color: 'var(--text-secondary)' }}>{run.created_date}</span></div>
          <div><strong>Executor:</strong> <span style={{ color: 'var(--text-secondary)' }}>{run.creator_name}</span></div>
        </div>
      </div>

      <div className="report-summary">
        <div className="stat-card">
          <div className="stat-value">{summary.total_tests}</div>
          <div className="stat-label">Total Tests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.executed}</div>
          <div className="stat-label">Executed</div>
        </div>
        <div className="stat-card passed">
          <div className="stat-value">{summary.passed}</div>
          <div className="stat-label">Passed</div>
        </div>
        <div className="stat-card failed">
          <div className="stat-value">{summary.failed}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card skipped">
          <div className="stat-value">{summary.skipped}</div>
          <div className="stat-label">Skipped</div>
        </div>
      </div>

      <div className="report-chart-section">
        <div className="section-card">
          <div className="section-card-title">Results Distribution</div>
          {chartData.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>No execution data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="section-card">
          <div className="section-card-title">TestCase Results</div>
          <CollapsibleSection title="Passed" items={passed} colorClass="passed" />
          <CollapsibleSection title="Failed" items={failed} colorClass="failed" />
          <CollapsibleSection title="Skipped" items={skipped} colorClass="skipped" />
        </div>
      </div>
    </div>
  );
}
