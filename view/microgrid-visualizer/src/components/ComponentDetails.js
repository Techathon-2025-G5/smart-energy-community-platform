import React from 'react';
import PropTypes from 'prop-types';

function ComponentDetails({ module, onChange }) {
  if (!module) {
    return <div className="component-details">Select a component</div>;
  }

  const handleParamChange = (key, value) => {
    const newParams = { ...module.params, [key]: value };
    onChange({ ...module, params: newParams });
  };

  return (
    <div className="component-details">
      <h3>{module.type} parameters</h3>
      <form>
        {Object.entries(module.params || {})
          .filter(([key]) => key !== 'time_series')
          .map(([key, value]) => (
          <div key={key}>
            <label>
              {key}:
              <input
                type="text"
                value={value}
                onChange={(e) => handleParamChange(key, e.target.value)}
              />
            </label>
          </div>
        ))}
      </form>
      <div className="component-state">
        <h4>State</h4>
        <pre>{JSON.stringify(module.state || {}, null, 2)}</pre>
      </div>
    </div>
  );
}

ComponentDetails.propTypes = {
  module: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    params: PropTypes.object,
    state: PropTypes.object,
  }),
  onChange: PropTypes.func.isRequired,
};

export default ComponentDetails;
