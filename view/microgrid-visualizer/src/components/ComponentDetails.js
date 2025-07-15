import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';
import ComponentChart from './ComponentChart';
import BatteryStatus from './BatteryStatus';
import { parseLog } from '../utils/log';
import './ComponentDetails.css';
import HouseStatus from "./HouseStatus";
import BuildingStatus from "./BuildingStatus";
import SolarStatus from "./SolarStatus";
import GridStatus from "./GridStatus";
import ControllerStatus from "./ControllerStatus";

const FIELD_LABELS = {
  profile: 'Profile',
  max_import: 'Max. import',
  max_export: 'Max. export',
  cost_per_unit_co2: 'Cost / CO2',
  controller: 'Controller',
  min_capacity: 'Min. capacity',
  max_capacity: 'Max. capacity',
  max_charge: 'Max. charge',
  max_discharge: 'Max. discharge',
  efficiency: 'Efficiency',
  battery_cost_cycle: 'Cost cycle',
  init_soc: 'Initial SoC',
  lat: 'Latitude',
  lon: 'Longitude',
  peakpower: 'Peak power',
  loss: 'Loss',
  angle: 'Ángulo de inclinación',
  aspect: 'Azimuth',
  mountingplace: 'Type of mounting',
  pvtechchoice: 'PV technology',
  year: 'Year',
};

const PVGIS_FIELDS = [
  'lat',
  'lon',
  'peakpower',
  'loss',
  'angle',
  'aspect',
  'mountingplace',
  'pvtechchoice',
  'year',
];

function getTitle(module) {
  if (!module) return '';
  const idx = module.backendId
    ? parseInt(module.backendId.split('_')[1], 10) + 1
    : module.idx || 1;
  switch (module.type) {
    case 'battery':
      return `Battery ${idx}`;
    case 'solar':
      return `Solar Panel ${idx}`;
    case 'house':
      return `House ${idx}`;
    case 'building':
      return `Building ${idx}`;
    case 'grid':
      return 'Grid';
    case 'controller':
      return 'Controller';
    default:
      return module.type;
  }
}

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

  const handleProfileSelect = (profile) => {
    const newParams = { ...module.params, time_series_profile: profile };
    if (profile === 'PVGIS') {
      PVGIS_FIELDS.forEach((f) => {
        if (!(f in newParams)) {
          switch (f) {
            case 'peakpower':
              newParams[f] = 1;
              break;
            case 'loss':
              newParams[f] = 14;
              break;
            case 'angle':
              newParams[f] = 35;
              break;
            case 'aspect':
              newParams[f] = 0;
              break;
            case 'mountingplace':
              newParams[f] = 'free';
              break;
            case 'pvtechchoice':
              newParams[f] = 'crystSi';
              break;
            case 'year':
              newParams[f] = new Date().getFullYear();
              break;
            default:
              newParams[f] = 0;
          }
        }
      });
    } else {
      PVGIS_FIELDS.forEach((f) => {
        if (f in newParams) delete newParams[f];
      });
    }
    onChange({ ...module, params: newParams });
  };

  const configContent = (
    <>
      <h3>{getTitle(module)}</h3>
      <form>
        {module.type === 'controller' && (
          <div key="controller-name">
            <label>
              {FIELD_LABELS.controller}:
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
              {FIELD_LABELS.profile}:
              <select
                value={module.params.time_series_profile || Object.keys(profiles)[0] || ''}
                onChange={(e) => handleProfileSelect(e.target.value)}
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
            if (PVGIS_FIELDS.includes(key)) return module.params.time_series_profile === 'PVGIS';
            if (['house', 'building'].includes(module.type) && key === 'demand') return false;
            if (module.type === 'solar' && key === 'capacity') return false;
            if (module.type === 'controller' && key === 'name') return false;
            return true;
          })
          .map(([key, value]) => (
          <div key={key}>
            {module.type === 'battery' && ['efficiency', 'init_soc'].includes(key) ? (
              <label>
                {FIELD_LABELS[key] || key}: {Number(value)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={value}
                  onChange={(e) => handleParamChange(key, e.target.value)}
                  disabled={isSetup}
                />
              </label>
            ) : PVGIS_FIELDS.includes(key) ? (
              <label>
                {FIELD_LABELS[key] || key}:
                {['loss', 'angle', 'aspect'].includes(key) && (
                  <> {value}
                    {key === 'loss' ? '%' : '°'}
                  </>
                )}
                {key === 'loss' ? (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    disabled={isSetup}
                  />
                ) : key === 'angle' ? (
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    disabled={isSetup}
                  />
                ) : key === 'aspect' ? (
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    disabled={isSetup}
                  />
                ) : key === 'mountingplace' ? (
                  <select
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    disabled={isSetup}
                  >
                    <option value="free">free</option>
                    <option value="building">building</option>
                  </select>
                ) : key === 'pvtechchoice' ? (
                  <select
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    disabled={isSetup}
                  >
                    <option value="crystSi">crystSi</option>
                    <option value="CIS">CIS</option>
                    <option value="CdTe">CdTe</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                ) : key === 'year' ? (
                  <select
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    disabled={isSetup}
                  >
                    {Array.from({ length: 2023 - 2005 + 1 }, (_, i) => 2005 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    disabled={isSetup}
                  />
                )}
              </label>
            ) : (
              <label>
                {FIELD_LABELS[key] || key}:
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleParamChange(key, e.target.value)}
                  disabled={isSetup}
                />
              </label>
            )}
          </div>
        ))}
      </form>
    </>
  );

  let statusContent;
  switch (module.type) {
    case 'battery':
      statusContent = (
        <BatteryStatus
          module={module}
          history={history}
          currentState={currentState}
        />
      );
      break;
    case 'house':
      statusContent = (
        <HouseStatus module={module} history={history} currentState={currentState} />
      );
      break;
    case 'building':
      statusContent = (
        <BuildingStatus module={module} history={history} currentState={currentState} />
      );
      break;
    case 'solar':
      statusContent = (
        <SolarStatus
          module={module}
          history={history}
          currentState={currentState}
        />
      );
      break;
    case 'grid':
      statusContent = (
        <GridStatus history={history} currentState={currentState} />
      );
      break;
    case 'controller':
      statusContent = (
        <ControllerStatus history={history} currentState={currentState} />
      );
      break;
    default:
      statusContent = (
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
  }

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
