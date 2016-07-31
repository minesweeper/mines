# mines

A pure JS implementation of the minesweeper game.

## Installation

```
npm install mines --save
```

## Usage

```javascript
var mines = require('mines');
var m = mines.create({preset: 'expert'});
m.onGameStateChange(
  function (state, oldState) {
    console.log('game changed', oldState, state);
    console.log(m.renderAsString());
  }
);
m.onCellStateChange(
  function (cell, state, oldState) { console.log('cell', cell, 'changed from', oldState, 'to', state); }
);
m.reveal([4, 4]);
m.reveal([2, 10]);
m.mark([5, 12]);
```

## Development

```
npm install
npm test
npm run dist
```

```javascript
var mines = require('./dist');
```

## Release History

* 0.0.1 Initial release (that does nothing)
* 0.0.2 Another release that transpiles to dist folder (but still does nothing)
* 0.1.0 Partially completed implementation (no events and no marking mines)
* 0.2.0 Slightly more complete implementation (still no marking mines)
* 0.3.0 Full implementation of game except final marking of correct/incorrect cell state for marked mines
* 0.4.0 Full implementation of game with marking mines and replace cell state with emoji
* 0.5.0 Added chording to the game to support chording via double clicking the UI
* 1.0.0 restructure module to expose create, cellStates and gameStates
* 1.0.1 fire all events when game is reset
* 1.0.2 expose createTest method (for convenience in writing tests for robot player)
* 1.1.0 replace 'profile' with 'preset' and fire remaining mine count event when game is reset
