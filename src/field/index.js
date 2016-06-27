import fieldState from '../fieldState';
import cellNeighbours from './cellNeighbours';
import renderAsString from './renderAsString';
import {times, isNil, isEqual, filter, some, map, range} from 'lodash';

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

  const revealed = ([row, column]) => some(range(9), (number) => state[row][column] === fieldState[number]);

  const notifyListeners = (listeners, cell, state, previous_state) => map(listeners, (cb) => { cb(cell, state, previous_state); });

  const marked = ([row, column]) => {
    const current_state = state[row][column];
    return current_state === fieldState.MARKED || current_state === fieldState.QUESTION;
  };

  const reveal = (cell, listeners) => {
    if (revealed(cell) || marked(cell)) return false;
    const [row, column] = cell;
    const previous_state = state[row][column];
    const revealedMine = isMine(cell);
    if (revealedMine) {
      state[row][column] = fieldState.EXPLODED_MINE;
      notifyListeners(listeners, cell, fieldState.EXPLODED_MINE, previous_state);
    } else {
      const neighbours = cellNeighbours(dimensions, cell);
      const mine_count = neighbouringMines(neighbours).length;
      const new_state = fieldState[mine_count];
      state[row][column] = new_state;
      notifyListeners(listeners, cell, new_state, previous_state);
      if (mine_count === 0) map(neighbours, (neighbour) => { reveal(neighbour, listeners); });
    }
    return revealedMine;
  };

  const mark = (cell, listeners) => {
    const [row, column] = cell;
    if (revealed(cell)) return state[row][column];
    const previous_state = state[row][column];
    let new_state = null;
    if (previous_state === fieldState.UNKNOWN) new_state = fieldState.MARKED;
    if (previous_state === fieldState.MARKED) new_state = fieldState.QUESTION;
    if (previous_state === fieldState.QUESTION) new_state = fieldState.UNKNOWN;
    state[row][column] = new_state;
    notifyListeners(listeners, cell, new_state, previous_state);
    return new_state;
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
    mark: mark,
    revealed: revealed,
    renderAsString: () => renderAsString(state),
    allCellsWithoutMinesRevealed: allCellsWithoutMinesRevealed
  };
};
