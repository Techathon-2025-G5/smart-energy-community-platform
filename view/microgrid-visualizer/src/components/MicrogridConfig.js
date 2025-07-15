import PropTypes from 'prop-types';
import './ComponentDetails.css';
import MapSelector from './MapSelector';

export default function MicrogridConfig({ config, onChange, isSetup }) {
  const handleChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    onChange(newConfig);
  };

  const handleMapChange = ({ lat, lon }) => {
    const newConfig = { ...config, lat, lon };
    onChange(newConfig);
  };

  return (
    <div className="component-details">
      <form>
        <div>
          <label>
            Loss load cost:
            <input
              type="number"
              value={config.loss_load_cost}
              onChange={(e) => handleChange('loss_load_cost', e.target.value)}
              disabled={isSetup}
            />
          </label>
        </div>
        <div>
          <label>
            Overgeneration cost:
            <input
              type="number"
              value={config.overgeneration_cost}
              onChange={(e) => handleChange('overgeneration_cost', e.target.value)}
              disabled={isSetup}
            />
          </label>
        </div>
        <div>
          <label>
            Latitude:
            <input
              type="number"
              step="any"
              value={config.lat}
              onChange={(e) => handleChange('lat', e.target.value)}
              disabled={isSetup}
            />
          </label>
        </div>
        <div>
          <label>
            Longitude:
            <input
              type="number"
              step="any"
              value={config.lon}
              onChange={(e) => handleChange('lon', e.target.value)}
              disabled={isSetup}
            />
          </label>
        </div>
        <MapSelector
          lat={parseFloat(config.lat)}
          lon={parseFloat(config.lon)}
          onChange={handleMapChange}
        />
      </form>
    </div>
  );
}

MicrogridConfig.propTypes = {
  config: PropTypes.shape({
    loss_load_cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    overgeneration_cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lon: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  isSetup: PropTypes.bool,
};

MicrogridConfig.defaultProps = {
  isSetup: false,
};

