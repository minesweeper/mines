import randomlyPlaceMines from '.';
import {reverse} from 'lodash';

describe('randomlyPlaceMines', () => {
  it('should choose specified number of mines and exclude specified row and column', () => {
    const row = 0;
    const column = 0;
    const configuration = {dimensions: [1, 2], mine_count: 1};
    const mines = randomlyPlaceMines(configuration, row, column);
    assert.deepEqual(mines, [[0, 1]]);
  });

  it('should choose specified number of mines and exclude specified row and column', () => {
    const row = 0;
    const column = 0;
    const configuration = {dimensions: [5, 5], mine_count: 5};
    const mines = randomlyPlaceMines(configuration, row, column, reverse);
    assert.deepEqual(mines, [[4, 4], [4, 3], [4, 2], [4, 1], [4, 0]]);
  });
});
