import configuration from './configuration';
import field from './field';
import gameState from './gameState';
import randomlyPlaceMines from './randomlyPlaceMines';
import {assign, map} from 'lodash';

const minesweeper = (options) => {
  const gameStateChangeListeners = [];
  const cellStateChangeListeners = [];
  const remainingMineCountListeners = [];
  const config = configuration(options);
  let state = gameState.NOT_STARTED;
  const visibleField = field(config.dimensions, config.mine_count);

  const finished = () => (state === gameState.WON || state === gameState.LOST);

  const outOfBounds = ([row, column]) => {
    return (row < 0 || row > (config.dimensions[0] - 1) || column < 0 || column > (config.dimensions[1] - 1));
  };

  const ensureMinesHaveBeenPlaced = ([row, column]) => {
    if (!visibleField.minesPlaced()) {
      visibleField.placeMines(config.mines || randomlyPlaceMines(config, row, column));
    }
  };

  const notifyRemainingMineCountListeners = (remainingMineCount, previousRemainingMineCount) => map(remainingMineCountListeners, (cb) => {
    cb(remainingMineCount, previousRemainingMineCount);
  });

  const notifyGameStateChangeListeners = (state, previous_state) => map(gameStateChangeListeners, (cb) => {
    cb(state, previous_state);
  });

  const reveal = (cell) => {
    if (finished() || outOfBounds(cell)) return state;
    const previous_state = state;
    ensureMinesHaveBeenPlaced(cell);
    if (visibleField.reveal(cell, cellStateChangeListeners)) {
      state = gameState.LOST;
    } else {
      state = visibleField.allCellsWithoutMinesRevealed() ? gameState.WON : gameState.STARTED;
    }
    notifyGameStateChangeListeners(state, previous_state);
    return state;
  };

  const chord = (cell) => {
    if (finished() || outOfBounds(cell)) return state;
    const previous_state = state;
    if (visibleField.chord(cell, cellStateChangeListeners)) {
      state = gameState.LOST;
    } else {
      state = visibleField.allCellsWithoutMinesRevealed() ? gameState.WON : gameState.STARTED;
    }
    notifyGameStateChangeListeners(state, previous_state);
    return state;
  };

  const mark = (cell) => {
    if (finished() || outOfBounds(cell)) return state;
    const previous_state = state;
    const previousRemainingMines = visibleField.remainingMineCount();
    visibleField.mark(cell, cellStateChangeListeners);
    notifyGameStateChangeListeners(state, previous_state);
    notifyRemainingMineCountListeners(visibleField.remainingMineCount(), previousRemainingMines);
    return state;
  };

  const onGameStateChange = (listener) => { gameStateChangeListeners.push(listener); };

  const onCellStateChange = (listener) => { cellStateChangeListeners.push(listener); };

  const onRemainingMineCountChange = (listener) => { remainingMineCountListeners.push(listener); };

  return assign(config, {
    finished: finished,
    state: () => state,
    cellState: visibleField.cellState,
    remainingMineCount: visibleField.remainingMineCount,
    mark: mark,
    chord: chord,
    reveal: reveal,
    renderAsString: visibleField.renderAsString,
    onGameStateChange: onGameStateChange,
    onCellStateChange: onCellStateChange,
    onRemainingMineCountChange: onRemainingMineCountChange
  });
};

module.exports = minesweeper;
