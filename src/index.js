import create from './create';
import cellStates from './cellStates';
import gameStates from './gameStates';
import toOptions from './toOptions';

module.exports = {
  create,
  cellStates,
  gameStates,
  createTest: (fieldString) => create(toOptions(fieldString))
};
