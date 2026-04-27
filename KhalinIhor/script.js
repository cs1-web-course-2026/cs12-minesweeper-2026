'use strict';

const CELL_STATE = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
  FLAGGED: 'flagged'
});

const GAME_STATUS = Object.freeze({
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost'
});

const CELL_CONTENT = Object.freeze({
  MINE: 'mine',
  EMPTY: 'empty'
});

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  flagsPlaced: 0,
  status: GAME_STATUS.IDLE,
  gameTime: 0,
  timerId: null,
  explodedCell: null,
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

const dom = {
  board: null,
  timer: null,
  flags: null,
  restartButton: null,
  message: null
};

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

function countFlaggedCells(field) {
  let flags = 0;

  for (let row = 0; row < field.length; row += 1) {
    for (let col = 0; col < (field[row]?.length ?? 0); col += 1) {
      if (field[row][col].state === CELL_STATE.FLAGGED) {
        flags += 1;
      }
    }
  }

  return flags;
}

function getFlagsLeft(minesCount, flagsPlaced) {
  return minesCount - flagsPlaced;
}

function formatCounter(value) {
  return String(value).padStart(3, '0');
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
  gameState.flagsPlaced = countFlaggedCells(field);
  gameState.status = GAME_STATUS.PLAYING;
  gameState.gameTime = 0;
  gameState.explodedCell = null;

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

function startTimer() {
  if (gameState.timerId !== null) {
    return;
  }

  gameState.timerId = setInterval(() => {
    gameState.gameTime += 1;
    renderIndicators();
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
      if (cell.type !== CELL_CONTENT.MINE && cell.state === CELL_STATE.OPEN) {
        openedSafeCells += 1;
      }
    }
  }

  if (openedSafeCells === safeCells) {
    gameState.status = GAME_STATUS.WON;
    stopTimer();
  }
}

function openCellRecursive(row, col) {
  if (!isInsideBoard(row, col)) {
    return;
  }

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPEN || cell.state === CELL_STATE.FLAGGED) {
    return;
  }

  cell.state = CELL_STATE.OPEN;

  if (cell.type === CELL_CONTENT.MINE) {
    gameState.status = GAME_STATUS.LOST;
    gameState.explodedCell = { row, col };
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
  if (gameState.status !== GAME_STATUS.PLAYING || !isInsideBoard(row, col)) {
    return;
  }

  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPEN || cell.state === CELL_STATE.FLAGGED) {
    return;
  }

  if (gameState.timerId === null) {
    startTimer();
  }

  openCellRecursive(row, col);

  if (gameState.status === GAME_STATUS.PLAYING) {
    checkWinCondition();
  }
}

function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PLAYING || !isInsideBoard(row, col)) {
    return;
  }

  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPEN) {
    return;
  }

  if (cell.state === CELL_STATE.CLOSED) {
    if (getFlagsLeft(gameState.minesCount, gameState.flagsPlaced) === 0) {
      return;
    }
    startTimer();
    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsPlaced += 1;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    startTimer();
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsPlaced -= 1;
  }
}

