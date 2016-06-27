# mines

A pure JS implementation of the minesweeper game.

## Installation

```
npm install mines --save
```

## Usage

```javascript
var m = mines();
m.onGameStateChange(
  function (state, oldState) { console.log('game changed', oldState, state); }
);
m.onCellStateChange(
  function (cell, state, oldState) { console.log('cell state', cell, oldState, state); }
);
m.state();
m.renderAsString();
m.reveal([4, 4]);
```

## Release History

* 0.0.1 Initial release (that does nothing)
* 0.0.2 Another release that transpiles to dist folder (but still does nothing)
* 0.1.0 Partially completed implementation (no events and no marking mines)
* 0.2.0 Slightly more complete implementation (still no marking mines)
* 0.3.0 Full implementation of game except final marking of correct/incorrect cell state for marked mines
