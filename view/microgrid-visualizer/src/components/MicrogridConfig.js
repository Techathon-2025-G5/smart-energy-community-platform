import PropTypes from 'prop-types';
import './ComponentDetails.css';

export default function MicrogridConfig({ config, onChange, isSetup }) {
  const handleChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    onChange(newConfig);
  };

  return (
    <form>
      <div>
        <label>
          loss_load_cost:
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
          overgeneration_cost:
          <input
            type="number"
            value={config.overgeneration_cost}
            onChange={(e) => handleChange('overgeneration_cost', e.target.value)}
            disabled={isSetup}
          />
        </label>
      </div>
    </form>
  );
}

MicrogridConfig.propTypes = {
  config: PropTypes.shape({
    loss_load_cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    overgeneration_cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  isSetup: PropTypes.bool,
};

MicrogridConfig.defaultProps = {
  isSetup: false,
};
