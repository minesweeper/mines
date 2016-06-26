import fieldState from '../fieldState';
import cellNeighbours from './cellNeighbours';
import renderAsString from './renderAsString';
import {times, isNil, isEqual, filter, some, isNaN, map} from 'lodash';

export default (dimensions) => {
  const [row_count, column_count] = dimensions;
  const state = [];
  let mines = null;
  const total_cells = row_count * column_count;

  times(row_count, (row_index) => {
    const row = [];
    state.push(row);
    times(column_count, (column_index) => {
      row.push(fieldState.UNKNOWN);
    });
  });

  const isMine = (cell) => some(mines, (mine) => isEqual(cell, mine));

  const neighbouringMines = (neighbours) => filter(neighbours, (neighbour) => isMine(neighbour));

  const cellState = ([row, column]) => state[row][column];

  const revealed = ([row, column]) => !isNaN(parseInt(state[row][column]));

  const reveal = (cell) => {
    if (revealed(cell)) return false;
    const [row, column] = cell;
    const revealedMine = isMine(cell);
    if (revealedMine) {
      state[row][column] = fieldState.MINE;
    } else {
      const neighbours = cellNeighbours(dimensions, cell);
      const mine_count = neighbouringMines(neighbours).length;
      state[row][column] = mine_count.toString();
      if (mine_count === 0) map(neighbours, reveal);
    }
    return revealedMine;
  };

  const revealedCells = () => {
    let count = 0;
    times(row_count, (row) => {
      times(column_count, (column) => {
        if (revealed([row, column])) count += 1;
      });
    });
    return count;
  };

  const allCellsWithoutMinesRevealed = () => revealedCells() === (total_cells - mines.length);

  return {
    minesPlaced: () => !isNil(mines),
    placeMines: (m) => { mines = m; },
    cellState: cellState,
    reveal: reveal,
    revealed: revealed,
    renderAsString: () => renderAsString(state),
    allCellsWithoutMinesRevealed: allCellsWithoutMinesRevealed
  };
};
