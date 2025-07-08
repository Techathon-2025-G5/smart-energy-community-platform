import React from 'react';
import { useDrag } from 'react-dnd';
import { FaHome, FaBuilding, FaSolarPanel, FaBatteryFull } from 'react-icons/fa';
import HighVoltageTowerIcon from './HighVoltageTowerIcon';
import './ModulePalette.css';

const modules = [
  { type: 'house', icon: <FaHome /> },
  { type: 'building', icon: <FaBuilding /> },
  { type: 'solar', icon: <FaSolarPanel /> },
  { type: 'battery', icon: <FaBatteryFull /> },
  { type: 'grid', icon: <HighVoltageTowerIcon /> },
];

function DraggableIcon({ type, children }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'module',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} className="module-icon" style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
}

export default function ModulePalette() {
  return (
    <div className="module-palette">
      {modules.map((m) => (
        <DraggableIcon key={m.type} type={m.type}>
          {m.icon}
        </DraggableIcon>
      ))}
    </div>
  );
}
