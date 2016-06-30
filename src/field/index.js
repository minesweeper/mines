import fieldState from '../fieldState';
import cellNeighbours from './cellNeighbours';
import renderAsString from './renderAsString';
import {times, isNil, isEqual, filter, some, map, range, each} from 'lodash';

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

  const marked = ([row, column]) => {
    const current_state = state[row][column];
    return current_state === fieldState.MARKED || current_state === fieldState.QUESTION;
  };

  const outOfBounds = ([row, column]) => {
    return (row < 0 || row > (row_count - 1) || column < 0 || column > (column_count - 1));
  };

  const isMine = (cell) => some(mines, (mine) => isEqual(cell, mine));

  const neighbouringMines = (neighbours) => filter(neighbours, (neighbour) => isMine(neighbour));

  const neighbouringMarkedCells = (neighbours) => filter(neighbours, (neighbour) => marked(neighbour));

  const cellState = ([row, column]) => state[row][column];

  const revealed = ([row, column]) => some(range(9), (number) => state[row][column] === fieldState[number]);

  const notifyListeners = (listeners, cell, state, previous_state) => map(listeners, (cb) => { cb(cell, state, previous_state); });

  const setCellState = ([row, column], new_state, listeners) => {
    const previous_state = state[row][column];
    state[row][column] = new_state;
    notifyListeners(listeners, [row, column], new_state, previous_state);
  };

  const flagIncorrectlyMarkedMines = (listeners) => {
    times(row_count, (row) => {
      times(column_count, (column) => {
        const cell = [row, column];
        if (cellState(cell) === fieldState.MARKED && !isMine(cell)) {
          setCellState(cell, fieldState.INCORRECTLY_MARKED_MINE, listeners);
        }
      });
    });
  };

  const revealUnmarkedMines = (listeners) => {
    map(mines, (mine) => {
      if (cellState(mine) === fieldState.UNKNOWN) setCellState(mine, fieldState.MINE, listeners);
    });
  };

  const finaliseLostGame = (cell, listeners) => {
    setCellState(cell, fieldState.EXPLODED_MINE, listeners);
    revealUnmarkedMines(listeners);
    flagIncorrectlyMarkedMines(listeners);
  };

  const reveal = (cell, listeners) => {
    if (outOfBounds(cell)) return false;
    if (cellState(cell) !== fieldState.UNKNOWN) return false;
    if (isMine(cell)) {
      finaliseLostGame(cell, listeners);
      return true;
    }
    const neighbours = cellNeighbours(dimensions, cell);
    const mine_count = neighbouringMines(neighbours).length;
    const new_state = fieldState[mine_count];
    setCellState(cell, new_state, listeners);
    if (mine_count === 0) map(neighbours, (neighbour) => { reveal(neighbour, listeners); });
    return false;
  };

  const chord = (cell, listeners) => {
    if (outOfBounds(cell)) return false;
    if (!revealed(cell) && !(marked(cell))) return reveal(cell, listeners);
    if (marked(cell)) return false;

    const neighbours = cellNeighbours(dimensions, cell);
    let revealedMine = false;

    if (revealed(cell) && neighbouringMarkedCells(neighbours).length === neighbouringMines(neighbours).length) {
      each(neighbours, (neighbour) => {
        if (reveal(neighbour, listeners) === true) { revealedMine = true; }
      });
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
    setCellState(cell, new_state, listeners);
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
    chord: chord,
    revealed: revealed,
    renderAsString: () => renderAsString(state),
    allCellsWithoutMinesRevealed: allCellsWithoutMinesRevealed
  };
};
