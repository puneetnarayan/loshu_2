import type { CellPosition, Digit, LineDef } from './types';

/** The fixed Lo Shu arrangement. Positions must never change. */
export const GRID_LAYOUT: ReadonlyArray<readonly [Digit, Digit, Digit]> = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

export const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const ROW_NAMES = ['top', 'middle', 'bottom'];
const COL_NAMES = ['left', 'centre', 'right'];

export function positionLabel(row: number, col: number): string {
  if (row === 1 && col === 1) return 'centre';
  return `${ROW_NAMES[row]} ${COL_NAMES[col]}`;
}

export const POSITIONS: Record<Digit, CellPosition> = (() => {
  const out = {} as Record<Digit, CellPosition>;
  GRID_LAYOUT.forEach((rowDigits, row) =>
    rowDigits.forEach((d, col) => {
      out[d] = { row, col, label: positionLabel(row, col) };
    }),
  );
  return out;
})();

/** Exactly the eight geometric lines of the 3x3 square. */
export const LINES: readonly LineDef[] = [
  { id: 'H-492', kind: 'horizontal', digits: [4, 9, 2] },
  { id: 'H-357', kind: 'horizontal', digits: [3, 5, 7] },
  { id: 'H-816', kind: 'horizontal', digits: [8, 1, 6] },
  { id: 'V-438', kind: 'vertical', digits: [4, 3, 8] },
  { id: 'V-951', kind: 'vertical', digits: [9, 5, 1] },
  { id: 'V-276', kind: 'vertical', digits: [2, 7, 6] },
  { id: 'D-456', kind: 'diagonal', digits: [4, 5, 6] },
  { id: 'D-258', kind: 'diagonal', digits: [2, 5, 8] },
];

export const MAGIC_CONSTANT = 15;

export function lineLabel(line: LineDef): string {
  return line.digits.join('–');
}
