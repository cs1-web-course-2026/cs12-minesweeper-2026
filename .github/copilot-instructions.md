# Copilot Instructions for Minesweeper

These instructions guide GitHub Copilot when generating or suggesting code for this project.
Follow all conventions below consistently across every file.

---

## Meaningful Naming

Always use full, descriptive names for every variable, parameter, and function. Never use
single-letter names or cryptic abbreviations.

### Variable naming

| Avoid | Use instead |
|-------|-------------|
| `r` | `row` |
| `c` | `col` |
| `nr` | `neighbourRow` |
| `nc` | `neighbourCol` |
| `dr` | `directionalRow` |
| `dc` | `directionalCol` |
| `i`, `j` (in grid loops) | `row`, `col` |
| `n` | `count` or a domain-specific name |
| `el` | `element` |
| `btn` | `button` |
| `val` | `value` |
| `arr` | `array` or a domain-specific name (e.g. `cells`) |

### Function naming

- Use verb-noun pairs that clearly describe what the function does.
- Examples: `revealCell`, `countAdjacentMines`, `toggleFlag`, `checkWinCondition`, `renderBoard`.

### General rules

- Prioritise readability over brevity.
- Names must be self-documenting: a reader should understand intent without needing a comment.
- Use camelCase for variables and functions, UPPER_SNAKE_CASE for top-level constants.

---

## Enums and Constants

Use constant objects (enum-style) instead of raw string or number literals wherever a fixed set
of values exists. Define these objects at the top of the relevant module.

### Pattern

```js
const CELL_STATE = {
  OPEN: 'open',
  CLOSED: 'closed',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const CELL_CONTENT = {
  MINE: 'mine',
  EMPTY: 'empty',
};
```

### Usage

```js
// Good
cell.state = CELL_STATE.CLOSED;
game.status = GAME_STATUS.PLAYING;

// Bad — never use raw literals scattered through the code
cell.state = 'closed';
game.status = 'playing';
```

### Rules

- Always reference the constant object in logic, conditionals, and assignments.
- Never duplicate the same string or magic number in more than one place.
- Group related constants into a single object.
- Place constant objects at the top of the file, before any functions.

---

## Spacing and Formatting

Consistent spacing makes the code easier to scan and review.

### Group separation

Separate distinct groups of code with a single blank line:

1. **Constants / configuration** — one block at the top.
2. **Helper / utility functions** — one block.
3. **Core logic functions** — one block.
4. **Rendering / DOM functions** — one block.
5. **`return` statement** — always preceded by a blank line when inside a function body.

### Example

```js
const CELL_STATE = {
  OPEN: 'open',
  CLOSED: 'closed',
  FLAGGED: 'flagged',
};

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
];


function countAdjacentMines(board, row, col) {
  let mineCount = 0;

  for (const [directionalRow, directionalCol] of DIRECTIONS) {
    const neighbourRow = row + directionalRow;
    const neighbourCol = col + directionalCol;

    if (isInBounds(board, neighbourRow, neighbourCol)) {
      if (board[neighbourRow][neighbourCol].hasMine) {
        mineCount++;
      }
    }
  }

  return mineCount;
}


function revealCell(board, row, col) {
  const cell = board[row][col];

  if (cell.state !== CELL_STATE.CLOSED) {
    return;
  }

  cell.state = CELL_STATE.OPEN;

  return cell;
}
```

### Rules

- One blank line between logical sections inside a function.
- Two blank lines between top-level function definitions.
- A blank line before every `return` statement (except single-expression arrow functions).
- No trailing whitespace.
- Use 2-space indentation consistently.

---

## General Best Practices

- **Pure functions where possible** — avoid side effects inside helpers that compute values.
- **Single responsibility** — each function should do exactly one thing.
- **No magic numbers** — define numeric constants (e.g. `const DEFAULT_MINE_COUNT = 10`).
- **Early returns** — use guard clauses to reduce nesting instead of deeply nested `if/else`.
- **Consistent style** — apply all rules above to every file in the project, not just new code.
