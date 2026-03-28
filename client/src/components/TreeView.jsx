import React, { useState } from 'react';

export default function TreeView({ suites, onSelectionChange }) {
  const [expanded, setExpanded] = useState({});
  const [checked, setChecked] = useState({});

  const toggleSuite = (suiteId) => {
    setExpanded(prev => ({ ...prev, [suiteId]: !prev[suiteId] }));
  };

  const toggleSuiteCheck = (suite) => {
    const allCaseIds = suite.cases.map(c => c.id);
    const allChecked = allCaseIds.every(id => checked[id]);
    const newChecked = { ...checked };
    allCaseIds.forEach(id => {
      newChecked[id] = !allChecked;
    });
    setChecked(newChecked);
    onSelectionChange(Object.keys(newChecked).filter(id => newChecked[id]).map(Number));
  };

  const toggleCase = (caseId) => {
    const newChecked = { ...checked, [caseId]: !checked[caseId] };
    setChecked(newChecked);
    onSelectionChange(Object.keys(newChecked).filter(id => newChecked[id]).map(Number));
  };

  const isSuiteAllChecked = (suite) =>
    suite.cases.length > 0 && suite.cases.every(c => checked[c.id]);

  const isSuitePartialChecked = (suite) =>
    suite.cases.some(c => checked[c.id]) && !isSuiteAllChecked(suite);

  return (
    <div className="tree-view">
      {suites.map(suite => (
        <div key={suite.id} className="tree-suite">
          <div className="tree-suite-header" onClick={() => toggleSuite(suite.id)}>
            <input
              type="checkbox"
              checked={isSuiteAllChecked(suite)}
              ref={el => { if (el) el.indeterminate = isSuitePartialChecked(suite); }}
              onChange={(e) => { e.stopPropagation(); toggleSuiteCheck(suite); }}
              onClick={e => e.stopPropagation()}
            />
            <span className="tree-suite-name">{suite.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {suite.cases.filter(c => checked[c.id]).length}/{suite.cases.length}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>{expanded[suite.id] ? '▾' : '▸'}</span>
          </div>
          {expanded[suite.id] && suite.cases.map(tc => (
            <div key={tc.id} className="tree-case">
              <input
                type="checkbox"
                checked={!!checked[tc.id]}
                onChange={() => toggleCase(tc.id)}
              />
              <span className="tree-case-name">{tc.name}</span>
              <span
                className={`badge badge-${tc.priority?.toLowerCase()}`}
                style={{ marginLeft: 'auto', fontSize: 11 }}
              >
                {tc.priority}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
