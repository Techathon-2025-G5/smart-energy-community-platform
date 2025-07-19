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
import HelpPopup from './components/HelpPopup';
import houseImg from './assets/house.png';
import buildingImg from './assets/building.png';
import hospitalImg from './assets/hospital.png';
import officeImg from './assets/office.png';
import hotelImg from './assets/hotel.png';
import schoolImg from './assets/school.png';
import restaurantImg from './assets/restaurant.png';
import houseOnImg from './assets/house_on.png';
import houseUnmetImg from './assets/house_unmet.png';
import hospitalOnImg from './assets/hospital_on.png';
import hospitalUnmetImg from './assets/hospital_unmet.png';
import officeOnImg from './assets/office_on.png';
import officeUnmetImg from './assets/office_unmet.png';
import hotelOnImg from './assets/hotel_on.png';
import hotelUnmetImg from './assets/hotel_unmet.png';
import schoolOnImg from './assets/school_on.png';
import schoolUnmetImg from './assets/school_unmet.png';
import restaurantOnImg from './assets/restaurant_on.png';
import restaurantUnmetImg from './assets/restaurant_unmet.png';
import solarImg from './assets/solar_panel.png';
import batteryImg from './assets/battery.png';

import gridImg from './assets/grid.png';
import gridOnImg from './assets/grid_on.png';
import gridOffImg from './assets/grid_off.png';
import controllerImg from './assets/controller.png';
import { useAppState } from './context/AppState';
import { DEFAULT_LAT, DEFAULT_LON } from './components/MapSelector';
import { isAllowed, cellKey } from './utils/placement';
import { buildCurrentStatus } from './utils/log';
import { getBatteryImage } from './utils/battery';

