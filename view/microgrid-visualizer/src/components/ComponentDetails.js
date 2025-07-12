import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';
import ComponentChart from './ComponentChart';
import { parseLog } from '../utils/log';
import './ComponentDetails.css';

function ComponentDetails({ module, onChange, isSetup }) {
  const [profiles, setProfiles] = useState({});
  const [controllerOptions, setControllerOptions] = useState([]);
  const [currentState, setCurrentState] = useState({});
  const [history, setHistory] = useState({});
  const [field, setField] = useState('');
  const [activeTab, setActiveTab] = useState('Configuration');

  useEffect(() => {
    if (module && module.type) {
      if (module.type === 'controller') {
        api
          .getControllerOptions()
          .then((resp) => {
            const opts = Object.keys(resp || {});
            setControllerOptions(opts);
            if (opts.length > 0 && !module.params.name) {
              handleParamChange('name', opts[0]);
            }
          })
          .catch(() => setControllerOptions([]));
        setProfiles({});
      } else {
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
        setControllerOptions([]);
      }
    } else {
      setProfiles({});
      setControllerOptions([]);
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
        const [type, idxStr] = (module.backendId || '').split('_');
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

  useEffect(() => {
    if (!isSetup) {
      setActiveTab('Configuration');
    }
  }, [isSetup]);

  if (!module) {
    return <div className="component-details">Select a component</div>;
  }

  const handleParamChange = (key, value) => {
    const newParams = { ...module.params, [key]: value };
    onChange({ ...module, params: newParams });
  };

  const configContent = (
    <>
      <h3>{module.type} parameters</h3>
      <form>
        {module.type === 'controller' && (
          <div key="controller-name">
            <label>
              controller:
              <select
                value={module.params.name || controllerOptions[0] || ''}
                onChange={(e) => handleParamChange('name', e.target.value)}
                disabled={isSetup}
              >
                {controllerOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {Object.keys(profiles).length > 0 && module.type !== 'controller' && (
          <div key="profile">
            <label>
              profile:
              <select
                value={module.params.time_series_profile || Object.keys(profiles)[0] || ''}
                onChange={(e) =>
                  handleParamChange('time_series_profile', e.target.value)
                }
                disabled={isSetup}
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
            if (module.type === 'controller' && key === 'name') return false;
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
                disabled={isSetup}
              />
            </label>
          </div>
        ))}
      </form>
    </>
  );

  const statusContent = (
    <>
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
    </>
  );

  return (
    <div className="component-details">
      <div className="details-tabs">
        <div className="tab-headers">
          <button
            className={activeTab === 'Configuration' ? 'active' : ''}
            onClick={() => setActiveTab('Configuration')}
          >
            Configuration
          </button>
          <button
            className={activeTab === 'Status' ? 'active' : ''}
            onClick={() => isSetup && setActiveTab('Status')}
            disabled={!isSetup}
          >
            Status
          </button>
        </div>
        <div className="tab-content">
          {activeTab === 'Configuration' ? configContent : statusContent}
        </div>
      </div>
    </div>
  );
}

ComponentDetails.propTypes = {
  module: PropTypes.shape({
    id: PropTypes.string,
    backendId: PropTypes.string,
    type: PropTypes.string,
    params: PropTypes.object,
    state: PropTypes.object,
  }),
  onChange: PropTypes.func.isRequired,
  isSetup: PropTypes.bool,
};

export default ComponentDetails;

ComponentDetails.defaultProps = {
  isSetup: false,
};
