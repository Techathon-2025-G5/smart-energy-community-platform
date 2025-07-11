import './SimulationCanvas.css';
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import { GRID_SIZE, GRID_ROWS, GRID_COLS } from '../utils/constants';
import EnvironmentCanvas from './EnvironmentCanvas';

function SimulationCanvas({ onDrop, children }) {
  const ref = useRef(null);

  const [, drop] = useDrop(() => ({
    accept: ['module', 'canvas-module'],
    drop: (item, monitor) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const source = monitor.getSourceClientOffset();
      const pointer = monitor.getClientOffset();
      const x = (source ? source.x : pointer.x - GRID_SIZE / 2) - rect.left;
      const y = (source ? source.y : pointer.y - GRID_SIZE / 2) - rect.top;
      const snappedLeft = Math.round(x / GRID_SIZE) * GRID_SIZE;
      const snappedTop = Math.round(y / GRID_SIZE) * GRID_SIZE;
      onDrop(item, snappedLeft, snappedTop);
    },
  }), [onDrop]);

  drop(ref);

  return (
    <div
      ref={ref}
      className="drawing-area"
      style={{
        position: 'relative',
        width: GRID_COLS * GRID_SIZE,
        height: GRID_ROWS * GRID_SIZE,
      }}
    >
      <EnvironmentCanvas />
      {children}
    </div>
  );
}

SimulationCanvas.propTypes = {
  onDrop: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default SimulationCanvas;
