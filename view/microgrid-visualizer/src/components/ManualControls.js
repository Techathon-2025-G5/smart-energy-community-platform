import PropTypes from 'prop-types';
import { useAppState } from '../context/AppState';
import './ManualControls.css';

export default function ManualControls({ values, onChange, onGridAdjust }) {
  const {
    state: { modules },
  } = useAppState();

  const batteries = modules
    .filter((m) => m.type === 'battery')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
  const grids = modules
    .filter((m) => m.type === 'grid')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  const renewable = modules
    .filter((m) => m.type === 'solar')
    .reduce((acc, m) => acc + Number(m.state?.renewable_current || 0), 0);
  const loadDemand = modules
    .filter((m) => ['house', 'building'].includes(m.type))
    .reduce((acc, m) => acc + Math.abs(Number(m.state?.load_current || 0)), 0);

  const batteryMods = batteries;
  let batCharge = 0;
  let batDischarge = 0;
  values.battery.forEach((val, i) => {
    const eff = Number(batteryMods[i]?.params?.efficiency || 1);
    if (val > 0) batCharge += val;
    else if (val < 0) batDischarge += -val * eff;
  });

  const baseExport = renewable + batDischarge - loadDemand - batCharge;

  const handleChange = (type, index) => (e) => {
    let val = parseFloat(e.target.value);
    if (type === 'grid' && val > 0) {
      const other = values.grid.reduce(
        (acc, v, i) => (i === index || v <= 0 ? acc : acc + v),
        0
      );
      const remaining = baseExport - other;
      const limit = Math.min(
        Number(grids[index]?.params?.max_export || 0),
        remaining
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
                step="0.1"
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
              max={Math.min(
                Number(g.params?.max_export || 0),
                baseExport -
                  values.grid.reduce(
                    (acc, v, idx) =>
                      idx === i || v <= 0 ? acc : acc + v,
                    0
                  )
              )}
              step="0.1"
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
};

ManualControls.defaultProps = {
  onGridAdjust: () => {},
};
