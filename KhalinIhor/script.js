'use strict';

const CELL_STATE = Object.freeze({
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged'
});

const GAME_STATUS = Object.freeze({
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose'
});

const CELL_CONTENT = Object.freeze({
  MINE: 'mine',
  EMPTY: 'empty'
});

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: []
};

const neighbourDirections = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
];

function isInsideBoard(row, col) {
  return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

function countMinesInField(field) {
  let mines = 0;

  for (let row = 0; row < field.length; row += 1) {
    for (let col = 0; col < (field[row]?.length ?? 0); col += 1) {
      if (field[row][col].type === CELL_CONTENT.MINE) {
        mines += 1;
      }
    }
  }

  return mines;
}

function generateField(rows, cols, minesCount) {
  const safeRows = Math.max(0, Math.trunc(rows));
  const safeCols = Math.max(0, Math.trunc(cols));
  const maxMines = safeRows * safeCols;
  const minesToPlace = Math.min(Math.max(0, Math.trunc(minesCount)), maxMines);

  const field = Array.from({ length: safeRows }, () =>
    Array.from({ length: safeCols }, () => ({
      type: CELL_CONTENT.EMPTY,
      state: CELL_STATE.CLOSED,
      neighbourMines: 0
    }))
  );

  let placedMines = 0;
  while (placedMines < minesToPlace) {
    const row = Math.floor(Math.random() * safeRows);
    const col = Math.floor(Math.random() * safeCols);

    if (field[row][col].type !== CELL_CONTENT.MINE) {
      field[row][col].type = CELL_CONTENT.MINE;
      placedMines += 1;
    }
  }

  countNeighbourMines(field);
  return field;
}

function setField(field) {
  gameState.field = field;
  gameState.rows = field.length;
  gameState.cols = field[0]?.length ?? 0;
  gameState.minesCount = countMinesInField(field);
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;

  stopTimer();
  countNeighbourMines(gameState.field);
}

function countNeighbourMines(field) {
  const rows = field.length;
  const cols = field[0]?.length ?? 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = field[row][col];
      if (cell.type === CELL_CONTENT.MINE) {
        continue;
      }

      let neighbourMines = 0;

      for (const [directionalRow, directionalCol] of neighbourDirections) {
        const nextRow = row + directionalRow;
        const nextCol = col + directionalCol;
        const inside = nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols;

        if (inside && field[nextRow][nextCol].type === CELL_CONTENT.MINE) {
          neighbourMines += 1;
        }
      }

      cell.neighbourMines = neighbourMines;
    }
  }
}

function startTimer(onTick) {
  if (gameState.timerId !== null) {
    return;
  }

  gameState.timerId = setInterval(() => {
    gameState.gameTime += 1;

    if (typeof onTick === 'function') {
      onTick(gameState.gameTime);
    }
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId === null) {
    return;
  }

  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function checkWinCondition() {
  const safeCells = gameState.rows * gameState.cols - gameState.minesCount;
  let openedSafeCells = 0;

  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = gameState.field[row][col];
      if (cell.type !== CELL_CONTENT.MINE && cell.state === CELL_STATE.OPENED) {
        openedSafeCells += 1;
      }
    }
  }

  if (openedSafeCells === safeCells) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
  }
}

function openCellRecursive(row, col) {
  if (!isInsideBoard(row, col)) {
    return;
  }

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
    return;
  }

  cell.state = CELL_STATE.OPENED;

  if (cell.type === CELL_CONTENT.MINE) {
    gameState.status = GAME_STATUS.LOSE;
    stopTimer();
    return;
  }

  if (cell.neighbourMines === 0) {
    for (const [directionalRow, directionalCol] of neighbourDirections) {
      openCellRecursive(row + directionalRow, col + directionalCol);
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS || !isInsideBoard(row, col)) {
    return;
  }

  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
    return;
  }

  if (gameState.timerId === null) {
    startTimer();
  }

  openCellRecursive(row, col);

  if (gameState.status === GAME_STATUS.PROCESS) {
    checkWinCondition();
  }
}

function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS || !isInsideBoard(row, col)) {
    return;
  }

  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPENED) {
    return;
  }

  if (gameState.timerId === null) {
    startTimer();
  }

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }
}
