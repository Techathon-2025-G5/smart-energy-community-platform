import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';

function ComponentDetails({ module, onChange }) {
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    if (module && module.type) {
      api
        .getProfiles(module.type)
        .then((resp) => setProfiles(resp || {}))
        .catch(() => setProfiles({}));
    } else {
      setProfiles({});
    }
  }, [module?.type]);

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
        {Object.keys(profiles).length > 0 && (
          <div key="profile">
            <label>
              profile:
              <select
                value={module.params.time_series_profile || ''}
                onChange={(e) =>
                  handleParamChange('time_series_profile', e.target.value)
                }
              >
                <option value="">--select--</option>
                {Object.keys(profiles).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {Object.entries(module.params || {})
          .filter(([key]) => !['time_series', 'time_series_profile'].includes(key))
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
