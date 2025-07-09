import React, { createContext, useContext, useReducer } from 'react';

const AppStateContext = createContext();

const initialState = {
  modules: [],
  selected: null,
  energyPoints: [],
  logs: [],
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
    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addModule = (module) => dispatch({ type: 'ADD_MODULE', module });
  const moveModule = (module) => dispatch({ type: 'MOVE_MODULE', module });
  const updateModule = (module) => dispatch({ type: 'UPDATE_MODULE', module });
  const deleteModule = (id) => dispatch({ type: 'DELETE_MODULE', id });
  const selectModule = (id) => dispatch({ type: 'SELECT_MODULE', id });
  const addEnergyPoint = (point) => dispatch({ type: 'ADD_ENERGY_POINT', point });
  const addLog = (log) => dispatch({ type: 'ADD_LOG', log });

  return (
    <AppStateContext.Provider
      value={{ state, addModule, moveModule, updateModule, deleteModule, selectModule, addEnergyPoint, addLog }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export const useAppState = () => useContext(AppStateContext);
