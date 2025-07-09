import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import api from './api/client';
import HeaderControls from './components/HeaderControls';
import ModulePalette from './components/ModulePalette';
import SimulationCanvas from './components/SimulationCanvas';
import CanvasItem from './components/CanvasItem';
import ComponentDetails from './components/ComponentDetails';
import FooterTabs from './components/FooterTabs';
import { FaHome, FaBuilding, FaSolarPanel, FaBatteryFull } from 'react-icons/fa';
import HighVoltageTowerIcon from './components/HighVoltageTowerIcon';
import ConnectionIndicator from './components/ConnectionIndicator';
import { useAppState } from './context/AppState';

function App() {
  const [stepEnabled, setStepEnabled] = useState(false);
  const [playEnabled, setPlayEnabled] = useState(false);
  const [pauseEnabled, setPauseEnabled] = useState(false);
  const [resetEnabled, setResetEnabled] = useState(false);
  const {
    state: { modules, selected },
    addModule,
    moveModule,
    updateModule,
    deleteModule,
    selectModule,
    addLog,
  } = useAppState();

  const defaults = {
    house: { params: { time_series_profile: 'house' }, state: {} },
    building: { params: { time_series_profile: 'hospital' }, state: {} },
    solar: { params: { time_series_profile: 'solar_1' }, state: {} },
    battery: {
      params: {
        min_capacity: 0,
        max_capacity: 50,
        max_charge: 10,
        max_discharge: 10,
        efficiency: 0.95,
        battery_cost_cycle: 0,
        init_soc: 0.5,
      },
      state: { soc: 50 },
    },
    grid: {
      params: {
        max_import: 100,
        max_export: 100,
        cost_per_unit_co2: 0,
        time_series_profile: 'grid_1',
      },
      state: {},
    },
  };

  const buildSetup = () => {
    const components = modules.map((m) => {
      let type;
      switch (m.type) {
        case 'grid':
          type = 'GridModule';
          break;
        case 'solar':
          type = 'RenewableModule';
          break;
        case 'battery':
          type = 'BatteryModule';
          break;
        case 'house':
        case 'building':
        default:
          type = 'LoadModule';
      }
      return { id: m.id, type, params: m.params };
    });

    return {
      horizon: 24,
      timestep: 1,
      add_unbalanced_module: true,
      loss_load_cost: 10,
      overgeneration_cost: 2,
      components,
    };
  };

  const handleDrop = async (item, left, top) => {
    if (item.id) {
      moveModule({ id: item.id, left, top });
    } else {
      const newModule = {
        id: uuidv4(),
        type: item.type,
        left,
        top,
        ...(defaults[item.type] || { params: {}, state: {} }),
      };

      try {
        const resp = await api.getProfiles(item.type);
        const names = Object.keys(resp || {});
        if (names.length > 0 && !newModule.params.time_series_profile) {
          newModule.params.time_series_profile = names[0];
        }
      } catch (_) {
        // ignore profile loading errors
      }

      addModule(newModule);
    }
  };

  const icons = {
    house: <FaHome />,
    building: <FaBuilding />,
    solar: <FaSolarPanel />,
    battery: <FaBatteryFull />,
    grid: <HighVoltageTowerIcon />,
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Delete' && selected) {
        deleteModule(selected);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selected]);

  useEffect(() => {
    setStepEnabled(false);
    setPlayEnabled(false);
    setPauseEnabled(false);
    setResetEnabled(false);
  }, [modules]);

  const handleSetup = async () => {
    let payload = null;
    try {
      payload = buildSetup();
      const response = await api.setupMicrogrid(payload);
      setResetEnabled(true);
      setStepEnabled(false);
      setPlayEnabled(false);
      setPauseEnabled(false);
      addLog({ method: 'POST', endpoint: '/setup', payload, response });
    } catch (err) {
      
      addLog({ method: 'POST', endpoint: '/setup', payload, response: { error: err.message } });
    }
  };

  const handleStatus = async () => {
    try {
      const response = await api.getStatus();
      addLog({ method: 'GET', endpoint: '/status', payload: null, response });
    } catch (err) {
      
      addLog({ method: 'GET', endpoint: '/status', payload: null, response: { error: err.message } });
    }
  };

  const handleRunStep = async () => {
    try {
      const actions = { actions: { grid: [0], battery: [0] } };
      const response = await api.runStep(actions);
      addLog({ method: 'POST', endpoint: '/run', payload: actions, response });
    } catch (err) {
      
      addLog({ method: 'POST', endpoint: '/run', payload: { actions: { grid: [0], battery: [0] } }, response: { error: err.message } });
    }
  };

  const handleGetComponents = async () => {
    try {
      const response = await api.getComponents();
      addLog({ method: 'GET', endpoint: '/components', payload: null, response });
    } catch (err) {
      
      addLog({ method: 'GET', endpoint: '/components', payload: null, response: { error: err.message } });
    }
  };

  const handleReset = async () => {
    try {
      const response = await api.resetModel();
      setStepEnabled(true);
      setPlayEnabled(true);
      setPauseEnabled(true);
      addLog({ method: 'POST', endpoint: '/reset', payload: null, response });
    } catch (err) {
      
      addLog({ method: 'POST', endpoint: '/reset', payload: null, response: { error: err.message } });
    }
  };

  return (
    <div className="app-container">
      <header className="header" id="section-1">
        <h1>Microgrid Frontend Demo</h1>
        <ConnectionIndicator />
        <HeaderControls
          onSetup={handleSetup}
          onRunStep={handleRunStep}
          onStatus={handleStatus}
          onPause={() => {}}
          onReset={handleReset}
          stepDisabled={!stepEnabled}
          playDisabled={!playEnabled}
          pauseDisabled={!pauseEnabled}
          resetDisabled={!resetEnabled}
        />
      </header>

      <aside className="tool-sidebar" id="section-2">
        <button
          onClick={() => {
            if (selected) {
              deleteModule(selected);
            }
          }}
        >
          Delete Selected
        </button>
        <ModulePalette />
      </aside>

      <SimulationCanvas onDrop={handleDrop}>
        {modules.map((m) => (
          <CanvasItem
            key={m.id}
            id={m.id}
            type={m.type}
            left={m.left}
            top={m.top}
            icon={icons[m.type]}
            onSelect={selectModule}
            isSelected={selected === m.id}
          />
        ))}
      </SimulationCanvas>

      <section className="details-panel" id="section-4">
        <ComponentDetails
          module={modules.find((m) => m.id === selected)}
          onChange={updateModule}
        />
      </section>

      <footer className="footer" id="section-5">
        <FooterTabs />
      </footer>
    </div>
  );
}

export default App;
