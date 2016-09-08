import {times, shuffle, take, isEqual} from 'lodash';

export default (configuration, row, column, shuffleMethod = shuffle) => {
  const [row_count, column_count] = configuration.dimensions;
  const cells = [];

  times(row_count, (row_index) => {
    times(column_count, (column_index) => {
      if (!isEqual([row, column], [row_index, column_index])) {
        cells.push([row_index, column_index]);
      }
    });
  });

  return take(shuffleMethod(cells), configuration.mine_count);
};
