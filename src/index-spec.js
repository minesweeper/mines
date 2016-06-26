import minesweeper from '.';
import gameState from './gameState';
import fieldState from './fieldState';
import toOptions from './toOptions';

describe('minesweeper', () => {
  let game = null;

  describe('with defaults', () => {
    it('should have initial state for default game', () => {
      game = minesweeper();
      expect(game.finished()).toBeFalsy();
      expect(game.state()).toBe(gameState.NOT_STARTED);
    });
  });

  describe('with 1 x 2 and 1 mine', () => {
    let gameStateTransitions = null;
    const options = {dimensions: [1, 2], mine_count: 1};

    beforeEach(() => {
      game = minesweeper(options);
      gameStateTransitions = [];
      game.onGameStateChange((state, previous_state) => { gameStateTransitions.push([state, previous_state]); });
    });

    it('should have initial state for configured game', () => {
      expect(game.finished()).toBeFalsy();
      expect(game.state()).toBe(gameState.NOT_STARTED);
      expect(game.test_mode).toBeFalsy();
    });

    it('should reveal the neighbour to the one mine and immediately win the game', () => {
      const cell = [0, 0];
      expect(game.cellState(cell)).toBe(fieldState.UNKNOWN);
      expect(game.reveal(cell)).toBe(gameState.WON);
      expect(gameStateTransitions).toEqual([[gameState.WON, gameState.NOT_STARTED]]);
      expect(game.state()).toBe(gameState.WON);
      expect(game.cellState(cell)).toBe('1');
      expect(game.finished()).toBeTruthy();
    });
  });

  describe('in test mode (with fixed mines)', () => {
    let cellStateTransitions = null;
    const options = toOptions(`
      . . . .
      . * * .
      . . . .
    `);

    beforeEach(() => {
      game = minesweeper(options);
      cellStateTransitions = [];
      game.onCellStateChange((cell, state, previous_state) => {
        cellStateTransitions.push([cell, state, previous_state]);
      });
    });

    it('should have initial state', () => {
      expect(game.finished()).toBeFalsy();
      expect(game.state()).toBe(gameState.NOT_STARTED);
      expect(game.test_mode).toBeTruthy();
    });

    it('should reveal a mine and immediately lose the game', () => {
      const cell = [1, 1];
      expect(game.cellState(cell)).toBe(fieldState.UNKNOWN);
      expect(game.reveal(cell)).toBe(gameState.LOST);
      expect(game.state()).toBe(gameState.LOST);
      expect(game.cellState(cell)).toBe(fieldState.MINE);
      expect(game.finished()).toBeTruthy();
      expect(cellStateTransitions).toEqual([
        [cell, fieldState.MINE, fieldState.UNKNOWN]
      ]);
    });

    it('should make no state changes when game is finished', () => {
      const mine_cell = [1, 1];
      const safe_cell = [0, 0];
      expect(game.reveal(mine_cell)).toBe(gameState.LOST);
      expect(game.reveal(safe_cell)).toBe(gameState.LOST);
      expect(game.cellState(safe_cell)).toBe(fieldState.UNKNOWN);
      expect(game.finished()).toBeTruthy();
    });

    it('should reveal two adjacent mines', () => {
      const cell = [0, 1];
      expect(game.cellState(cell)).toBe(fieldState.UNKNOWN);
      expect(game.reveal(cell)).toBe(gameState.STARTED);
      expect(game.state()).toBe(gameState.STARTED);
      expect(game.cellState(cell)).toBe('2');
      expect(game.finished()).toBeFalsy();
    });
  });

  describe('in test mode (with fixed mines)', () => {
    let cellStateTransitions = null;

    const options = toOptions(`
      . . .
      . . .
      . . *
    `);

    beforeEach(() => {
      game = minesweeper(options);
      cellStateTransitions = [];
      game.onCellStateChange((cell, state, previous_state) => {
        cellStateTransitions.push([cell, state, previous_state]);
      });
    });

    it('should recursively reveal mines', () => {
      expect(game.reveal([0, 0])).toBe(gameState.WON);
      expect(game.state()).toBe(gameState.WON);
      expect(cellStateTransitions).toEqual([
        [[0, 0], '0', fieldState.UNKNOWN],
        [[0, 1], '0', fieldState.UNKNOWN],
        [[0, 2], '0', fieldState.UNKNOWN],
        [[1, 1], '1', fieldState.UNKNOWN],
        [[1, 2], '1', fieldState.UNKNOWN],
        [[1, 0], '0', fieldState.UNKNOWN],
        [[2, 0], '0', fieldState.UNKNOWN],
        [[2, 1], '1', fieldState.UNKNOWN]
      ]);
    });
  });
});
