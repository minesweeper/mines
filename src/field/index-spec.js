import field from '.';
import fieldState from '../fieldState';
import {times} from 'lodash';

describe('default field', () => {
  const dimensions = [1, 3];
  let testField = null;

  beforeEach(() => { testField = field(dimensions); });

  it('should be initialised with all cells having UNKNOWN cell state and no mines', () => {
    const [row_count, column_count] = dimensions;
    times(row_count, (row) => {
      times(column_count, (column) => {
        assert.equal(fieldState.UNKNOWN, testField.cellState([row, column]));
      });
    });
    assert.equal(false, testField.minesPlaced());
  });
});

describe('with a mine placed', () => {
  const dimensions = [1, 3];
  const mine_cell = [0, 0];
  let testField = null;

  beforeEach(() => {
    testField = field(dimensions);
    testField.placeMines([mine_cell]);
  });

  it('should have mines after mines are assigned', () => {
    assert.equal(true, testField.minesPlaced());
    assert(testField.reveal(mine_cell));
  });

  it('should have allCellsWithoutMinesRevealed when all non mine cells have been revealed', () => {
    let cell = null;
    assert.equal(false, testField.allCellsWithoutMinesRevealed());

    cell = [0, 1];
    assert(!testField.reveal(cell));
    assert.equal(testField.cellState(cell), fieldState[1]);
    assert.equal(false, testField.allCellsWithoutMinesRevealed());

    cell = [0, 2];
    assert(!testField.reveal(cell));
    assert.equal(testField.cellState(cell), fieldState[0]);
    assert(testField.allCellsWithoutMinesRevealed());
  });
});

describe('chording', () => {
  const dimensions = [3, 3];
  const mine_cell = [0, 0];
  let testField = null;

  beforeEach(() => {
    testField = field(dimensions);
    testField.placeMines([mine_cell]);
  });

  it('is ignored when a cell is marked', () => {
    const cell = [0, 0];
    assert.equal(testField.mark(cell), fieldState.MARKED);
    assert.equal(testField.chord(cell), false);
  });

  it('is ignored when a cell is marked as question', () => {
    const cell = [0, 0];
    assert.equal(testField.mark(cell), fieldState.MARKED);
    assert.equal(testField.mark(cell), fieldState.QUESTION);
    assert.equal(testField.chord(cell), false);
  });

  it('is ignored if the cell is a number and marked neighbours doesn\'t match the number', () => {
    const cell = [1, 1];
    assert.equal(testField.reveal(cell), false);
    assert.equal(testField.cellState(cell), fieldState[1]);
    assert.equal(testField.chord(cell), false);
  });

  it('acts as a reveal if the mine is not revealed and not marked', () => {
    const mineCell = [0, 0];
    const nonMineCell = [1, 1];
    assert.equal(testField.reveal(nonMineCell), false);
    assert.equal(testField.cellState(nonMineCell), fieldState[1]);
    assert.equal(testField.chord(mineCell), true);
    assert.equal(testField.cellState(mineCell), fieldState.EXPLODED_MINE);
  });

  it('when marked correctly, reveals all unknown cells when the cell is a number and marked neighbours match that number', () => {
    assert.equal(testField.mark([0, 0]), fieldState.MARKED);
    assert.equal(testField.reveal([1, 1]), false);
    assert.equal(testField.cellState([1, 1]), fieldState[1]);
    assert.equal(testField.chord([1, 1]), false);
    assert.equal(testField.cellState([0, 0]), fieldState.MARKED);
    assert.equal(testField.cellState([0, 1]), fieldState[1]);
    assert.equal(testField.cellState([0, 2]), fieldState[0]);
    assert.equal(testField.cellState([1, 0]), fieldState[1]);
    assert.equal(testField.cellState([1, 1]), fieldState[1]);
    assert.equal(testField.cellState([1, 2]), fieldState[0]);
    assert.equal(testField.cellState([2, 0]), fieldState[0]);
    assert.equal(testField.cellState([2, 1]), fieldState[0]);
    assert.equal(testField.cellState([2, 2]), fieldState[0]);
    assert.equal(testField.allCellsWithoutMinesRevealed(), true);
  });

  it('even when marked incorrectly, reveals all unknown cells when the cell is a number and marked neighbours match that number', () => {
    assert.equal(testField.mark([0, 1]), fieldState.MARKED);
    assert.equal(testField.reveal([1, 1]), false);
    assert.equal(testField.cellState([1, 1]), fieldState[1]);
    assert.equal(testField.chord([1, 1]), true);
    assert.equal(testField.cellState([0, 0]), fieldState.EXPLODED_MINE);
    assert.equal(testField.cellState([0, 1]), fieldState.INCORRECTLY_MARKED_MINE);
    assert.equal(testField.cellState([0, 2]), fieldState[0]);
    assert.equal(testField.cellState([1, 0]), fieldState[1]);
    assert.equal(testField.cellState([1, 1]), fieldState[1]);
    assert.equal(testField.cellState([1, 2]), fieldState[0]);
    assert.equal(testField.cellState([2, 0]), fieldState[0]);
    assert.equal(testField.cellState([2, 1]), fieldState[0]);
    assert.equal(testField.cellState([2, 2]), fieldState[0]);
    assert.equal(testField.allCellsWithoutMinesRevealed(), false);
  });

});
