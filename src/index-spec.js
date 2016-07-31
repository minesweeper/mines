import {create, gameStates, cellStates} from '.';
import toOptions from './toOptions';

describe('minesweeper', () => {
  let game = null;

  describe('with defaults', () => {
    beforeEach(() => {
      game = create();
    });

    it('should have initial state for default game', () => {
      expect(game.finished()).toBeFalsy();
      expect(game.state()).toBe(gameStates.NOT_STARTED);
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
      game = create(options);
      gameStateTransitions = [];
      game.onGameStateChange((state, previous_state) => { gameStateTransitions.push([state, previous_state]); });
    });

    it('should have initial state for configured game', () => {
      expect(game.finished()).toBeFalsy();
      expect(game.state()).toBe(gameStates.NOT_STARTED);
      expect(game.test_mode).toBeFalsy();
    });

    it('should reveal the neighbour to the one mine and immediately win the game', () => {
      const cell = [0, 0];
      expect(game.cellState(cell)).toBe(cellStates.UNKNOWN);
      expect(game.reveal(cell)).toBe(gameStates.WON);
      expect(gameStateTransitions).toEqual([[gameStates.WON, gameStates.NOT_STARTED]]);
      expect(game.state()).toBe(gameStates.WON);
      expect(game.cellState(cell)).toBe(cellStates[1]);
      expect(game.finished()).toBeTruthy();
    });

    it('should reveal the neighbour to the one mine and immediately win the game by chording', () => {
      const cell = [0, 0];
      expect(game.cellState(cell)).toBe(cellStates.UNKNOWN);
      expect(game.chord(cell)).toBe(gameStates.WON);
      expect(gameStateTransitions).toEqual([[gameStates.WON, gameStates.NOT_STARTED]]);
      expect(game.state()).toBe(gameStates.WON);
      expect(game.cellState(cell)).toBe(cellStates[1]);
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
      game = create(options);
      cellStateTransitions = [];
      game.onCellStateChange((cell, state, previous_state) => {
        cellStateTransitions.push([cell, state, previous_state]);
      });
    });

    it('should have initial state', () => {
      expect(game.finished()).toBeFalsy();
      expect(game.state()).toBe(gameStates.NOT_STARTED);
      expect(game.test_mode).toBeTruthy();
    });

    it('should ignore mark when already revealed', () => {
      const cell = [0, 0];
      expect(game.reveal(cell)).toBe(gameStates.STARTED);
      expect(game.cellState(cell)).toBe(cellStates[1]);
      expect(game.mark(cell)).toBe(gameStates.STARTED);
      expect(game.cellState(cell)).toBe(cellStates[1]);
    });

    describe('when a cell is marked as a mine', () => {
      const cell = [1, 1];

      beforeEach(() => {
        expect(game.mark(cell)).toBe(gameStates.NOT_STARTED);
        expect(game.cellState(cell)).toBe(cellStates.MARKED);
      });

      it('should ignore reveal', () => {
        expect(game.reveal(cell)).toBe(gameStates.STARTED);
        expect(game.cellState(cell)).toBe(cellStates.MARKED);
        expect(cellStateTransitions).toEqual([
          [cell, cellStates.MARKED, cellStates.UNKNOWN]
        ]);
      });
    });

    describe('when a cell is marked as a question', () => {
      const cell = [1, 1];

      beforeEach(() => {
        expect(game.mark(cell)).toBe(gameStates.NOT_STARTED);
        expect(game.cellState(cell)).toBe(cellStates.MARKED);
        expect(game.mark(cell)).toBe(gameStates.NOT_STARTED);
        expect(game.cellState(cell)).toBe(cellStates.QUESTION);
      });

      it('should allow cycle back to unknown by marking again', () => {
        expect(game.mark(cell)).toBe(gameStates.NOT_STARTED);
        expect(game.cellState(cell)).toBe(cellStates.UNKNOWN);
        expect(cellStateTransitions).toEqual([
          [cell, cellStates.MARKED, cellStates.UNKNOWN],
          [cell, cellStates.QUESTION, cellStates.MARKED],
          [cell, cellStates.UNKNOWN, cellStates.QUESTION]
        ]);
      });

      it('should ignore reveal', () => {
        expect(game.reveal(cell)).toBe(gameStates.STARTED);
        expect(game.cellState(cell)).toBe(cellStates.QUESTION);
        expect(cellStateTransitions).toEqual([
          [cell, cellStates.MARKED, cellStates.UNKNOWN],
          [cell, cellStates.QUESTION, cellStates.MARKED]
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
        expect(game.mark(safe_cell)).toBe(gameStates.NOT_STARTED);
        expect(game.mark(another_mine_cell)).toBe(gameStates.NOT_STARTED);
        expect(game.reveal(mine_cell)).toBe(gameStates.LOST);
        expect(game.state()).toBe(gameStates.LOST);
      });

      it('last selected mine should be exploded', () => {
        expect(game.cellState(mine_cell)).toBe(cellStates.EXPLODED_MINE);
      });

      it('game should finished', () => {
        expect(game.finished()).toBeTruthy();
      });

      it('other mines should be revealed', () => {
        expect(game.cellState(yet_another_mine_cell)).toBe(cellStates.MINE);
      });

      it('incorrectly marked mines should be revealed', () => {
        expect(game.cellState(safe_cell)).toBe(cellStates.INCORRECTLY_MARKED_MINE);
      });

      it('cell transitions should include revealing other mines', () => {
        expect(cellStateTransitions).toEqual([
          [safe_cell, cellStates.MARKED, cellStates.UNKNOWN],
          [another_mine_cell, cellStates.MARKED, cellStates.UNKNOWN],
          [mine_cell, cellStates.EXPLODED_MINE, cellStates.UNKNOWN],
          [yet_another_mine_cell, cellStates.MINE, cellStates.UNKNOWN],
          [safe_cell, cellStates.INCORRECTLY_MARKED_MINE, cellStates.MARKED]
        ]);
      });

      it('should make no further state changes when game is lost', () => {
        expect(game.reveal(another_safe_cell)).toBe(gameStates.LOST);
        expect(game.cellState(another_safe_cell)).toBe(cellStates.UNKNOWN);
        expect(game.finished()).toBeTruthy();
      });
    });

    it('should reveal two adjacent mines', () => {
      const cell = [0, 1];
      expect(game.cellState(cell)).toBe(cellStates.UNKNOWN);
      expect(game.reveal(cell)).toBe(gameStates.STARTED);
      expect(game.state()).toBe(gameStates.STARTED);
      expect(game.cellState(cell)).toBe(cellStates[2]);
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
      game = create(options);
      cellStateTransitions = [];
      game.onCellStateChange((cell, state, previous_state) => {
        cellStateTransitions.push([cell, state, previous_state]);
      });
    });

    it('should recursively reveal mines', () => {
      expect(game.reveal([0, 0])).toBe(gameStates.WON);
      expect(game.state()).toBe(gameStates.WON);
      expect(cellStateTransitions).toEqual([
        [[0, 0], cellStates[0], cellStates.UNKNOWN],
        [[0, 1], cellStates[0], cellStates.UNKNOWN],
        [[0, 2], cellStates[0], cellStates.UNKNOWN],
        [[1, 1], cellStates[1], cellStates.UNKNOWN],
        [[1, 2], cellStates[1], cellStates.UNKNOWN],
        [[1, 0], cellStates[0], cellStates.UNKNOWN],
        [[2, 0], cellStates[0], cellStates.UNKNOWN],
        [[2, 1], cellStates[1], cellStates.UNKNOWN]
      ]);
    });

    it('should allow game to be reset', () => {
      expect(game.reveal([2, 2])).toBe(gameStates.LOST);

      game.reset();

      expect(game.state()).toBe(gameStates.NOT_STARTED);
      expect(game.started()).toBe(null);
      expect(game.cellState([2, 2])).toBe(cellStates.UNKNOWN);

      expect(game.reveal([1, 1])).toBe(gameStates.STARTED);
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
      game = create(options);
      cellStateTransitions = [];
      game.onCellStateChange((cell, state, previous_state) => {
        cellStateTransitions.push([cell, state, previous_state]);
      });
    });

    it('should win game by correctly revealing unknown cells around a number cell when number of flags are the same as the cell number', () => {
      expect(game.reveal([1, 1])).toBe(gameStates.STARTED);
      expect(game.state()).toBe(gameStates.STARTED);
      expect(game.mark([0, 0])).toBe(gameStates.STARTED);
      expect(game.chord([1, 1])).toBe(gameStates.WON);
      expect(cellStateTransitions).toEqual([
         [[1, 1], cellStates[1], cellStates.UNKNOWN],
         [[0, 0], cellStates.MARKED, cellStates.UNKNOWN],
         [[0, 1], cellStates[1], cellStates.UNKNOWN],
         [[0, 2], cellStates[0], cellStates.UNKNOWN],
         [[1, 2], cellStates[0], cellStates.UNKNOWN],
         [[2, 1], cellStates[0], cellStates.UNKNOWN],
         [[1, 0], cellStates[1], cellStates.UNKNOWN],
         [[2, 0], cellStates[0], cellStates.UNKNOWN],
         [[2, 2], cellStates[0], cellStates.UNKNOWN]
      ]);
    });

    it('should lose game by incorrectly revealing unknown cells around a number cell when number of flags are the same as the cell number', () => {
      expect(game.reveal([1, 1])).toBe(gameStates.STARTED);
      expect(game.state()).toBe(gameStates.STARTED);
      expect(game.mark([1, 0])).toBe(gameStates.STARTED);
      expect(game.chord([1, 1])).toBe(gameStates.LOST);
      expect(cellStateTransitions).toEqual([
         [[1, 1], cellStates[1], cellStates.UNKNOWN],
         [[1, 0], cellStates.MARKED, cellStates.UNKNOWN],
         [[0, 0], cellStates.EXPLODED_MINE, cellStates.UNKNOWN],
         [[1, 0], cellStates.INCORRECTLY_MARKED_MINE, cellStates.MARKED],
         [[0, 1], cellStates[1], cellStates.UNKNOWN],
         [[0, 2], cellStates[0], cellStates.UNKNOWN],
         [[1, 2], cellStates[0], cellStates.UNKNOWN],
         [[2, 1], cellStates[0], cellStates.UNKNOWN],
         [[2, 0], cellStates[0], cellStates.UNKNOWN],
         [[2, 2], cellStates[0], cellStates.UNKNOWN]
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
      game = create(options);

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
      expect(game.mark([0, 0])).toBe(gameStates.NOT_STARTED);
      expect(game.remainingMineCount()).toBe(0);
      expect(game.mark([1, 1])).toBe(gameStates.NOT_STARTED);
      expect(game.remainingMineCount()).toBe(0);
      expect(remainingMineCountTransitions).toEqual([[0, 1], [0, 0]]);
      expect(gameStateTransitions).toEqual([
        [gameStates.NOT_STARTED, gameStates.NOT_STARTED],
        [gameStates.NOT_STARTED, gameStates.NOT_STARTED]
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
      game = create(options);
    });

    it('should ignore reveals under row bounds', () => {
      expect(game.reveal([-1, 1])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore reveals over row bounds', () => {
      expect(game.reveal([3, 0])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore reveals under column bounds', () => {
      expect(game.reveal([0, -10])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore reveals over column bounds', () => {
      expect(game.reveal([0, 4])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore reveals under and over row/column bounds', () => {
      expect(game.reveal([-1, 3])).toBe(gameStates.NOT_STARTED);
    });
  });

  describe('out of bounds checking on chord', () => {
    const options = toOptions(`
      * . .
      . . .
      . . .
    `);

    beforeEach(() => {
      game = create(options);
    });

    it('should ignore chords under row bounds', () => {
      expect(game.chord([-1, 1])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore chords over row bounds', () => {
      expect(game.chord([3, 0])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore chords under column bounds', () => {
      expect(game.chord([0, -10])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore chords over column bounds', () => {
      expect(game.chord([0, 4])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore chords under and over row/column bounds', () => {
      expect(game.chord([-1, 3])).toBe(gameStates.NOT_STARTED);
    });

  });

  describe('out of bounds checking on mark', () => {
    const options = toOptions(`
      * . .
      . . .
      . . .
    `);

    beforeEach(() => {
      game = create(options);
    });

    it('should ignore marks under row bounds', () => {
      expect(game.mark([-1, 1])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore marks over row bounds', () => {
      expect(game.mark([3, 0])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore marks under column bounds', () => {
      expect(game.mark([0, -10])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore marks over column bounds', () => {
      expect(game.mark([0, 4])).toBe(gameStates.NOT_STARTED);
    });

    it('should ignore marks under and over row/column bounds', () => {
      expect(game.mark([-1, 3])).toBe(gameStates.NOT_STARTED);
    });
  });

  describe('in test mode with all callbacks', () => {
    const si = global.setInterval;
    const ci = global.clearInterval;
    let siCalls = [];
    let ciCalls = [];
    let gameStateChanges = [];
    let cellStateChanges = [];
    let remainingMineCountChange = [];
    let timerChange = [];

    const options = toOptions(`
      * . .
      . . .
      . . *
    `);

    beforeEach(() => {
      siCalls = [];
      ciCalls = [];
      gameStateChanges = [];
      cellStateChanges = [];
      remainingMineCountChange = [];
      timerChange = [];
      global.setInterval = (cb, time) => {
        siCalls.push([cb, time]);
        return 'siToken';
      };
      global.clearInterval = (token) => {
        ciCalls.push(token);
      };
      game = create(options);
      game.onGameStateChange((newState, oldState) => { gameStateChanges.push([oldState, newState]); });
      game.onCellStateChange((cell, newState, oldState) => { cellStateChanges.push([cell, oldState, newState]); });
      game.onRemainingMineCountChange((newCount, oldCount) => { remainingMineCountChange.push([oldCount, newCount]); });
      game.onTimerChange((newTime, oldTime) => { timerChange.push([oldTime, newTime]); });
    });

    afterEach(() => {
      global.setInterval = si;
      global.clearInterval = ci;
    });

    it('should start timer when game starts', () => {
      expect(game.started()).toEqual(null);
      expect(game.reveal([1, 1])).toEqual(gameStates.STARTED);
      expect(siCalls).toNotEqual([]);
      siCalls[0][0]();
      expect(gameStateChanges).toEqual([
        [gameStates.NOT_STARTED, gameStates.STARTED]
      ]);
    });

    it('should disable setInterval when reset', () => {
      expect(game.reveal([1, 1])).toEqual(gameStates.STARTED);
      game.reset();
      expect(ciCalls).toEqual(['siToken']);
    });

    it('should fire timer event when reset', () => {
      expect(game.reveal([1, 1])).toEqual(gameStates.STARTED);
      game.reset();
      expect(timerChange).toEqual([[0, 0]]);
    });

    it('should fire remaining mine count event when reset', () => {
      expect(game.reveal([1, 1])).toEqual(gameStates.STARTED);
      expect(game.mark([0, 0])).toEqual(gameStates.STARTED);
      game.reset();
      expect(remainingMineCountChange).toEqual([
        [2, 1],
        [1, 2]
      ]);
    });

    it('should fire game change event when reset', () => {
      expect(game.reveal([1, 1])).toEqual(gameStates.STARTED);
      game.reset();
      expect(gameStateChanges).toEqual([
        [gameStates.NOT_STARTED, gameStates.STARTED],
        [gameStates.STARTED, gameStates.NOT_STARTED]
      ]);
    });

    it('should fire all cell state change events when reset', () => {
      expect(game.reveal([1, 1])).toEqual(gameStates.STARTED);
      game.reset();
      expect(cellStateChanges).toEqual([
        [[1, 1], cellStates.UNKNOWN, cellStates[2]],
        [[0, 0], cellStates.UNKNOWN, cellStates.UNKNOWN],
        [[0, 1], cellStates.UNKNOWN, cellStates.UNKNOWN],
        [[0, 2], cellStates.UNKNOWN, cellStates.UNKNOWN],
        [[1, 0], cellStates.UNKNOWN, cellStates.UNKNOWN],
        [[1, 1], cellStates[2], cellStates.UNKNOWN],
        [[1, 2], cellStates.UNKNOWN, cellStates.UNKNOWN],
        [[2, 0], cellStates.UNKNOWN, cellStates.UNKNOWN],
        [[2, 1], cellStates.UNKNOWN, cellStates.UNKNOWN],
        [[2, 2], cellStates.UNKNOWN, cellStates.UNKNOWN]
      ]);
    });
  });
});
