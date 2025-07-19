import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useAppState } from '../context/AppState';
import './ManualControls.css';

export default function ManualControls({ values, onChange, onGridAdjust, totals }) {
  const {
    state: { modules },
  } = useAppState();

  const batteries = modules
    .filter((m) => m.type === 'battery')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
  const grids = modules
    .filter((m) => m.type === 'grid')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  const renewable = Number(totals?.renewable ?? 0);
  const loadDemand = Math.abs(Number(totals?.loads ?? 0));
  const batCharge = Number(totals?.batteryCharge ?? 0);
  const batDischarge = Number(totals?.batteryDischarge ?? 0);

  const baseExport = renewable + batDischarge - loadDemand - batCharge;

  useEffect(() => {
    grids.forEach((g, i) => {
      const maxImport = Number(g.params?.max_import || 0);
      const maxExport = Math.max(
        0,
        Math.min(Number(g.params?.max_export || 0), baseExport)
      );
      const val = values.grid[i] ?? 0;
      const clipped = Math.max(-maxImport, Math.min(val, maxExport));
      if (clipped !== val) {
        onChange('grid', i, clipped);
      }
    });
  }, [grids, baseExport]);

  const handleChange = (type, index) => (e) => {
    let val = parseFloat(e.target.value);
    if (type === 'grid' && val > 0) {
      const limit = Math.min(
        Number(grids[index]?.params?.max_export || 0),
        baseExport
      );
      if (val > limit) val = limit;
    }
    onChange(type, index, val);
  };

  return (
    <div className="manual-controls">
      {batteries.map((b, i) => {
        const maxCharge = Math.min(
          Number(b.params?.max_charge || 0),
          (Number(b.params?.max_capacity || 0) - (b.state?.current_charge || 0)) *
            (b.params?.efficiency || 1)
        );
        const dischargeCapacity =
          (b.state?.current_charge || 0) - Number(b.params?.min_capacity || 0);
        const maxDischarge = Math.max(
          0,
          Math.min(Number(b.params?.max_discharge || 0), dischargeCapacity)
        );
        return (
          <label key={`bat-${i}`}>
            Battery {i + 1}: {values.battery[i] ?? 0}
            <span className="slider-wrapper">
              <span>discharge</span>
              <input
                type="range"
                min={-maxDischarge}
                max={maxCharge}
                step="0.01"
                value={values.battery[i] ?? 0}
                onChange={handleChange('battery', i)}
              />
              <span>charge</span>
            </span>
          </label>
        );
      })}
      {grids.map((g, i) => (
        <label key={`grid-${i}`}>
          Grid {i + 1}: {values.grid[i] ?? 0}
          <button
            type="button"
            className="adjust-button"
            onClick={() => onGridAdjust(i)}
          >
            Adjust
          </button>
          <span className="slider-wrapper">
            <span>import</span>
            <input
              type="range"
              min={-Number(g.params?.max_import || 0)}
              max={Math.max(
                0,
                Math.min(Number(g.params?.max_export || 0), baseExport)
              )}
              step="0.01"
              value={values.grid[i] ?? 0}
              onChange={handleChange('grid', i)}
            />
            <span>export</span>
          </span>
        </label>
      ))}
    </div>
  );
}

ManualControls.propTypes = {
  values: PropTypes.shape({
    battery: PropTypes.arrayOf(PropTypes.number),
    grid: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onGridAdjust: PropTypes.func,
  totals: PropTypes.shape({
    renewable: PropTypes.number,
    loads: PropTypes.number,
    batteryCharge: PropTypes.number,
    batteryDischarge: PropTypes.number,
  }),
};

ManualControls.defaultProps = {
  onGridAdjust: () => {},
  totals: null,
};
