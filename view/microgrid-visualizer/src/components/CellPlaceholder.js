import React from 'react';
import PropTypes from 'prop-types';
import { GRID_ROWS } from '../utils/constants';
import './CellPlaceholder.css';

export default function CellPlaceholder({ row, col, cellSize, label }) {
  const left = (col - 1) * cellSize + cellSize * 0.1;
  const top = (GRID_ROWS - row) * cellSize + cellSize * 0.2;
  return (
    <div
      className="cell-placeholder"
      style={{
        left,
        top,
        width: cellSize * 0.8,
        height: cellSize * 0.6,
      }}
    >
      {label}
    </div>
  );
}

CellPlaceholder.propTypes = {
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  cellSize: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
};
