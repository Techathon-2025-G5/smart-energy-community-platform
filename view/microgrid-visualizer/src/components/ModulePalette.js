import React from 'react';
import { useDrag } from 'react-dnd';
import houseImg from '../assets/house.png';
import buildingImg from '../assets/building.png';
import solarImg from '../assets/solar_panel.png';
import batteryImg from '../assets/battery.png';
import gridImg from '../assets/grid.png';
import controllerImg from '../assets/controller.png';
import { useAppState } from '../context/AppState';
import './ModulePalette.css';

const modules = [
  { type: 'house', icon: houseImg, name: 'House' },
  { type: 'building', icon: buildingImg, name: 'Building' },
  { type: 'solar', icon: solarImg, name: 'Solar Panel' },
  { type: 'battery', icon: batteryImg, name: 'Battery' },
  { type: 'grid', icon: gridImg, name: 'Grid' },
  { type: 'controller', icon: controllerImg, name: 'Controller' },
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
          <img src={m.icon} alt={m.type} />
          <div className="module-label">{m.name}</div>
        </DraggableIcon>
      ))}
    </div>
  );
}
