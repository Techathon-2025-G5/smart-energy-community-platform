import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';
import ComponentChart from './ComponentChart';
import BatteryStatus from './BatteryStatus';
import { parseLog, getComponentState } from '../utils/log';
import './ComponentDetails.css';
import HouseStatus from "./HouseStatus";
import BuildingStatus from "./BuildingStatus";
import SolarStatus from "./SolarStatus";
import GridStatus from "./GridStatus";
import ControllerStatus from "./ControllerStatus";
import { useAppState } from '../context/AppState';

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

function ComponentDetails({
  module,
  onChange,
  isSetup,
  manualMode,
  manualValues,
  onManualChange,
  onGridAdjust,
  previewValues,
  previewLoadMet,
  actualValues,
  statusData,
}) {
  const [profiles, setProfiles] = useState({});
  const [controllerOptions, setControllerOptions] = useState([]);
  const [currentState, setCurrentState] = useState({});
  const [history, setHistory] = useState({});
  const [field, setField] = useState('');
  const [activeTab, setActiveTab] = useState('Configuration');
  const {
    state: { modules },
  } = useAppState();

  const getDefaultPriorityList = () => {
    const bats = modules
      .filter((m) => m.type === 'battery')
      .sort((a, b) => (a.idx || 0) - (b.idx || 0))
      .map((b) => ({ module: 'battery', index: (b.idx || 1) - 1 }));
    const grids = modules
      .filter((m) => m.type === 'grid')
      .sort((a, b) => (a.idx || 0) - (b.idx || 0))
      .map((g) => ({ module: 'grid', index: (g.idx || 1) - 1 }));
    return [...bats, ...grids];
  };

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
        const [status, log] = await Promise.all([api.getStatus(), api.getLog()]);
        const parsed = parseLog(log);
        const [type, idxStr] = (module.backendId || '').split('_');
        const idx = parseInt(idxStr, 10);
        const hist = parsed[type]?.[idx] || {};
        setHistory(hist);

        const state = getComponentState(status, log, type, idx, manualMode);
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
  }, [module?.id, manualMode]);

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
              newParams[f] = 2005;
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

  const priorityList = module.params.priority_list || getDefaultPriorityList();

  const movePriority = (from, to) => {
    const list = [...priorityList];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    handleParamChange('priority_list', list);
  };

  const moveUp = (idx) => {
    if (idx > 0) movePriority(idx, idx - 1);
  };

  const moveDown = (idx) => {
    if (idx < priorityList.length - 1) movePriority(idx, idx + 1);
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
        {module.type === 'controller' &&
          (module.params.name || controllerOptions[0]) === 'rule_based' && (
            <div className="priority-list" key="priority-list">
              <label>Priority list:</label>
              <ul>
                {priorityList.map((item, idx) => (
                  <li key={`${item.module}-${item.index}`}>
                    {item.module === 'battery'
                      ? `Battery ${item.index + 1}`
                      : 'Grid'}
                    <span className="priority-buttons">
                      <button
                        type="button"
                        onClick={() => moveUp(idx)}
                        disabled={isSetup || idx === 0}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(idx)}
                        disabled={isSetup || idx === priorityList.length - 1}
                      >
                        ▼
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
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
            if (module.type === 'controller' && (key === 'name' || key === 'priority_list')) return false;
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
          manualMode={manualMode}
          sliderValue={(() => {
            const idxVal = module.backendId
              ? parseInt(module.backendId.split('_')[1], 10)
              : (module.idx || 1) - 1;
            return manualValues.battery[idxVal];
          })()}
        />
      );
      break;
    case 'house':
      statusContent = (
        <HouseStatus
          module={module}
          history={history}
          currentState={currentState}
          previewValue={previewLoadMet[module.id]}
        />
      );
      break;
    case 'building':
      statusContent = (
        <BuildingStatus
          module={module}
          history={history}
          currentState={currentState}
          previewValue={previewLoadMet[module.id]}
        />
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
        <ControllerStatus
          history={history}
          currentState={currentState}
          module={module}
          manualMode={manualMode}
          manualValues={manualValues}
          onManualChange={onManualChange}
          onGridAdjust={onGridAdjust}
          previewValues={previewValues}
          actualValues={actualValues}
          statusData={statusData}
        />
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
  manualMode: PropTypes.bool,
  manualValues: PropTypes.shape({
    battery: PropTypes.arrayOf(PropTypes.number),
    grid: PropTypes.arrayOf(PropTypes.number),
  }),
  onManualChange: PropTypes.func,
  onGridAdjust: PropTypes.func,
  previewValues: PropTypes.shape({
    grid: PropTypes.number,
    costGrid: PropTypes.number,
    batteries: PropTypes.number,
    costBatteries: PropTypes.number,
    energyBalance: PropTypes.number,
    moneyBalance: PropTypes.number,
  }),
  previewLoadMet: PropTypes.objectOf(PropTypes.number),
  actualValues: PropTypes.shape({
    grid: PropTypes.number,
    costGrid: PropTypes.number,
    batteries: PropTypes.number,
    costBatteries: PropTypes.number,
    energyBalance: PropTypes.number,
    moneyBalance: PropTypes.number,
  }),
  statusData: PropTypes.object,
};

export default ComponentDetails;

ComponentDetails.defaultProps = {
  isSetup: false,
  manualMode: false,
  manualValues: { battery: [], grid: [] },
  onManualChange: () => {},
  onGridAdjust: () => {},
  previewValues: null,
  previewLoadMet: {},
  actualValues: null,
  statusData: null,
};
