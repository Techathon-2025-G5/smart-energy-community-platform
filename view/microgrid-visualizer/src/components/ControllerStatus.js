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
  onGridAdjust,
  previewValues,
  actualValues,
  statusData,
  totals,
  step,
}) {
  const fields = Object.keys(history);
  const [field, setField] = useState(fields[0] || '');
  const [actual, setActual] = useState({
    generated: 0,
    grid: 0,
    batteries: 0,
    loads: 0,
    energyBalance: 0,
    moneyBalance: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [status, log] = await Promise.all([
          api.getStatus(),
          api.getLog(),
        ]);
        const parsed = parseTotalsLog(log);
        const stepList = Object.keys(parsed.renewable?.renewable_used || {})
          .map(Number)
          .sort((a, b) => a - b);
        const last = stepList[stepList.length - 1];
        const generated = Number(status?.total?.[0]?.renewables || 0);
        const batDis = Number(parsed.battery?.discharge_amount?.[last] || 0);
        const batChg = Number(parsed.battery?.charge_amount?.[last] || 0);
        const gridImp = Number(parsed.grid?.grid_import?.[last] || 0);
        const gridExp = Number(parsed.grid?.grid_export?.[last] || 0);
        const loadCur = Number(status?.total?.[0]?.loads || 0);

        setActual((prev) => ({
          ...prev,
          generated,
          grid: gridImp - gridExp,
          batteries: batDis - batChg,
          loads: loadCur,
        }));
      } catch (_) {
        // ignore
      }
    };
    fetchData();
  }, [step]);

  useEffect(() => {
    if (actualValues) {
      setActual((prev) => ({
        ...prev,
        grid: actualValues.grid,
        batteries: actualValues.batteries,
        energyBalance: actualValues.energyBalance,
        moneyBalance: actualValues.moneyBalance,
      }));
    }
  }, [actualValues]);

  return (
    <div className="component-status">
      <div className="balance-section">
        <h3>Balance</h3>
        <div className="balance-grid">
          <div className="load-value">
            <div className="value" style={{ color: 'var(--red)' }}>
              {(-actual.loads >= 1000 ? (actual.loads / 1000).toFixed(2) : actual.loads.toFixed(2))}{' '}
              {-actual.loads >= 1000 ? 'MWh' : 'kWh'}
            </div>
            <div className="label">Load demand</div>
          </div>
          <div className="generated-value">
            <div className="value" style={{ color: 'var(--green)' }}>
              {actual.generated.toFixed(2)} kWh
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
  }),
  actualValues: PropTypes.shape({
    grid: PropTypes.number,
    costGrid: PropTypes.number,
    batteries: PropTypes.number,
    costBatteries: PropTypes.number,
    energyBalance: PropTypes.number,
    moneyBalance: PropTypes.number,
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
  actualValues: null,
  statusData: null,
  totals: null,
  step: 0,
};
