import React, { createContext, useContext, useReducer } from 'react';
import api from '../api/client';
import { buildCurrentStatus, parseHistory } from '../utils/log';

const AppStateContext = createContext();

const initialState = {
  modules: [],
  selected: null,
  energyPoints: [],
  logs: [],
  status: null,
  log: null,
  history: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_MODULE':
      return { ...state, modules: [...state.modules, action.module] };
    case 'MOVE_MODULE':
      return {
        ...state,
        modules: state.modules.map((m) =>
          m.id === action.module.id ? { ...m, left: action.module.left, top: action.module.top } : m
        ),
      };
    case 'UPDATE_MODULE':
      return {
        ...state,
        modules: state.modules.map((m) => (m.id === action.module.id ? action.module : m)),
      };
    case 'SET_BACKEND_ID':
      return {
        ...state,
        modules: state.modules.map((m) =>
          m.id === action.id ? { ...m, backendId: action.backendId } : m
        ),
      };
    case 'DELETE_MODULE':
      return {
        ...state,
        modules: state.modules.filter((m) => m.id !== action.id),
        selected: state.selected === action.id ? null : state.selected,
      };
    case 'SELECT_MODULE':
      return { ...state, selected: action.id };
    case 'ADD_ENERGY_POINT':
      const pts = [...state.energyPoints, action.point];
      return { ...state, energyPoints: pts.slice(-20) };
    case 'ADD_LOG':
      const logs = [...state.logs, action.log];
      return { ...state, logs: logs.slice(-50) };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_LOG_DATA':
      return { ...state, log: action.log };
    case 'SET_HISTORY':
      return { ...state, history: action.history };
    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addModule = (module) => dispatch({ type: 'ADD_MODULE', module });
  const moveModule = (module) => dispatch({ type: 'MOVE_MODULE', module });
  const updateModule = (module) => dispatch({ type: 'UPDATE_MODULE', module });
  const setBackendId = (id, backendId) =>
    dispatch({ type: 'SET_BACKEND_ID', id, backendId });
  const deleteModule = (id) => dispatch({ type: 'DELETE_MODULE', id });
  const selectModule = (id) => dispatch({ type: 'SELECT_MODULE', id });
  const addEnergyPoint = (point) => dispatch({ type: 'ADD_ENERGY_POINT', point });
  const addLog = (log) => dispatch({ type: 'ADD_LOG', log });
  const setStatus = (status) => dispatch({ type: 'SET_STATUS', status });
  const setLogData = (log) => dispatch({ type: 'SET_LOG_DATA', log });
  const setHistory = (history) => dispatch({ type: 'SET_HISTORY', history });

  const refreshPreview = async () => {
    try {
      const gridModules = state.modules
        .filter((m) => m.type === 'grid')
        .sort((a, b) => (a.idx || 0) - (b.idx || 0));
      const batteryModules = state.modules
        .filter((m) => m.type === 'battery')
        .sort((a, b) => (a.idx || 0) - (b.idx || 0));
      const actions = {
        grid: gridModules.map(() => 0),
        battery: batteryModules.map(() => 0),
      };
      const log = await api.previewStep({ actions });
      setLogData(log);
      const history = parseHistory(log);
      setHistory(history);
      const states = buildCurrentStatus({}, log);
      state.modules.forEach((m) => {
        if (!m.backendId) return;
        const [type, idxStr] = m.backendId.split('_');
        const idx = parseInt(idxStr, 10);
        const stateData = states?.[type]?.[idx] || {};
        const curState = m.state || {};
        const newState = { ...curState, ...stateData };
        const changed = Object.keys(stateData).some((k) => stateData[k] !== curState[k]);
        const hasSoc = Object.prototype.hasOwnProperty.call(stateData, 'soc');
        if (changed || hasSoc) {
          updateModule({ ...m, state: newState });
        }
      });
      setStatus(states);
      return states;
    } catch (_) {
      // ignore errors
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        state,
        history: state.history,
        addModule,
        moveModule,
        updateModule,
        setBackendId,
        deleteModule,
        selectModule,
        addEnergyPoint,
        addLog,
        refreshPreview,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export const useAppState = () => useContext(AppStateContext);
