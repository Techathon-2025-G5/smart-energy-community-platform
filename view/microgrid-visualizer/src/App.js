import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import api from './api/client';
import HeaderControls from './components/HeaderControls';
import ModulePalette from './components/ModulePalette';
import SimulationCanvas from './components/SimulationCanvas';
import CanvasItem from './components/CanvasItem';
import ComponentDetails from './components/ComponentDetails';
import EnergyBalance from './components/EnergyBalance';
import { FaHome, FaBuilding, FaSolarPanel, FaBatteryFull } from 'react-icons/fa';
import HighVoltageTowerIcon from './components/HighVoltageTowerIcon';
import { useAppState } from './context/AppState';

function App() {
  const [result, setResult] = useState(null);
  const [setupStatus, setSetupStatus] = useState('');
  const {
    state: { modules, selected },
    addModule,
    moveModule,
    updateModule,
    deleteModule,
    selectModule,
  } = useAppState();

  const defaults = {
    house: { params: {}, state: {} },
    building: { params: {}, state: {} },
    solar: { params: {}, state: {} },
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

  const handleDrop = (item, left, top) => {
    if (item.id) {
      moveModule({ id: item.id, left, top });
    } else {
      addModule({
        id: uuidv4(),
        type: item.type,
        left,
        top,
        ...(defaults[item.type] || { params: {}, state: {} }),
      });
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

  const handleSetup = async () => {
    try {
      const payload = buildSetup();
      const response = await api.setupMicrogrid(payload);
      setResult(response);
      setSetupStatus('Setup completed successfully');
    } catch (err) {
      setResult({ error: err.message });
      setSetupStatus('Setup failed');
    }
  };

  const handleStatus = async () => {
    try {
      const response = await api.getStatus();
      setResult(response);
    } catch (err) {
      setResult({ error: err.message });
    }
  };

  const handleRunStep = async () => {
    try {
      const actions = { actions: { grid: [0], battery: [0] } };
      const response = await api.runStep(actions);
      setResult(response);
    } catch (err) {
      setResult({ error: err.message });
    }
  };

  const handleGetComponents = async () => {
    try {
      const response = await api.getComponents();
      setResult(response);
    } catch (err) {
      setResult({ error: err.message });
    }
  };

  const handleReset = async () => {
    try {
      const response = await api.resetModel();
      setResult(response);
    } catch (err) {
      setResult({ error: err.message });
    }
  };

  return (
    <div className="app-container">
      <header className="header" id="section-1">
        <h1>Microgrid Frontend Demo</h1>
        <HeaderControls
          onSetup={handleSetup}
          onRunStep={handleRunStep}
          onStatus={handleStatus}
          onGetComponents={handleGetComponents}
          onReset={handleReset}
        />
      </header>

      <aside className="tool-sidebar" id="section-2">
        <button onClick={handleSetup}>Setup Microgrid</button>
        <button onClick={handleStatus}>Get Status</button>
        <button onClick={handleRunStep}>Run Step</button>
        <button onClick={handleGetComponents}>Get Components</button>
        <button onClick={handleReset}>Reset Model</button>
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
        {setupStatus && <p>{setupStatus}</p>}
        <pre>{result && JSON.stringify(result, null, 2)}</pre>
      </section>

      <footer className="footer" id="section-5">
        <EnergyBalance />
      </footer>
    </div>
  );
}

export default App;
