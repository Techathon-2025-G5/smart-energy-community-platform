import './SimulationCanvas.css';
import React, { useRef, useState, useLayoutEffect } from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import { GRID_SIZE, GRID_ROWS, GRID_COLS } from '../utils/constants';
import EnvironmentCanvas from './EnvironmentCanvas';

function SimulationCanvas({ onDrop, step, children }) {
  const ref = useRef(null);
  const [cellSize, setCellSize] = useState(GRID_SIZE);

  useLayoutEffect(() => {
    const update = () => {
      if (ref.current) {
        const w = ref.current.clientWidth;
        if (w) {
          setCellSize(w / GRID_COLS);
        }
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const [, drop] = useDrop(() => ({
    accept: ['module', 'canvas-module'],
    drop: (item, monitor) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const source = monitor.getSourceClientOffset();
      const pointer = monitor.getClientOffset();
      const x = (source ? source.x : pointer.x - cellSize / 2) - rect.left;
      const y = (source ? source.y : pointer.y - cellSize / 2) - rect.top;
      const snappedLeft = Math.round(x / cellSize) * cellSize;
      const snappedTop = Math.round(y / cellSize) * cellSize;
      onDrop(item, snappedLeft, snappedTop);
    },
  }), [onDrop, cellSize]);

  drop(ref);

  return (
    <div
      ref={ref}
      className="drawing-area"
      style={{
        position: 'relative',
        width: '100%',
        height: `${cellSize * GRID_ROWS}px`,
        '--cell-size': `${cellSize}px`,
      }}
    >
      <EnvironmentCanvas cellSize={cellSize} step={step} />
      {children}
    </div>
  );
}

SimulationCanvas.propTypes = {
  onDrop: PropTypes.func.isRequired,
  step: PropTypes.number.isRequired,
  children: PropTypes.node,
};

export default SimulationCanvas;