function applyCellClasses(button, cell, row, col) {
  const isGameOver = gameState.status !== GAME_STATUS.PLAYING;
  const coordinatesLabel = `Рядок ${row + 1}, стовпець ${col + 1}`;
  const isExploded =
    gameState.explodedCell !== null &&
    gameState.explodedCell.row === row &&
    gameState.explodedCell.col === col;

  if (cell.state === CELL_STATE.OPEN) {
    button.classList.add('cell--open');

    if (cell.type === CELL_CONTENT.MINE) {
      button.classList.add(isExploded ? 'cell--mine-hit' : 'cell--mine');
      button.setAttribute(
        'aria-label',
        `${coordinatesLabel}, ${isExploded ? 'відкрита, підірвана міна' : 'відкрита, міна'}`
      );
      return;
    }

    if (cell.neighbourMines > 0) {
      button.classList.add(`cell--n${cell.neighbourMines}`);
      button.textContent = String(cell.neighbourMines);
      button.setAttribute(
        'aria-label',
        `${coordinatesLabel}, відкрита, сусідніх мін: ${cell.neighbourMines}`
      );
    } else {
      button.setAttribute('aria-label', `${coordinatesLabel}, відкрита`);
    }
    return;
  }

  button.classList.add('cell--closed');

  if (cell.state === CELL_STATE.FLAGGED) {
    button.classList.add('cell--flag');
    if (isGameOver) {
      button.classList.add(cell.type === CELL_CONTENT.MINE ? 'cell--mine' : 'cell--wrong');
    }
    button.setAttribute('aria-label', `${coordinatesLabel}, позначена прапорцем`);
    return;
  }

  if (isGameOver && cell.type === CELL_CONTENT.MINE) {
    button.classList.remove('cell--closed');
    button.classList.add('cell--open', 'cell--mine');
    button.setAttribute('aria-label', `${coordinatesLabel}, відкрита, міна`);
    return;
  }

  button.setAttribute('aria-label', `${coordinatesLabel}, закрита`);
}

function renderBoard() {
  const fragment = document.createDocumentFragment();
  dom.board.style.setProperty('--board-cols', String(gameState.cols));
  dom.board.setAttribute('aria-label', `Сітка ${gameState.rows} на ${gameState.cols}`);

  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = gameState.field[row][col];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.row = String(row);
      button.dataset.col = String(col);

      applyCellClasses(button, cell, row, col);

      if (cell.state === CELL_STATE.OPEN || gameState.status !== GAME_STATUS.PLAYING) {
        button.disabled = true;
      }

      fragment.append(button);
    }
  }

  dom.board.replaceChildren(fragment);
}

function renderIndicators() {
  dom.flags.textContent = formatCounter(getFlagsLeft(gameState.minesCount, gameState.flagsPlaced));
  dom.timer.textContent = formatCounter(gameState.gameTime);
}

function renderMessage() {
  dom.message.classList.remove('game-message--win', 'game-message--lose');

  if (gameState.status === GAME_STATUS.WON) {
    dom.message.textContent = 'Перемога! Усі безпечні клітинки відкрито.';
    dom.message.classList.add('game-message--win');
    return;
  }

  if (gameState.status === GAME_STATUS.LOST) {
    dom.message.textContent = 'Поразка! Ви підірвалися на міні.';
    dom.message.classList.add('game-message--lose');
    return;
  }

  dom.message.textContent = '';
}

function renderGame() {
  renderIndicators();
  renderMessage();
  renderBoard();
}

function extractCellCoordinates(event) {
  const target = event.target.closest('.cell');

  if (!target || !dom.board.contains(target)) {
    return null;
  }

  return {
    row: Number(target.dataset.row),
    col: Number(target.dataset.col)
  };
}

function handleCellOpen(event) {
  const coordinates = extractCellCoordinates(event);
  if (coordinates === null) {
    return;
  }

  openCell(coordinates.row, coordinates.col);
  renderGame();
}

function handleFlagToggle(event) {
  event.preventDefault();

  const coordinates = extractCellCoordinates(event);
  if (coordinates === null) {
    return;
  }

  toggleFlag(coordinates.row, coordinates.col);
  renderGame();
}

function restartGame() {
  const field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  setField(field);
  renderGame();
}

function initDom() {
  dom.board = document.querySelector('[data-board]');
  dom.timer = document.querySelector('[data-time]');
  dom.flags = document.querySelector('[data-flags]');
  dom.restartButton = document.querySelector('[data-restart]');
  dom.message = document.querySelector('[data-message]');

  dom.board.addEventListener('click', handleCellOpen);
  dom.board.addEventListener('contextmenu', handleFlagToggle);
  dom.restartButton.addEventListener('click', restartGame);
}

function initGame() {
  initDom();
  restartGame();
}

document.addEventListener('DOMContentLoaded', initGame);
