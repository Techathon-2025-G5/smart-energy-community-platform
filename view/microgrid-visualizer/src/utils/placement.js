export const LOAD_CELLS = Array.from({ length: 8 }, (_, i) => ({ row: 3, col: i + 1 }));
export const SOLAR_CELLS = [
  { row: 5, col: 3 },
  { row: 5, col: 4 },
  { row: 5, col: 5 },
  { row: 6, col: 3 },
  { row: 6, col: 4 },
  { row: 6, col: 5 },
];
export const CONTROLLER_CELLS = [{ row: 5, col: 6 }];
export const BATTERY_CELLS = [
  { row: 5, col: 7 },
  { row: 5, col: 8 },
  { row: 6, col: 7 },
  { row: 6, col: 8 },
];
export const GRID_CELLS = [{ row: 7, col: 6 }];

export function cellKey(row, col) {
  return `${row}-${col}`;
}

export function isAllowed(type, row, col) {
  switch (type) {
    case 'house':
    case 'building':
      return LOAD_CELLS.some((c) => c.row === row && c.col === col);
    case 'solar':
      return SOLAR_CELLS.some((c) => c.row === row && c.col === col);
    case 'controller':
      return CONTROLLER_CELLS.some((c) => c.row === row && c.col === col);
    case 'battery':
      return BATTERY_CELLS.some((c) => c.row === row && c.col === col);
    case 'grid':
      return GRID_CELLS.some((c) => c.row === row && c.col === col);
    default:
      return false;
  }
}
