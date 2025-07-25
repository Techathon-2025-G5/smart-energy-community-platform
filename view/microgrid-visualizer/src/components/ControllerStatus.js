import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ComponentChart from './ComponentChart';
import ManualControls from './ManualControls';
import './StatusCommon.css';
import './ControllerStatus.css';

export default function ControllerStatus({
  history,
  currentState,
  module,
  manualMode,
  manualValues,
  onManualChange,
  onGridAdjust,
  previewValues,
  statusData,
  totals,
  step,
}) {
  const fields = Object.keys(history);
  const [field, setField] = useState(fields[0] || '');

  return (
    <div className="component-status">
      <div className="balance-section">
        <h3>Balance</h3>
        <div className="balance-grid">
          <div className="load-value">
            <div className="value" style={{ color: 'var(--red)' }}>
              {(-(previewValues?.loads ?? 0) >= 1000
                ? ((previewValues?.loads ?? 0) / 1000).toFixed(2)
                : (previewValues?.loads ?? 0).toFixed(2))}{' '}
              {-(previewValues?.loads ?? 0) >= 1000 ? 'MWh' : 'kWh'}
            </div>
            <div className="label">Load demand</div>
          </div>
          <div className="generated-value">
            <div className="value" style={{ color: 'var(--green)' }}>
              {(previewValues?.generated ?? 0).toFixed(2)} kWh
            </div>
            <div className="label">Generated</div>
          </div>
          <div className="batteries-value">
            <div className="value" style={{ color: 'var(--blue)' }}>
              {(previewValues?.batteries ?? 0).toFixed(2)} kWh
            </div>
            <div className="label">Batteries</div>
          </div>
          <div className="batteries-cost-value">
            <div className="value" style={{ color: 'var(--red)' }}>
              {(previewValues?.costBatteries ?? 0).toFixed(2)}€
            </div>
            <div className="label">Batteries cost</div>
          </div>
          <div className="grid-value">
            <div className="value" style={{ color: (previewValues?.grid ?? 0) >= 0 ? 'var(--red)' : 'var(--green)' }}>
              {(previewValues?.grid ?? 0).toFixed(2)} kWh
            </div>
            <div className="label">Grid</div>
          </div>
          <div className="grid-cost-value">
            <div className="value" style={{ color: (previewValues?.costGrid ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(previewValues?.costGrid ?? 0).toFixed(2)}€
            </div>
            <div className="label">Grid earn/spent</div>
          </div>
          <div className="energy-value">
            <div className="value" style={{ color: (previewValues?.energyBalance ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(previewValues?.energyBalance ?? 0).toFixed(2)} kWh
            </div>
            <div className="label">Energy balance</div>
          </div>
          <div className="money-value">
            <div className="value" style={{ color: (previewValues?.moneyBalance ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(previewValues?.moneyBalance ?? 0).toFixed(2)}€
            </div>
            <div className="label">Money balance</div>
          </div>
        </div>
      </div>
      {manualMode && module?.params?.name === 'manual' && (
        <ManualControls
          values={manualValues}
          onChange={onManualChange}
          onGridAdjust={onGridAdjust}
          totals={totals}
        />
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
  onGridAdjust: PropTypes.func,
  previewValues: PropTypes.shape({
    grid: PropTypes.number,
    costGrid: PropTypes.number,
    batteries: PropTypes.number,
    costBatteries: PropTypes.number,
    energyBalance: PropTypes.number,
    moneyBalance: PropTypes.number,
    generated: PropTypes.number,
    loads: PropTypes.number,
  }),
  statusData: PropTypes.object,
  totals: PropTypes.shape({
    renewable: PropTypes.number,
    loads: PropTypes.number,
    batteryCharge: PropTypes.number,
    batteryDischarge: PropTypes.number,
  }),
  step: PropTypes.number,
};

ControllerStatus.defaultProps = {
  module: null,
  manualMode: false,
  manualValues: { battery: [], grid: [] },
  onManualChange: () => {},
  onGridAdjust: () => {},
  previewValues: null,
  statusData: null,
  totals: null,
  step: 0,
};
