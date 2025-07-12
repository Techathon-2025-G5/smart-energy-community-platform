import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import api from './api/client';
import HeaderControls from './components/HeaderControls';
import ModulePalette from './components/ModulePalette';
import SimulationCanvas from './components/SimulationCanvas';
import CanvasItem from './components/CanvasItem';
import ComponentDetails from './components/ComponentDetails';
import FooterTabs from './components/FooterTabs';
import houseImg from './assets/house.png';
import buildingImg from './assets/building.png';
import hospitalImg from './assets/hospital.png';
import officeImg from './assets/office.png';
import hotelImg from './assets/hotel.png';
import schoolImg from './assets/school.png';
import restaurantImg from './assets/restaurant.png';
import solarImg from './assets/solar_panel.png';
import batteryImg from './assets/battery.png';
import batterySoc0Img from './assets/battery_soc_0.png';
import batterySoc25Img from './assets/battery_soc_25.png';
import batterySoc50Img from './assets/battery_soc_50.png';
import batterySoc75Img from './assets/battery_soc_75.png';
import batterySoc100Img from './assets/battery_soc_100.png';
import gridImg from './assets/grid.png';
import gridOnImg from './assets/grid_on.png';
import gridOffImg from './assets/grid_off.png';
import controllerImg from './assets/controller.png';
import { useAppState } from './context/AppState';
import { isAllowed, cellKey } from './utils/placement';

