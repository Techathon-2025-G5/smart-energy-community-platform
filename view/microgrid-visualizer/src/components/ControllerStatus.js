import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ComponentChart from './ComponentChart';
import ManualControls from './ManualControls';
import api from '../api/client';
import { parseTotalsLog } from '../utils/totals';
import './StatusCommon.css';
import './ControllerStatus.css';

export default function ControllerStatus({
  history,
  currentState,
  module,
  manualMode,
  manualValues,
  onManualChange,
  previewValues,
}) {
  const fields = Object.keys(history);
  const [field, setField] = useState(fields[0] || '');
  const [actual, setActual] = useState({
    generated: 0,
    grid: 0,
    batteries: 0,
    loads: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const log = await api.getLog();
        const parsed = parseTotalsLog(log);
        const stepList = Object.keys(parsed.renewable?.renewable_used || {})
          .map(Number)
          .sort((a, b) => a - b);
        const last = stepList[stepList.length - 1];
        const generated = Number(parsed.renewable?.renewable_used?.[last] || 0);
        const batDis = Number(parsed.battery?.discharge_amount?.[last] || 0);
        const batChg = Number(parsed.battery?.charge_amount?.[last] || 0);
        const gridImp = Number(parsed.grid?.grid_import?.[last] || 0);
        const gridExp = Number(parsed.grid?.grid_export?.[last] || 0);
        const loadCur = Number(parsed.load?.load_current?.[last] || 0);

        setActual({
          generated,
          grid: gridImp - gridExp,
          batteries: batDis - batChg,
          loads: loadCur,
        });
      } catch (_) {
        // ignore
      }
    };
    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="component-status">
      <div className="actual-section">
        <h3>Actual</h3>
        <div className="actual-grid">
          <div className="generated-value">
            <div className="value" style={{ color: 'var(--green)' }}>
              {actual.generated.toFixed(2)} kWh
            </div>
            <div className="label">Generated</div>
          </div>
          <div className="grid-value">
            <div className="value" style={{ color: actual.grid >= 0 ? 'var(--red)' : 'var(--green)' }}>
              {actual.grid.toFixed(2)} kWh
            </div>
            <div className="label">Grid</div>
          </div>
          <div className="batteries-value">
            <div className="value" style={{ color: 'var(--blue)' }}>
              {actual.batteries.toFixed(2)} kWh
            </div>
            <div className="label">Batteries</div>
          </div>
          <div className="loads-value">
            <div className="value" style={{ color: 'var(--red)' }}>
              {(-actual.loads >= 1000 ? (actual.loads / 1000).toFixed(2) : actual.loads.toFixed(2))}{' '}
              {-actual.loads >= 1000 ? 'MWh' : 'kWh'}
            </div>
            <div className="label">Loads</div>
          </div>
        </div>
      </div>
      {previewValues && (
        <div className="preview-section">
          <h3>Preview</h3>
          <div className="preview-grid">
            <div className="grid-value">
              <div className="value" style={{ color: previewValues.grid >= 0 ? 'var(--red)' : 'var(--green)' }}>
                {previewValues.grid.toFixed(2)} kWh
              </div>
              <div className="label">Grid</div>
            </div>
            <div className="batteries-value">
              <div className="value" style={{ color: 'var(--blue)' }}>
                {previewValues.batteries.toFixed(2)} kWh
              </div>
              <div className="label">Batteries</div>
            </div>
            <div className="energy-value">
              <div className="value" style={{ color: previewValues.energyBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {previewValues.energyBalance.toFixed(2)} kWh
              </div>
              <div className="label">Energy Balance</div>
            </div>
            <div className="money-value">
              <div className="value" style={{ color: previewValues.moneyBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {previewValues.moneyBalance.toFixed(2)}€
              </div>
              <div className="label">Money Balance</div>
            </div>
          </div>
        </div>
      )}
      {manualMode && module?.params?.name === 'manual' && (
        <ManualControls values={manualValues} onChange={onManualChange} />
      )}
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

ControllerStatus.propTypes = {
  history: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
  module: PropTypes.object,
  manualMode: PropTypes.bool,
  manualValues: PropTypes.shape({
    battery: PropTypes.arrayOf(PropTypes.number),
    grid: PropTypes.arrayOf(PropTypes.number),
  }),
  onManualChange: PropTypes.func,
  previewValues: PropTypes.shape({
    grid: PropTypes.number,
    batteries: PropTypes.number,
    energyBalance: PropTypes.number,
    moneyBalance: PropTypes.number,
  }),
};

ControllerStatus.defaultProps = {
  module: null,
  manualMode: false,
  manualValues: { battery: [], grid: [] },
  onManualChange: () => {},
  previewValues: null,
};