function App() {
  const [stepEnabled, setStepEnabled] = useState(false);
  const [playEnabled, setPlayEnabled] = useState(false);
  const [pauseEnabled, setPauseEnabled] = useState(false);
  const [resetEnabled, setResetEnabled] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [isSetup, setIsSetup] = useState(false);
  const [microgridConfig, setMicrogridConfig] = useState({
    loss_load_cost: 10,
    overgeneration_cost: 2,
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
  });
  const [manualActions, setManualActions] = useState({ battery: [], grid: [] });
  const [componentStatus, setComponentStatus] = useState({});
  const [previewValues, setPreviewValues] = useState(null);
  const [previewLoadMet, setPreviewLoadMet] = useState({});
  const [actualValues, setActualValues] = useState(null);
  const [currentTotals, setCurrentTotals] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const intervalRef = useRef(null);
  const {
    state: { modules, selected, status: statusData, log: logData },
    addModule,
    moveModule,
    updateModule,
    setBackendId,
    deleteModule,
    selectModule,
    addLog,
    updateStatusLog,
  } = useAppState();

  const manualMode =
    modules.find((m) => m.type === 'controller')?.params?.name === 'manual';

  const getPreviewState = (module) => {
    if (!manualMode) return module.state || {};
    const typeMap = {
      house: 'load',
      building: 'load',
      solar: 'renewable',
      battery: 'battery',
      grid: 'grid',
    };
    const key = typeMap[module.type];
    if (!key) return module.state || {};
    const idx = (module.idx || 1) - 1;
    return componentStatus[key]?.[idx] || module.state || {};
  };

  // Slider values use the opposite sign convention of the backend
  const buildManualPayload = () => ({
    actions: {
      grid: manualActions.grid.map((v) => -v),
      battery: manualActions.battery.map((v) => -v),
    },
  });

  const handleManualChange = (type, index, value) => {
    setManualActions((prev) => {
      const next = { ...prev };
      const arr = [...(next[type] || [])];
      arr[index] = value;
      next[type] = arr;
      return next;
    });
  };

  const handleGridAdjust = async (index) => {
    try {
      const states = buildCurrentStatus(
        statusData,
        logData || {}
      );

      const renewable = Object.values(states.renewable || {}).reduce(
        (acc, s) => acc + Number(s.renewable_current ?? 0),
        0
      );
      const loads = Object.values(states.load || {}).reduce(
        (acc, s) => acc + Math.abs(Number(s.load_current ?? 0)),
        0
      );

      const batteryMods = modules
        .filter((m) => m.type === 'battery')
        .sort((a, b) => (a.idx || 0) - (b.idx || 0));
      let batCharge = 0;
      let batDischarge = 0;
      batteryMods.forEach((m, i) => {
        const state = states.battery?.[i] || {};
        const efficiency = Number(m.params?.efficiency || 1);
        batCharge += Number(state.charge_amount ?? 0);
        batDischarge += Number(state.discharge_amount ?? 0) * efficiency;

        const manual = manualActions.battery?.[i] ?? 0;
        if (manual > 0) batCharge += manual;
        if (manual < 0) batDischarge += -manual * efficiency;
      });

      const baseBalance = renewable + batDischarge - loads - batCharge;

      const gridMods = modules
        .filter((m) => m.type === 'grid')
        .sort((a, b) => (a.idx || 0) - (b.idx || 0));
      const grid = gridMods[index];
      if (!grid) return;
      const maxImport = Number(grid.params?.max_import || 0);
      const maxExport = Number(grid.params?.max_export || 0);

      let value = baseBalance;
      if (value > 0) value = Math.min(maxExport, value);
      if (value < -maxImport) value = -maxImport;
      value = Number(value.toFixed(2));

      setManualActions((prev) => {
        const next = { ...prev };
        const arr = [...(next.grid || [])];
        arr[index] = value;
        next.grid = arr;
        return next;
      });
    } catch (_) {
      // ignore errors
    }
  };

  const resetManualActions = () => {
    const bats = modules
      .filter((m) => m.type === 'battery')
      .sort((a, b) => (a.idx || 0) - (b.idx || 0))
      .map(() => 0);
    const grids = modules
      .filter((m) => m.type === 'grid')
      .sort((a, b) => (a.idx || 0) - (b.idx || 0))
      .map(() => 0);
    setManualActions({ battery: bats, grid: grids });
  };

  const defaults = {
    house: { params: { time_series_profile: 'house' }, state: {} },
    building: { params: { time_series_profile: 'large_office' }, state: {} },
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
    const parseParams = (params) => {
      const parsed = {};
      Object.entries(params || {}).forEach(([k, v]) => {
        if (typeof v === 'string') {
          const num = Number(v);
          parsed[k] = Number.isNaN(num) ? v : num;
        } else {
          parsed[k] = v;
        }
      });
      return parsed;
    };

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
      return { id: m.id, type, params: parseParams(m.params) };
    });

    const setup = {
      horizon: 24,
      timestep: 1,
      add_unbalanced_module: true,
      loss_load_cost: parseFloat(microgridConfig.loss_load_cost),
      overgeneration_cost: parseFloat(microgridConfig.overgeneration_cost),
      lat: parseFloat(microgridConfig.lat),
      lon: parseFloat(microgridConfig.lon),
      components,
    };

    const controller = modules.find((m) => m.type === 'controller');
    if (controller && controller.params?.name === 'rule_based') {
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
      const list =
        controller.params.priority_list && controller.params.priority_list.length
          ? controller.params.priority_list
          : getDefaultPriorityList();
      setup.controller_config = { priority_list: list };
    }

    const lat = parseFloat(microgridConfig.lat);
    if (!Number.isNaN(lat)) setup.lat = lat;
    const lon = parseFloat(microgridConfig.lon);
    if (!Number.isNaN(lon)) setup.lon = lon;

    return setup;
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
        idx:
          ['house', 'building'].includes(item.type)
            ? modules.filter((m) => ['house', 'building'].includes(m.type)).length + 1
            : modules.filter((m) => m.type === item.type).length + 1,
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

  const getBuildingImage = (profile, suffix = '') => {
    if (!profile) return buildingImg;
    const p = profile.toLowerCase();
    if (p.includes('office')) {
      if (suffix === '_on') return officeOnImg;
      if (suffix === '_unmet') return officeUnmetImg;
      return officeImg;
    }
    if (p.includes('hospital')) {
      if (suffix === '_on') return hospitalOnImg;
      if (suffix === '_unmet') return hospitalUnmetImg;
      return hospitalImg;
    }
    if (p.includes('hotel')) {
      if (suffix === '_on') return hotelOnImg;
      if (suffix === '_unmet') return hotelUnmetImg;
      return hotelImg;
    }
    if (p.includes('school')) {
      if (suffix === '_on') return schoolOnImg;
      if (suffix === '_unmet') return schoolUnmetImg;
      return schoolImg;
    }
    if (p.includes('restaurant')) {
      if (suffix === '_on') return restaurantOnImg;
      if (suffix === '_unmet') return restaurantUnmetImg;
      return restaurantImg;
    }
    return buildingImg;
  };


  const getIcon = (module) => {
    const state = getPreviewState(module);
    switch (module.type) {
      case 'house': {
        const cur = Math.abs(Number(state.load_current ?? 0));
        const met = Number(state.load_met ?? 0);
        if (cur > 0 && !Number.isNaN(met)) {
          if (Math.abs(cur - met) < 0.001) return <img src={houseOnImg} alt="house" />;
          if (met < cur) return <img src={houseUnmetImg} alt="house" />;
        }
        return <img src={houseImg} alt="house" />;
      }
      case 'building':
        return (
          <img
            src={getBuildingImage(
              module.params?.time_series_profile,
              (() => {
                const cur = Math.abs(Number(state.load_current ?? 0));
                const met = Number(state.load_met ?? 0);
                if (cur > 0 && !Number.isNaN(met)) {
                  if (Math.abs(cur - met) < 0.001) return '_on';
                  if (met < cur) return '_unmet';
                }
                return '';
              })()
            )}
            alt="building"
          />
        );
      case 'solar':
        return <img src={solarImg} alt="solar" />;
      case 'battery': {
        const soc = state.soc;
        if (!isSetup) {
          return <img src={batteryImg} alt="battery" />;
        }
        return <img src={getBatteryImage(soc)} alt="battery" />;
      }
      case 'grid': {
        if (isSetup) {
          const status = state.grid_status_current;
          if (status === 0) return <img src={gridOffImg} alt="grid" />;
          if (status === 1) return <img src={gridOnImg} alt="grid" />;
        }
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
    if (!showHelp) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showHelp]);

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
    const bats = modules
      .filter((m) => m.type === 'battery')
      .sort((a, b) => (a.idx || 0) - (b.idx || 0));
    const grids = modules
      .filter((m) => m.type === 'grid')
      .sort((a, b) => (a.idx || 0) - (b.idx || 0));
    setManualActions((prev) => ({
      battery: bats.map((_, i) => prev.battery?.[i] ?? 0),
      grid: grids.map((_, i) => prev.grid?.[i] ?? 0),
    }));
  }, [modules]);

  const previewTimer = useRef(null);

  useEffect(() => {
    if (!statusData || !isSetup) {
      setPreviewValues(null);
      setPreviewLoadMet({});
      setCurrentTotals(null);
      return;
    }

    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      let states;
      try {
        if (manualMode) {
          const payload = buildManualPayload();
          const log = await api.previewStep(payload);
          states = buildCurrentStatus(
            statusData,
            log || {}
          );
        } else {
          states = buildCurrentStatus(
            statusData,
            logData || {}
          );
        }
      } catch (_) {
        states = buildCurrentStatus(
          statusData,
          logData || {}
        );
      }

    const gridMods = modules
      .filter((m) => m.type === 'grid')
      .sort((a, b) => (a.idx || 0) - (b.idx || 0));
    const batteryMods = modules
      .filter((m) => m.type === 'battery')
      .sort((a, b) => (a.idx || 0) - (b.idx || 0));
    const loadMods = modules
      .filter((m) => ['house', 'building'].includes(m.type))
      .sort((a, b) => (a.idx || 0) - (b.idx || 0));

    const gridImport = gridMods.reduce(
      (acc, _, i) => acc + Number(states.grid?.[i]?.grid_import ?? 0),
      0,
    );
    const gridExport = gridMods.reduce(
      (acc, _, i) => acc + Number(states.grid?.[i]?.grid_export ?? 0),
      0,
    );
    const moneyGrid = gridMods.reduce(
      (acc, _, i) => acc + Number(states.grid?.[i]?.grid_balance ?? 0),
      0,
    );

    const batCharge = batteryMods.reduce(
      (acc, _, i) => acc + Number(states.battery?.[i]?.charge_amount ?? 0),
      0,
    );
    const batDischarge = batteryMods.reduce(
      (acc, _, i) => acc + Number(states.battery?.[i]?.discharge_amount ?? 0),
      0,
    );
    const moneyBat = batteryMods.reduce((acc, m, i) => {
      const cost = Number(m.params?.battery_cost_cycle || 0);
      const charge = Number(states.battery?.[i]?.charge_amount ?? 0);
      const discharge = Number(states.battery?.[i]?.discharge_amount ?? 0);
      return acc - cost * (charge + discharge);
    }, 0);

    const renewable = Object.values(states.renewable || {}).reduce(
      (acc, s) => acc + Number(s.renewable_current ?? 0),
      0,
    );
    const loads = loadMods.reduce(
      (acc, _, i) => acc + Math.abs(Number(states.load?.[i]?.load_current ?? 0)),
      0,
    );

    const energyBalance =
      renewable + gridImport + batDischarge - (loads + gridExport + batCharge);
    const moneyBalance = moneyGrid + moneyBat;

    const preview = {};
    loadMods.forEach((m, i) => {
      preview[m.id] = Number(states.load?.[i]?.load_met ?? 0);
    });
    setPreviewLoadMet(preview);

    setPreviewValues({
      grid: gridImport - gridExport,
      costGrid: moneyGrid,
      batteries: batDischarge - batCharge,
      costBatteries: moneyBat,
      energyBalance,
      moneyBalance,
    });
    setActualValues({
      grid: gridImport - gridExport,
      costGrid: moneyGrid,
      batteries: batDischarge - batCharge,
      costBatteries: moneyBat,
      energyBalance,
      moneyBalance,
    });
    setCurrentTotals({
      renewable,
      loads,
      batteryCharge: batCharge,
      batteryDischarge: batDischarge,
    });
    setComponentStatus(states);
  }, 300);

    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [manualActions, statusData, modules, isSetup, logData]);


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
      const isManual = modules.some(
        (m) => m.type === 'controller' && m.params?.name === 'manual'
      );
      setStepCount(0);
      setResetEnabled(true);
      setStepEnabled(true);
      setPlayEnabled(hasController && !isManual);
      setPauseEnabled(false);
      setIsSetup(true);
      addLog({ method: 'POST', endpoint: '/setup', payload, response });
      addLog({ method: 'POST', endpoint: '/reset', payload: null, response: resetResponse });
      const states = await updateStatusLog();
      setComponentStatus(states || {});
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
        const payload = manualMode ? buildManualPayload() : null;
        const response = await api.runStep(payload);
        addLog({ method: 'POST', endpoint: '/run', payload, response });
        setStepCount((s) => s + 1);
        const states = await updateStatusLog();
        setComponentStatus(states || {});
        resetManualActions();
      } catch (err) {
        const payload = manualMode ? buildManualPayload() : null;
        addLog({ method: 'POST', endpoint: '/run', payload, response: { error: err.message } });
      }
    }, 2000);
  };

  const handlePause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    resetManualActions();
    const isManual = modules.some(
      (m) => m.type === 'controller' && m.params?.name === 'manual'
    );
    setPlayEnabled(!isManual);
    setPauseEnabled(false);
  };

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    resetManualActions();
    setStepEnabled(false);
    setPlayEnabled(false);
    setPauseEnabled(false);
    setResetEnabled(false);
    setIsSetup(false);
  };

  const handleRunStep = async () => {
    try {
      const hasController = modules.some((m) => m.type === 'controller');
      const payload = manualMode
        ? buildManualPayload()
        : hasController
        ? null
        : { actions: { grid: [0], battery: [0] } };
      const response = await api.runStep(payload);
      addLog({ method: 'POST', endpoint: '/run', payload, response });
      setStepCount((s) => s + 1);
      const states = await updateStatusLog();
      setComponentStatus(states || {});
      resetManualActions();
    } catch (err) {
      const hasController = modules.some((m) => m.type === 'controller');
      const payload = manualMode
        ? buildManualPayload()
        : hasController
        ? null
        : { actions: { grid: [0], battery: [0] } };
      addLog({ method: 'POST', endpoint: '/run', payload, response: { error: err.message } });
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
      const isManual = modules.some(
        (m) => m.type === 'controller' && m.params?.name === 'manual'
      );
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStepCount(0);
      setManualActions({
        battery: modules
          .filter((m) => m.type === 'battery')
          .sort((a, b) => (a.idx || 0) - (b.idx || 0))
          .map(() => 0),
        grid: modules
          .filter((m) => m.type === 'grid')
          .sort((a, b) => (a.idx || 0) - (b.idx || 0))
          .map(() => 0),
      });
      setStepEnabled(true);
      setPlayEnabled(hasController && !isManual);
      setPauseEnabled(false);
      addLog({ method: 'POST', endpoint: '/reset', payload: null, response });
      const states = await updateStatusLog();
      setComponentStatus(states || {});
    } catch (err) {
      
      addLog({ method: 'POST', endpoint: '/reset', payload: null, response: { error: err.message } });
    }
  };

  return (
    <div className="app-container">
      <header className="header" id="section-1">
        <h1>Renewable Energy Community Simulator</h1>
        <div className="header-right">
          <HeaderControls
            onSetup={handleSetup}
            onRunStep={handleRunStep}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onReset={handleReset}
            onHelp={() => setShowHelp(true)}
            stepDisabled={!stepEnabled}
            playDisabled={!playEnabled}
            pauseDisabled={!pauseEnabled}
            stopDisabled={!isSetup}
            resetDisabled={!resetEnabled}
            step={stepCount}
          />
        </div>
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
          manualMode={manualMode}
          manualValues={manualActions}
          onManualChange={handleManualChange}
          onGridAdjust={handleGridAdjust}
          previewValues={previewValues}
          previewLoadMet={previewLoadMet}
          actualValues={actualValues}
          statusData={statusData}
          totals={currentTotals}
          stateData={componentStatus}
          step={stepCount}
        />
      </section>

      <footer className="footer" id="section-5">
        <FooterTabs
          config={microgridConfig}
          onConfigChange={setMicrogridConfig}
          isSetup={isSetup}
          step={stepCount}
        />
      </footer>
      {showHelp && <HelpPopup onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
