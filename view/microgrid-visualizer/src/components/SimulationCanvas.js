import './SimulationCanvas.css';
import React, { useRef, useState, useLayoutEffect } from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import { GRID_SIZE, GRID_ROWS, GRID_COLS } from '../utils/constants';
import EnvironmentCanvas from './EnvironmentCanvas';
import CellPlaceholder from './CellPlaceholder';
import { useAppState } from '../context/AppState';
import {
  LOAD_CELLS,
  SOLAR_CELLS,
  CONTROLLER_CELLS,
  BATTERY_CELLS,
  GRID_CELLS,
  cellKey,
} from '../utils/placement';

function SimulationCanvas({ onDrop, step, children }) {
  const ref = useRef(null);
  const [cellSize, setCellSize] = useState(GRID_SIZE);
  const {
    state: { modules },
  } = useAppState();

  useLayoutEffect(() => {
    const update = () => {
      if (ref.current) {
        const h = ref.current.clientHeight;
        if (h) {
          setCellSize(h / GRID_ROWS);
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
      const col = Math.round(snappedLeft / cellSize) + 1;
      const row = GRID_ROWS - Math.round(snappedTop / cellSize);
      onDrop(item, snappedLeft, snappedTop, row, col, cellSize);
    },
  }), [onDrop, cellSize]);

  drop(ref);

  const occupied = {};
  modules.forEach((m) => {
    const col = Math.round(m.left / cellSize) + 1;
    const row = GRID_ROWS - Math.round(m.top / cellSize);
    occupied[cellKey(row, col)] = m.type;
  });

  const placeholders = [];
  LOAD_CELLS.forEach((c) => {
    if (!occupied[cellKey(c.row, c.col)]) {
      placeholders.push(
        <CellPlaceholder
          key={`load-${c.row}-${c.col}`}
          row={c.row}
          col={c.col}
          cellSize={cellSize}
          label="load"
        />,
      );
    }
  });
  SOLAR_CELLS.forEach((c) => {
    if (!occupied[cellKey(c.row, c.col)]) {
      placeholders.push(
        <CellPlaceholder
          key={`pv-${c.row}-${c.col}`}
          row={c.row}
          col={c.col}
          cellSize={cellSize}
          label="pv"
        />,
      );
    }
  });
  CONTROLLER_CELLS.forEach((c) => {
    if (!occupied[cellKey(c.row, c.col)]) {
      placeholders.push(
        <CellPlaceholder
          key={`ctrl-${c.row}-${c.col}`}
          row={c.row}
          col={c.col}
          cellSize={cellSize}
          label="control"
        />,
      );
    }
  });
  BATTERY_CELLS.forEach((c) => {
    if (!occupied[cellKey(c.row, c.col)]) {
      placeholders.push(
        <CellPlaceholder
          key={`bat-${c.row}-${c.col}`}
          row={c.row}
          col={c.col}
          cellSize={cellSize}
          label="battery"
        />,
      );
    }
  });
  GRID_CELLS.forEach((c) => {
    if (!occupied[cellKey(c.row, c.col)]) {
      placeholders.push(
        <CellPlaceholder
          key={`grid-${c.row}-${c.col}`}
          row={c.row}
          col={c.col}
          cellSize={cellSize}
          label="grid"
        />,
      );
    }
  });

  return (
    <div
      ref={ref}
      className="drawing-area"
      style={{
        position: 'relative',
        width: cellSize * GRID_COLS,
        height: '100%',
        '--cell-size': `${cellSize}px`,
      }}
    >
      <EnvironmentCanvas cellSize={cellSize} step={step} />
      {placeholders}
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
