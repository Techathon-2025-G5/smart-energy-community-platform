import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ComponentChart from './ComponentChart';
import './StatusCommon.css';
import './BuildingStatus.css';

export default function BuildingStatus({ history, currentState }) {
  const fields = Object.keys(history);
  const [field, setField] = useState(fields[0] || '');

  return (
    <div className="component-status">
      <div className="component-state">
        <h4>State</h4>
        <pre>{JSON.stringify(currentState || {}, null, 2)}</pre>
      </div>
      {fields.length > 0 && (
        <div className="component-history">
          <ComponentChart
            data={Object.entries(history[field] || {})
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([, v]) => ({ value: Number(v) }))}
          />
          <select value={field} onChange={(e) => setField(e.target.value)}>
            {fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

BuildingStatus.propTypes = {
  history: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
};
