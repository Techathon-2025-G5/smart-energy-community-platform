import { useState } from 'react';
import { useDrop } from 'react-dnd';
import './App.css';
import api from './api/client';
import sampleSetup from './api/sampleSetup';
import HeaderControls from './components/HeaderControls';
import ModulePalette from './components/ModulePalette';
import { FaHome, FaBuilding, FaSolarPanel, FaBatteryFull, FaPlug } from 'react-icons/fa';

function App() {
  const [result, setResult] = useState(null);
  const [dropped, setDropped] = useState([]);

  const [, drop] = useDrop(() => ({
    accept: 'module',
    drop: (item) => setDropped((prev) => [...prev, item.type]),
  }));

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
        <ModulePalette />
      </aside>

      <main ref={drop} className="drawing-area" id="section-3">
        {dropped.map((type, idx) => {
          const icons = {
            house: <FaHome />,
            building: <FaBuilding />,
            solar: <FaSolarPanel />,
            battery: <FaBatteryFull />,
            grid: <FaPlug />,
          };
          return (
            <span key={idx} className="dropped-icon">
              {icons[type]}
            </span>
          );
        })}
      </main>

      <section className="details-panel" id="section-4">
        <pre>{result && JSON.stringify(result, null, 2)}</pre>
      </section>

      <footer className="footer" id="section-5">
        {/* Pie de página */}
      </footer>
    </div>
  );
}

export default App;
