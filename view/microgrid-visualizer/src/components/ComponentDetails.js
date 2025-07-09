import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';
import ComponentChart from './ComponentChart';
import { parseLog } from '../utils/log';
import './ComponentDetails.css';

function ComponentDetails({ module, onChange }) {
  const [profiles, setProfiles] = useState({});
  const [currentState, setCurrentState] = useState({});
  const [history, setHistory] = useState({});
  const [field, setField] = useState('');

  useEffect(() => {
    if (module && module.type) {
      api
        .getProfiles(module.type)
        .then((resp) => {
          setProfiles(resp || {});
          const names = Object.keys(resp || {});
          if (names.length > 0 && !module.params.time_series_profile) {
            handleParamChange('time_series_profile', names[0]);
          }
        })
        .catch(() => setProfiles({}));
    } else {
      setProfiles({});
    }
  }, [module?.type]);

  useEffect(() => {
    if (!module) {
      setCurrentState({});
      setHistory({});
      setField('');
      return undefined;
    }

    const fetchInfo = async () => {
      try {
        const log = await api.getLog();
        const parsed = parseLog(log);
        const [type, idxStr] = module.id.split('_');
        const idx = parseInt(idxStr, 10);
        const hist = parsed[type]?.[idx] || {};
        setHistory(hist);
        const state = {};
        Object.entries(hist).forEach(([metric, values]) => {
          const steps = Object.keys(values).map(Number);
          if (steps.length > 0) {
            const last = Math.max(...steps);
            state[metric] = Number(values[last]);
          }
        });
        setCurrentState(state);
        const fields = Object.keys(hist);
        setField((f) => (fields.includes(f) ? f : fields[0] || ''));
      } catch (_) {
        setCurrentState({});
        setHistory({});
        setField('');
      }
    };

    fetchInfo();
    const id = setInterval(fetchInfo, 3000);
    return () => clearInterval(id);
  }, [module?.id]);

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
                value={module.params.time_series_profile || Object.keys(profiles)[0] || ''}
                onChange={(e) =>
                  handleParamChange('time_series_profile', e.target.value)
                }
              >
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
          .filter(([key]) => {
            if (['time_series', 'time_series_profile'].includes(key)) return false;
            if (['house', 'building'].includes(module.type) && key === 'demand') return false;
            if (module.type === 'solar' && key === 'capacity') return false;
            return true;
          })
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
        <pre>{JSON.stringify(currentState || {}, null, 2)}</pre>
      </div>
      {Object.keys(history).length > 0 && (
        <div className="component-history">
          <ComponentChart
            data={Object.entries(history[field] || {})
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([, v]) => ({ value: Number(v) }))}
          />
          <select value={field} onChange={(e) => setField(e.target.value)}>
            {Object.keys(history).map((f) => (
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
