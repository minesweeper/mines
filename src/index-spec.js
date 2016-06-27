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
      expect(game.cellState(cell)).toBe(fieldState[1]);
      expect(game.finished()).toBeTruthy();
    });
  });

  describe('in test mode (with fixed mines)', () => {
    let cellStateTransitions = null;
    const options = toOptions(`
      . . . . .
      . * * * .
      . . . . .
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

    it('should ignore mark when already revealed', () => {
      const cell = [0, 0];
      expect(game.reveal(cell)).toBe(gameState.STARTED);
      expect(game.cellState(cell)).toBe(fieldState[1]);
      expect(game.mark(cell)).toBe(fieldState[1]);
    });

    describe('when a cell is marked as a mine', () => {
      const cell = [1, 1];

      beforeEach(() => {
        expect(game.mark(cell)).toBe(fieldState.MARKED);
        expect(game.cellState(cell)).toBe(fieldState.MARKED);
      });

      it('should ignore reveal', () => {
        expect(game.reveal(cell)).toBe(gameState.STARTED);
        expect(game.cellState(cell)).toBe(fieldState.MARKED);
        expect(cellStateTransitions).toEqual([
          [cell, fieldState.MARKED, fieldState.UNKNOWN]
        ]);
      });
    });

    describe('when a cell is marked as a question', () => {
      const cell = [1, 1];

      beforeEach(() => {
        expect(game.mark(cell)).toBe(fieldState.MARKED);
        expect(game.cellState(cell)).toBe(fieldState.MARKED);
        expect(game.mark(cell)).toBe(fieldState.QUESTION);
        expect(game.cellState(cell)).toBe(fieldState.QUESTION);
      });

      it('should allow cycle back to unknown by marking again', () => {
        expect(game.mark(cell)).toBe(fieldState.UNKNOWN);
        expect(game.cellState(cell)).toBe(fieldState.UNKNOWN);
        expect(cellStateTransitions).toEqual([
          [cell, fieldState.MARKED, fieldState.UNKNOWN],
          [cell, fieldState.QUESTION, fieldState.MARKED],
          [cell, fieldState.UNKNOWN, fieldState.QUESTION]
        ]);
      });

      it('should ignore reveal', () => {
        expect(game.reveal(cell)).toBe(gameState.STARTED);
        expect(game.cellState(cell)).toBe(fieldState.QUESTION);
        expect(cellStateTransitions).toEqual([
          [cell, fieldState.MARKED, fieldState.UNKNOWN],
          [cell, fieldState.QUESTION, fieldState.MARKED]
        ]);
      });
    });

    describe('when a mine is revealed', () => {
      const safe_cell = [0, 0];
      const another_safe_cell = [2, 2];
      const mine_cell = [1, 1];
      const another_mine_cell = [1, 2];
      const yet_another_mine_cell = [1, 3];

      beforeEach(() => {
        expect(game.mark(safe_cell)).toBe(fieldState.MARKED);
        expect(game.mark(another_mine_cell)).toBe(fieldState.MARKED);
        expect(game.reveal(mine_cell)).toBe(gameState.LOST);
        expect(game.state()).toBe(gameState.LOST);
      });

      it('last selected mine should be exploded', () => {
        expect(game.cellState(mine_cell)).toBe(fieldState.EXPLODED_MINE);
      });

      it('game should finished', () => {
        expect(game.finished()).toBeTruthy();
      });

      it('other mines should be revealed', () => {
        expect(game.cellState(yet_another_mine_cell)).toBe(fieldState.MINE);
      });

      it('incorrectly marked mines should be revealed', () => {
        expect(game.cellState(safe_cell)).toBe(fieldState.INCORRECTLY_MARKED_MINE);
      });

      it('cell transitions should include revealing other mines', () => {
        expect(cellStateTransitions).toEqual([
          [safe_cell, fieldState.MARKED, fieldState.UNKNOWN],
          [another_mine_cell, fieldState.MARKED, fieldState.UNKNOWN],
          [mine_cell, fieldState.EXPLODED_MINE, fieldState.UNKNOWN],
          [yet_another_mine_cell, fieldState.MINE, fieldState.UNKNOWN],
          [safe_cell, fieldState.INCORRECTLY_MARKED_MINE, fieldState.MARKED]
        ]);
      });

      it('should make no further state changes when game is lost', () => {
        expect(game.reveal(another_safe_cell)).toBe(gameState.LOST);
        expect(game.cellState(another_safe_cell)).toBe(fieldState.UNKNOWN);
        expect(game.finished()).toBeTruthy();
      });
    });

    it('should reveal two adjacent mines', () => {
      const cell = [0, 1];
      expect(game.cellState(cell)).toBe(fieldState.UNKNOWN);
      expect(game.reveal(cell)).toBe(gameState.STARTED);
      expect(game.state()).toBe(gameState.STARTED);
      expect(game.cellState(cell)).toBe(fieldState[2]);
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
        [[0, 0], fieldState[0], fieldState.UNKNOWN],
        [[0, 1], fieldState[0], fieldState.UNKNOWN],
        [[0, 2], fieldState[0], fieldState.UNKNOWN],
        [[1, 1], fieldState[1], fieldState.UNKNOWN],
        [[1, 2], fieldState[1], fieldState.UNKNOWN],
        [[1, 0], fieldState[0], fieldState.UNKNOWN],
        [[2, 0], fieldState[0], fieldState.UNKNOWN],
        [[2, 1], fieldState[1], fieldState.UNKNOWN]
      ]);
    });
  });
});
