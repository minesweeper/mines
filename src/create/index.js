import configuration from './configuration';
import field from './field';
import gameStates from '../gameStates';
import randomlyPlaceMines from './randomlyPlaceMines';
import {assign, map} from 'lodash';

export default (options) => {
  const gameStateChangeListeners = [];
  const cellStateChangeListeners = [];
  const remainingMineCountListeners = [];
  const timerChangeListeners = [];
  const config = configuration(options);
  let intervalToken = null;
  let state = gameStates.NOT_STARTED;
  let timeStarted = null;
  let elapsedTime = 0;
  let visibleField = field(config.dimensions, config.mine_count);

  const finished = () => (state === gameStates.WON || state === gameStates.LOST);

  const outOfBounds = ([row, column]) => {
    return (row < 0 || row > (config.dimensions[0] - 1) || column < 0 || column > (config.dimensions[1] - 1));
  };

  const reset = () => {
    state = gameStates.NOT_STARTED;
    timeStarted = null;
    elapsedTime = 0;
    visibleField = field(config.dimensions, config.mine_count);
    if (intervalToken) {
      global.clearInterval(intervalToken);
      intervalToken = null;
    }
  };

  const appendListener = (listeners, cb) => { listeners.push(cb); };
  const notifyListeners = (listeners, current, previous) => map(listeners, (cb) => { cb(current, previous); });

  const notifyGameStateChangeListeners = notifyListeners.bind(null, gameStateChangeListeners);
  const notifyRemainingMineCountListeners = notifyListeners.bind(null, remainingMineCountListeners);
  const notifyTimerChangeListeners = notifyListeners.bind(null, timerChangeListeners);

  const onGameStateChange = appendListener.bind(null, gameStateChangeListeners);
  const onCellStateChange = appendListener.bind(null, cellStateChangeListeners);
  const onRemainingMineCountChange = appendListener.bind(null, remainingMineCountListeners);
  const onTimerChange = appendListener.bind(null, timerChangeListeners);

  const startTimer = () => {
    intervalToken = global.setInterval(() => {
      if (!timeStarted) { timeStarted = new Date().getTime(); }
      if (state === gameStates.STARTED) {
        const previousElapsedTime = elapsedTime;
        const now = new Date().getTime();
        elapsedTime = now - timeStarted;
        notifyTimerChangeListeners(elapsedTime, previousElapsedTime);
      }
    }, 500);
  };

  const ensureMinesHaveBeenPlaced = ([row, column]) => {
    if (!visibleField.minesPlaced()) {
      visibleField.placeMines(config.mines || randomlyPlaceMines(config, row, column));
      startTimer();
    }
  };

  const changecellStatesWith = (fieldMethod, cell) => {
    if (finished() || outOfBounds(cell)) return state;
    const previous_state = state;
    ensureMinesHaveBeenPlaced(cell);
    if (fieldMethod(cell, cellStateChangeListeners)) {
      state = gameStates.LOST;
    } else {
      state = visibleField.allCellsWithoutMinesRevealed() ? gameStates.WON : gameStates.STARTED;
    }
    notifyGameStateChangeListeners(state, previous_state);
    return state;
  };

  const reveal = (cell) => changecellStatesWith(visibleField.reveal, cell);
  const chord = (cell) => changecellStatesWith(visibleField.chord, cell);

  const mark = (cell) => {
    if (finished() || outOfBounds(cell)) return state;
    const previous_state = state;
    const previousRemainingMines = visibleField.remainingMineCount();
    visibleField.mark(cell, cellStateChangeListeners);
    notifyGameStateChangeListeners(state, previous_state);
    notifyRemainingMineCountListeners(visibleField.remainingMineCount(), previousRemainingMines);
    return state;
  };

  return assign(config, {finished, mark, chord, reveal, onGameStateChange, onCellStateChange, onRemainingMineCountChange, onTimerChange, reset,
    state: () => state,
    cellState: (cell) => visibleField.cellState(cell),
    remainingMineCount: () => visibleField.remainingMineCount(),
    renderAsString: () => visibleField.renderAsString(),
    started: () => timeStarted
  });
};
