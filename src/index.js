import configuration from './configuration';
import field from './field';
import gameState from './gameState';
import randomlyPlaceMines from './randomlyPlaceMines';
import {assign, map} from 'lodash';

const minesweeper = (options) => {
  const gameStateChangeListeners = [];
  const cellStateChangeListeners = [];
  const config = configuration(options);
  let state = gameState.NOT_STARTED;
  const visibleField = field(config.dimensions);

  const finished = () => (state === gameState.WON || state === gameState.LOST);

  const ensureMinesHaveBeenPlaced = ([row, column]) => {
    if (!visibleField.minesPlaced()) {
      visibleField.placeMines(config.mines || randomlyPlaceMines(config, row, column));
    }
  };

  const notifyGameStateChangeListeners = (state, previous_state) => map(gameStateChangeListeners, (cb) => {
    cb(state, previous_state);
  });

  const reveal = (cell) => {
    const previous_state = state;
    if (finished()) return state;
    ensureMinesHaveBeenPlaced(cell);
    if (visibleField.reveal(cell, cellStateChangeListeners)) {
      state = gameState.LOST;
    } else {
      state = visibleField.allCellsWithoutMinesRevealed() ? gameState.WON : gameState.STARTED;
    }
    notifyGameStateChangeListeners(state, previous_state);
    return state;
  };

  const onGameStateChange = (listener) => { gameStateChangeListeners.push(listener); };

  const onCellStateChange = (listener) => { cellStateChangeListeners.push(listener); };

  return assign(config, {
    finished: finished,
    state: () => state,
    cellState: visibleField.cellState,
    reveal: reveal,
    renderAsString: visibleField.renderAsString,
    onGameStateChange: onGameStateChange,
    onCellStateChange: onCellStateChange
  });
};

module.exports = minesweeper;
