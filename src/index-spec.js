import minesweeper from '.';
import gameState from './gameState';
import fieldState from './fieldState';
import toOptions from './toOptions';

describe('minesweeper', () => {
  let game = null;

  describe('with defaults', () => {
    beforeEach(() => {
      game = minesweeper();
    });

    it('should have initial state for default game', () => {
      expect(game.finished()).toBeFalsy();
      expect(game.state()).toBe(gameState.NOT_STARTED);
    });

    it('should default to the expert size for a new game', () => {
      assert.deepEqual(game.dimensions, [16, 30]);
      expect(game.mine_count).toBe(99);
    });

    it('should expose the remaining mine count for a new (unstarted) game', () => {
      expect(game.remainingMineCount()).toBe(99);
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
      expect(game.mark(cell)).toBe(gameState.STARTED);
      expect(game.cellState(cell)).toBe(fieldState[1]);
    });

    describe('when a cell is marked as a mine', () => {
      const cell = [1, 1];

      beforeEach(() => {
        expect(game.mark(cell)).toBe(gameState.NOT_STARTED);
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
        expect(game.mark(cell)).toBe(gameState.NOT_STARTED);
        expect(game.cellState(cell)).toBe(fieldState.MARKED);
        expect(game.mark(cell)).toBe(gameState.NOT_STARTED);
        expect(game.cellState(cell)).toBe(fieldState.QUESTION);
      });

      it('should allow cycle back to unknown by marking again', () => {
        expect(game.mark(cell)).toBe(gameState.NOT_STARTED);
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
        expect(game.mark(safe_cell)).toBe(gameState.NOT_STARTED);
        expect(game.mark(another_mine_cell)).toBe(gameState.NOT_STARTED);
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

  describe('chording in test mode (with fixed mines)', () => {
    let cellStateTransitions = null;

    const options = toOptions(`
      * . .
      . . .
      . . .
    `);

    beforeEach(() => {
      game = minesweeper(options);
      cellStateTransitions = [];
      game.onCellStateChange((cell, state, previous_state) => {
        cellStateTransitions.push([cell, state, previous_state]);
      });
    });

    it('should win game by correctly revealing unknown cells around a number cell when number of flags are the same as the cell number', () => {
      expect(game.reveal([1, 1])).toBe(gameState.STARTED);
      expect(game.state()).toBe(gameState.STARTED);
      expect(game.mark([0, 0])).toBe(gameState.STARTED);
      expect(game.chord([1, 1])).toBe(gameState.WON);
      expect(cellStateTransitions).toEqual([
         [[1, 1], fieldState[1], fieldState.UNKNOWN],
         [[0, 0], fieldState.MARKED, fieldState.UNKNOWN],
         [[0, 1], fieldState[1], fieldState.UNKNOWN],
         [[0, 2], fieldState[0], fieldState.UNKNOWN],
         [[1, 2], fieldState[0], fieldState.UNKNOWN],
         [[2, 1], fieldState[0], fieldState.UNKNOWN],
         [[1, 0], fieldState[1], fieldState.UNKNOWN],
         [[2, 0], fieldState[0], fieldState.UNKNOWN],
         [[2, 2], fieldState[0], fieldState.UNKNOWN]
      ]);
    });

    it('should lose game by incorrectly revealing unknown cells around a number cell when number of flags are the same as the cell number', () => {
      expect(game.reveal([1, 1])).toBe(gameState.STARTED);
      expect(game.state()).toBe(gameState.STARTED);
      expect(game.mark([1, 0])).toBe(gameState.STARTED);
      expect(game.chord([1, 1])).toBe(gameState.LOST);
      expect(cellStateTransitions).toEqual([
         [[1, 1], fieldState[1], fieldState.UNKNOWN],
         [[1, 0], fieldState.MARKED, fieldState.UNKNOWN],
         [[0, 0], fieldState.EXPLODED_MINE, fieldState.UNKNOWN],
         [[1, 0], fieldState.INCORRECTLY_MARKED_MINE, fieldState.MARKED],
         [[0, 1], fieldState[1], fieldState.UNKNOWN],
         [[0, 2], fieldState[0], fieldState.UNKNOWN],
         [[1, 2], fieldState[0], fieldState.UNKNOWN],
         [[2, 1], fieldState[0], fieldState.UNKNOWN],
         [[2, 0], fieldState[0], fieldState.UNKNOWN],
         [[2, 2], fieldState[0], fieldState.UNKNOWN]
      ]);
    });
  });

  describe('remaining mines in test mode (with fixed mines)', () => {
    let gameStateTransitions = null;
    let remainingMineCountTransitions = null;

    const options = toOptions(`
      * . .
      . . .
      . . .
    `);

    beforeEach(() => {
      game = minesweeper(options);

      gameStateTransitions = [];
      game.onGameStateChange((state, previous_state) => {
        gameStateTransitions.push([state, previous_state]);
      });
      remainingMineCountTransitions = [];
      game.onRemainingMineCountChange((remainingMineCount, previousRemainingMineCount) => {
         remainingMineCountTransitions.push([remainingMineCount, previousRemainingMineCount]);
      });
    });

    it('should expose remainingMineCount', () => {
      expect(game.remainingMineCount()).toBe(1);
      expect(game.mark([0, 0])).toBe(gameState.NOT_STARTED);
      expect(game.remainingMineCount()).toBe(0);
      expect(game.mark([1, 1])).toBe(gameState.NOT_STARTED);
      expect(game.remainingMineCount()).toBe(0);
      expect(remainingMineCountTransitions).toEqual([[0, 1], [0, 0]]);
      expect(gameStateTransitions).toEqual([
        [gameState.NOT_STARTED, gameState.NOT_STARTED],
        [gameState.NOT_STARTED, gameState.NOT_STARTED]
      ]);
    });
  });

  describe('out of bounds checking on reveal', () => {
    const options = toOptions(`
      * . .
      . . .
      . . .
    `);

    beforeEach(() => {
      game = minesweeper(options);
    });

    it('should ignore reveals under row bounds', () => {
      expect(game.reveal([-1, 1])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore reveals over row bounds', () => {
      expect(game.reveal([3, 0])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore reveals under column bounds', () => {
      expect(game.reveal([0, -10])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore reveals over column bounds', () => {
      expect(game.reveal([0, 4])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore reveals under and over row/column bounds', () => {
      expect(game.reveal([-1, 3])).toBe(gameState.NOT_STARTED);
    });
  });

  describe('out of bounds checking on chord', () => {
    const options = toOptions(`
      * . .
      . . .
      . . .
    `);

    beforeEach(() => {
      game = minesweeper(options);
    });

    it('should ignore chords under row bounds', () => {
      expect(game.chord([-1, 1])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore chords over row bounds', () => {
      expect(game.chord([3, 0])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore chords under column bounds', () => {
      expect(game.chord([0, -10])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore chords over column bounds', () => {
      expect(game.chord([0, 4])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore chords under and over row/column bounds', () => {
      expect(game.chord([-1, 3])).toBe(gameState.NOT_STARTED);
    });

  });

  describe('out of bounds checking on mark', () => {
    const options = toOptions(`
      * . .
      . . .
      . . .
    `);

    beforeEach(() => {
      game = minesweeper(options);
    });

    it('should ignore marks under row bounds', () => {
      expect(game.mark([-1, 1])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore marks over row bounds', () => {
      expect(game.mark([3, 0])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore marks under column bounds', () => {
      expect(game.mark([0, -10])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore marks over column bounds', () => {
      expect(game.mark([0, 4])).toBe(gameState.NOT_STARTED);
    });

    it('should ignore marks under and over row/column bounds', () => {
      expect(game.mark([-1, 3])).toBe(gameState.NOT_STARTED);
    });

  });

});
