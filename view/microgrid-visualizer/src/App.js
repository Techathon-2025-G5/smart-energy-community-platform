import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import api from './api/client';
import sampleSetup from './api/sampleSetup';
import HeaderControls from './components/HeaderControls';
import ModulePalette from './components/ModulePalette';
import SimulationCanvas from './components/SimulationCanvas';
import CanvasItem from './components/CanvasItem';
import ComponentDetails from './components/ComponentDetails';
import EnergyBalance from './components/EnergyBalance';
import { FaHome, FaBuilding, FaSolarPanel, FaBatteryFull, FaPlug } from 'react-icons/fa';
import { useAppState } from './context/AppState';

function App() {
  const [result, setResult] = useState(null);
  const {
    state: { modules, selected },
    addModule,
    moveModule,
    updateModule,
    deleteModule,
    selectModule,
  } = useAppState();

  const defaults = {
    house: { params: { demand: 1 }, state: {} },
    building: { params: { demand: 2 }, state: {} },
    solar: { params: { capacity: 5 }, state: {} },
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
    grid: { params: { limit: 100 }, state: {} },
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
    grid: <FaPlug />,
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
      const response = await api.setupMicrogrid(sampleSetup);
      setResult(response);
    } catch (err) {
      setResult({ error: err.message });
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
        <pre>{result && JSON.stringify(result, null, 2)}</pre>
      </section>

      <footer className="footer" id="section-5">
        <EnergyBalance />
      </footer>
    </div>
  );
}

export default App;