function App() {
  const [stepEnabled, setStepEnabled] = useState(false);
  const [playEnabled, setPlayEnabled] = useState(false);
  const [pauseEnabled, setPauseEnabled] = useState(false);
  const [resetEnabled, setResetEnabled] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [isSetup, setIsSetup] = useState(false);
  const intervalRef = useRef(null);
  const {
    state: { modules, selected },
    addModule,
    moveModule,
    updateModule,
    setBackendId,
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
    controller: {
      params: { name: '' },
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
        case 'controller':
          type = 'Controller';
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

  const handleDrop = async (item, left, top, row, col, cellSize) => {
    if (!isAllowed(item.type, row, col)) {
      return;
    }
    const posKey = cellKey(row, col);
    const occupied = modules.find((m) => {
      const c = Math.round(m.left / cellSize) + 1;
      const r = 8 - Math.round(m.top / cellSize);
      return cellKey(r, c) === posKey;
    });
    if (occupied && (!item.id || occupied.id !== item.id)) {
      return;
    }

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
        if (item.type === 'controller') {
          const opts = await api.getControllerOptions();
          const names = Object.keys(opts || {});
          if (names.length > 0 && !newModule.params.name) {
            newModule.params.name = names[0];
          }
        } else {
          const resp = await api.getProfiles(item.type);
          const names = Object.keys(resp || {});
          if (names.length > 0 && !newModule.params.time_series_profile) {
            newModule.params.time_series_profile = names[0];
          }
        }
      } catch (_) {
        // ignore profile loading errors
      }

      addModule(newModule);
    }
  };

  const getBuildingImage = (profile) => {
    if (!profile) return buildingImg;
    const p = profile.toLowerCase();
    if (p.includes('hospital')) return hospitalImg;
    if (p.includes('office')) return officeImg;
    if (p.includes('hotel')) return hotelImg;
    if (p.includes('school')) return schoolImg;
    if (p.includes('restaurant')) return restaurantImg;
    return buildingImg;
  };

  const getBatteryImage = (soc) => {
    if (typeof soc !== 'number') return batteryImg;
    let value = soc;
    if (value > 1) value /= 100; // handle 0-100 range
    if (value < 0.1) return batterySoc0Img;
    if (value < 0.3) return batterySoc25Img;
    if (value < 0.6) return batterySoc50Img;
    if (value < 0.9) return batterySoc75Img;
    return batterySoc100Img;
  };

  const getIcon = (module) => {
    switch (module.type) {
      case 'house':
        return <img src={houseImg} alt="house" />;
      case 'building':
        return (
          <img
            src={getBuildingImage(module.params?.time_series_profile)}
            alt="building"
          />
        );
      case 'solar':
        return <img src={solarImg} alt="solar" />;
      case 'battery':
        return <img src={getBatteryImage(module.state?.soc)} alt="battery" />;
      case 'grid': {
        const status = module.state?.grid_status_current;
        if (status === 0) return <img src={gridOffImg} alt="grid" />;
        if (status === 1) return <img src={gridOnImg} alt="grid" />;
        return <img src={gridImg} alt="grid" />;
      }
      case 'controller':
        return <img src={controllerImg} alt="controller" />;
      default:
        return null;
    }
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
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setStepEnabled(false);
    setPlayEnabled(false);
    setPauseEnabled(false);
    setResetEnabled(false);
    setIsSetup(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [modules.length]);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await api.getStatus();
        const batteryStates = status?.battery || [];
        const gridStates = status?.grid || [];
        modules.forEach((m) => {
          if (!m.backendId) return;
          const idx = parseInt(m.backendId.split('_')[1], 10);
          if (m.type === 'battery') {
            const soc = batteryStates[idx]?.soc;
            if (typeof soc === 'number' && soc !== m.state?.soc) {
              updateModule({ ...m, state: { ...m.state, soc } });
            }
          } else if (m.type === 'grid') {
            const gs = gridStates[idx]?.grid_status_current;
            if (typeof gs === 'number' && gs !== m.state?.grid_status_current) {
              updateModule({ ...m, state: { ...m.state, grid_status_current: gs } });
            }
          }
        });
      } catch (_) {
        /* ignore errors */
      }
    };
    updateStatus();
    const id = setInterval(updateStatus, 3000);
    return () => clearInterval(id);
  }, [modules.map((m) => m.backendId).join('')]);

  const handleSetup = async () => {
    let payload = null;
    try {
      payload = buildSetup();
      const response = await api.setupMicrogrid(payload);
      const resetResponse = await api.resetModel();
      try {
        const comps = await api.getComponents();
        const byType = {};
        comps.forEach((c) => {
          const [t] = c.id.split('_');
          if (!byType[t]) byType[t] = [];
          byType[t].push(c.id);
        });
        const typeMap = {
          house: 'load',
          building: 'load',
          solar: 'renewable',
          battery: 'battery',
          grid: 'grid',
        };
        modules.forEach((m) => {
          const key = typeMap[m.type];
          const bid = byType[key] && byType[key].shift();
          if (bid) setBackendId(m.id, bid);
        });
      } catch (_) {
        // ignore component fetch errors
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const hasController = modules.some((m) => m.type === 'controller');
      setStepCount(0);
      setResetEnabled(true);
      setStepEnabled(true);
      setPlayEnabled(hasController);
      setPauseEnabled(false);
      setIsSetup(true);
      addLog({ method: 'POST', endpoint: '/setup', payload, response });
      addLog({ method: 'POST', endpoint: '/reset', payload: null, response: resetResponse });
    } catch (err) {
      
      addLog({ method: 'POST', endpoint: '/setup', payload, response: { error: err.message } });
    }
  };

  const handlePlay = async () => {
    if (intervalRef.current) return;
    setPlayEnabled(false);
    setPauseEnabled(true);
    intervalRef.current = setInterval(async () => {
      try {
        const response = await api.runStep();
        addLog({ method: 'POST', endpoint: '/run', payload: null, response });
        setStepCount((s) => s + 1);
      } catch (err) {
        addLog({ method: 'POST', endpoint: '/run', payload: null, response: { error: err.message } });
      }
    }, 2000);
  };

  const handlePause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlayEnabled(true);
    setPauseEnabled(false);
  };

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStepEnabled(false);
    setPlayEnabled(false);
    setPauseEnabled(false);
    setResetEnabled(false);
    setIsSetup(false);
  };

  const handleRunStep = async () => {
    try {
      const actions = { actions: { grid: [0], battery: [0] } };
      const response = await api.runStep(actions);
      addLog({ method: 'POST', endpoint: '/run', payload: actions, response });
      setStepCount((s) => s + 1);
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
      const hasController = modules.some((m) => m.type === 'controller');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStepCount(0);
      setStepEnabled(true);
      setPlayEnabled(hasController);
      setPauseEnabled(false);
      addLog({ method: 'POST', endpoint: '/reset', payload: null, response });
    } catch (err) {
      
      addLog({ method: 'POST', endpoint: '/reset', payload: null, response: { error: err.message } });
    }
  };

  return (
    <div className="app-container">
      <header className="header" id="section-1">
        <h1>Renewable Energy Community Simulator</h1>
        <HeaderControls
            onSetup={handleSetup}
            onRunStep={handleRunStep}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onReset={handleReset}
            stepDisabled={!stepEnabled}
            playDisabled={!playEnabled}
            pauseDisabled={!pauseEnabled}
            stopDisabled={!isSetup}
            resetDisabled={!resetEnabled}
            step={stepCount}
          />
      </header>

      <aside className="tool-sidebar" id="section-2">
        <ModulePalette />
      </aside>

      <SimulationCanvas
        onDrop={handleDrop}
        step={stepCount}
        stepEnabled={stepEnabled}
        onCanvasClick={() => selectModule(null)}
      >
        {modules.map((m) => (
          <CanvasItem
            key={m.id}
            id={m.id}
            type={m.type}
            left={m.left}
            top={m.top}
            icon={getIcon(m)}
            onSelect={selectModule}
            isSelected={selected === m.id}
          />
        ))}
      </SimulationCanvas>

      <section className="details-panel" id="section-4">
        <ComponentDetails
          module={modules.find((m) => m.id === selected)}
          onChange={updateModule}
          isSetup={isSetup}
        />
      </section>

      <footer className="footer" id="section-5">
        <FooterTabs />
      </footer>
    </div>
  );
}

export default App;
