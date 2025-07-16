import PropTypes from 'prop-types';
import { useAppState } from '../context/AppState';
import './ManualControls.css';

export default function ManualControls({ values, onChange }) {
  const {
    state: { modules },
  } = useAppState();

  const batteries = modules
    .filter((m) => m.type === 'battery')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
  const grids = modules
    .filter((m) => m.type === 'grid')
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  const handleChange = (type, index) => (e) => {
    const val = parseFloat(e.target.value);
    onChange(type, index, val);
  };

  return (
    <div className="manual-controls">
      {batteries.map((b, i) => (
        <label key={`bat-${i}`}>
          Battery {i + 1}: {values.battery[i] ?? 0}
          <input
            type="range"
            min={-Number(b.params?.max_discharge || 0)}
            max={Number(b.params?.max_charge || 0)}
            step="0.1"
            value={values.battery[i] ?? 0}
            onChange={handleChange('battery', i)}
          />
        </label>
      ))}
      {grids.map((g, i) => (
        <label key={`grid-${i}`}>
          Grid {i + 1}: {values.grid[i] ?? 0}
          <input
            type="range"
            min={-Number(g.params?.max_import || 0)}
            max={Number(g.params?.max_export || 0)}
            step="0.1"
            value={values.grid[i] ?? 0}
            onChange={handleChange('grid', i)}
          />
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
};
