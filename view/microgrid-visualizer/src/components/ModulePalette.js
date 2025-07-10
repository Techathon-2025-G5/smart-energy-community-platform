import React from 'react';
import { useDrag } from 'react-dnd';
import { FaHome, FaBuilding, FaSolarPanel, FaBatteryFull, FaRobot } from 'react-icons/fa';
import HighVoltageTowerIcon from './HighVoltageTowerIcon';
import { useAppState } from '../context/AppState';
import './ModulePalette.css';

const modules = [
  { type: 'house', icon: <FaHome /> },
  { type: 'building', icon: <FaBuilding /> },
  { type: 'solar', icon: <FaSolarPanel /> },
  { type: 'battery', icon: <FaBatteryFull /> },
  { type: 'grid', icon: <HighVoltageTowerIcon /> },
  { type: 'controller', icon: <FaRobot /> },
];

function DraggableIcon({ type, children, disabled }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'module',
      item: { type },
      canDrag: !disabled,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [disabled]
  );

  return (
    <div
      ref={drag}
      className={`module-icon${disabled ? ' disabled' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {children}
    </div>
  );
}

export default function ModulePalette() {
  const {
    state: { modules: placedModules },
  } = useAppState();
  const hasController = placedModules.some((m) => m.type === 'controller');

  return (
    <div className="module-palette">
      {modules.map((m) => (
        <DraggableIcon
          key={m.type}
          type={m.type}
          disabled={m.type === 'controller' && hasController}
        >
          {m.icon}
        </DraggableIcon>
      ))}
    </div>
  );
}
