'use strict';

const GAME_STATUS = Object.freeze({
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
});

const CELL_CONTENT = Object.freeze({
  EMPTY: 'empty',
  MINE: 'mine',
});

const CELL_STATE = Object.freeze({
  CLOSED: 'closed',
  OPEN: 'open',
  FLAGGED: 'flagged',
});

const CELL_SURFACE = Object.freeze({
  CLOSED: CELL_STATE.CLOSED,
  OPEN: CELL_STATE.OPEN,
  FLAGGED: CELL_STATE.FLAGGED,
  EXPLODED: 'exploded',
  WRONG_FLAG: 'wrong-flag',
});

const CELL_PRESENTATION_KIND = Object.freeze({
  EMPTY: CELL_CONTENT.EMPTY,
  MINE: CELL_CONTENT.MINE,
  FLAG: 'flag',
  NUMBER: 'number',
});

const DEFAULT_SETTINGS = Object.freeze({
  rows: 10,
  cols: 10,
  minesCount: 15,
});

const STATUS_LABELS = Object.freeze({
  [GAME_STATUS.IDLE]: 'Ready to play',
  [GAME_STATUS.PLAYING]: 'In progress',
  [GAME_STATUS.WON]: 'Victory',
  [GAME_STATUS.LOST]: 'Game over',
});

const gameState = {
  rows: DEFAULT_SETTINGS.rows,
  cols: DEFAULT_SETTINGS.cols,
  minesCount: DEFAULT_SETTINGS.minesCount,
  status: GAME_STATUS.IDLE,
  gameTime: 0,
  flagsPlaced: 0,
  timerId: null,
  field: [],
  explodedCell: null,
  boardButtons: [],
};

const elements = {
  app: document.getElementById('app'),
  board: document.getElementById('board'),
  boardMeta: document.getElementById('board-meta'),
  flagsValue: document.getElementById('flags-value'),
  resetButton: document.getElementById('reset-button'),
  statusText: document.getElementById('status-text'),
  timeValue: document.getElementById('time-value'),
};

function createCell() {
  return {
    type: CELL_CONTENT.EMPTY,
    neighborMines: 0,
    state: CELL_STATE.CLOSED,
  };
}

function generateField(rows, cols, minesCount) {
  const totalCells = rows * cols;

  if (minesCount < 0 || minesCount >= totalCells) {
    throw new Error('minesCount must be between 0 and rows * cols - 1');
  }

  const nextField = Array.from({ length: rows }, () => (
    Array.from({ length: cols }, () => createCell())
  ));

  let placedMines = 0;

  while (placedMines < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    const currentCell = nextField[row][col];

    if (currentCell.type === CELL_CONTENT.MINE) {
      continue;
    }

    currentCell.type = CELL_CONTENT.MINE;
    placedMines += 1;
  }

  countNeighbourMines(nextField);

  return nextField;
}

function countNeighbourMines(currentField) {
  for (let row = 0; row < currentField.length; row += 1) {
    for (let col = 0; col < currentField[row].length; col += 1) {
      const currentCell = currentField[row][col];

      if (currentCell.type === CELL_CONTENT.MINE) {
        currentCell.neighborMines = 0;
        continue;
      }

      currentCell.neighborMines = getNeighbourCoords(row, col, currentField)
        .reduce((count, [neighbourRow, neighbourCol]) => (
          count + Number(currentField[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE)
        ), 0);
    }
  }
}

function getNeighbourCoords(row, col, currentField) {
  const coords = [];

  for (let rowShift = -1; rowShift <= 1; rowShift += 1) {
    for (let colShift = -1; colShift <= 1; colShift += 1) {
      if (rowShift === 0 && colShift === 0) {
        continue;
      }

      const nextRow = row + rowShift;
      const nextCol = col + colShift;

      if (isInsideField(nextRow, nextCol, currentField)) {
        coords.push([nextRow, nextCol]);
      }
    }
  }

  return coords;
}

function isInsideField(row, col, currentField) {
  return (
    row >= 0
    && row < currentField.length
    && col >= 0
    && col < currentField[0].length
  );
}

function isGameFinished() {
  return (
    gameState.status === GAME_STATUS.WON
    || gameState.status === GAME_STATUS.LOST
  );
}

function startGameIfNeeded() {
  if (gameState.status === GAME_STATUS.IDLE) {
    gameState.status = GAME_STATUS.PLAYING;
  }

  startTimer();
}

function openCell(row, col) {
  if (isGameFinished() || !isInsideField(row, col, gameState.field)) {
    return;
  }

  const currentCell = gameState.field[row][col];

  if (
    currentCell.state === CELL_STATE.OPEN
    || currentCell.state === CELL_STATE.FLAGGED
  ) {
    return;
  }

  startGameIfNeeded();

  if (currentCell.type === CELL_CONTENT.MINE) {
    currentCell.state = CELL_STATE.OPEN;
    gameState.explodedCell = { row, col };
    gameState.status = GAME_STATUS.LOST;
    stopTimer();
    render();
    return;
  }

  openEmptyArea(row, col);

  if (checkWin()) {
    finishGameAsWin();
  }

  render();
}

function openEmptyArea(row, col) {
  const currentCell = gameState.field[row][col];

  if (
    currentCell.state === CELL_STATE.OPEN
    || currentCell.state === CELL_STATE.FLAGGED
    || currentCell.type === CELL_CONTENT.MINE
  ) {
    return;
  }

  currentCell.state = CELL_STATE.OPEN;

  if (currentCell.neighborMines > 0) {
    return;
  }

  // Recursive flood-fill reveals the connected area of empty cells.
  getNeighbourCoords(row, col, gameState.field).forEach(([nextRow, nextCol]) => {
    openEmptyArea(nextRow, nextCol);
  });
}

function toggleFlag(row, col) {
  if (isGameFinished() || !isInsideField(row, col, gameState.field)) {
    return;
  }

  const currentCell = gameState.field[row][col];

  if (currentCell.state === CELL_STATE.OPEN) {
    return;
  }

  if (
    currentCell.state === CELL_STATE.CLOSED
    && gameState.flagsPlaced >= gameState.minesCount
  ) {
    return;
  }

  startGameIfNeeded();

  if (currentCell.state === CELL_STATE.FLAGGED) {
    currentCell.state = CELL_STATE.CLOSED;
    gameState.flagsPlaced -= 1;
  } else {
    currentCell.state = CELL_STATE.FLAGGED;
    gameState.flagsPlaced += 1;
  }

  render();
}

function checkWin() {
  return gameState.field.every((row) => row.every((cell) => (
    cell.type === CELL_CONTENT.MINE || cell.state === CELL_STATE.OPEN
  )));
}

function finishGameAsWin() {
  gameState.status = GAME_STATUS.WON;

  gameState.field.forEach((row) => {
    row.forEach((cell) => {
      if (cell.type === CELL_CONTENT.MINE && cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
      }
    });
  });

  gameState.flagsPlaced = gameState.minesCount;
  stopTimer();
}

function startTimer() {
  if (gameState.timerId !== null || gameState.status !== GAME_STATUS.PLAYING) {
    return;
  }

  gameState.timerId = window.setInterval(() => {
    gameState.gameTime += 1;
    updateHud();
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId === null) {
    return;
  }

  window.clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function resetGame() {
  stopTimer();

  gameState.status = GAME_STATUS.IDLE;
  gameState.gameTime = 0;
  gameState.flagsPlaced = 0;
  gameState.explodedCell = null;
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  initializeBoard();
  render();
}

function initializeBoard() {
  const fragment = document.createDocumentFragment();

  elements.board.replaceChildren();

  gameState.boardButtons = Array.from({ length: gameState.rows }, (_, rowIndex) => (
    Array.from({ length: gameState.cols }, (_, colIndex) => {
      const button = document.createElement('button');

      button.className = 'cell';
      button.type = 'button';
      button.dataset.row = String(rowIndex);
      button.dataset.col = String(colIndex);
      button.dataset.surface = CELL_SURFACE.CLOSED;
      button.dataset.kind = CELL_PRESENTATION_KIND.EMPTY;
      button.dataset.count = '0';
      button.textContent = '';
      button.disabled = false;
      button.setAttribute(
        'aria-label',
        getCellAriaLabel(rowIndex, colIndex, 'Closed cell'),
      );
      button.setAttribute('aria-keyshortcuts', 'F');
      button.style.setProperty(
        '--cell-delay',
        `${Math.min((rowIndex * gameState.cols + colIndex) * 12, 240)}ms`,
      );

      fragment.appendChild(button);

      return button;
    })
  ));

  elements.board.appendChild(fragment);

  elements.board.style.setProperty('--cols', String(gameState.cols));
  elements.board.setAttribute(
    'aria-label',
    `Minesweeper board ${gameState.rows} by ${gameState.cols}`,
  );
}

function getFlagsPlaced() {
  return gameState.flagsPlaced;
}

function getRemainingFlags() {
  return gameState.minesCount - gameState.flagsPlaced;
}

function updateHud() {
  const statusLabel = STATUS_LABELS[gameState.status];

  elements.app.dataset.status = gameState.status;
  elements.statusText.dataset.status = gameState.status;
  elements.statusText.textContent = statusLabel;
  elements.boardMeta.textContent = `${gameState.rows}x${gameState.cols} - ${gameState.minesCount} mines`;
  elements.timeValue.textContent = formatCounter(gameState.gameTime);
  elements.flagsValue.textContent = formatCounter(getRemainingFlags());
  elements.resetButton.textContent = getResetFace();
  elements.resetButton.setAttribute('aria-label', `Start new game. Current status: ${statusLabel}`);
  elements.resetButton.setAttribute('title', `Start new game. Status: ${statusLabel}`);
}

function getResetFace() {
  if (gameState.status === GAME_STATUS.WON) {
    return '\u{1F60E}';
  }

  if (gameState.status === GAME_STATUS.LOST) {
    return '\u{1F635}';
  }

  return '\u{1F642}';
}

function formatCounter(value) {
  const sign = value < 0 ? '-' : '';
  return `${sign}${String(Math.abs(value)).padStart(3, '0')}`;
}

function getCellAriaLabel(row, col, stateLabel) {
  return `Row ${row + 1}, column ${col + 1}, ${stateLabel.toLowerCase()}`;
}

function render() {
  updateHud();
  renderBoard();
}

function renderBoard() {
  gameState.field.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const button = gameState.boardButtons[rowIndex][colIndex];
      const presentation = getCellPresentation(cell, rowIndex, colIndex);

      applyCellPresentation(button, presentation, rowIndex, colIndex);
    });
  });
}

function applyCellPresentation(button, presentation, row, col) {
  button.dataset.surface = presentation.surface;
  button.dataset.kind = presentation.kind;
  button.dataset.count = presentation.count;
  button.disabled = isGameFinished() || presentation.surface === CELL_SURFACE.OPEN;
  button.textContent = presentation.text;
  button.setAttribute('aria-label', getCellAriaLabel(row, col, presentation.ariaLabel));
}

function getCellPresentation(cell, row, col) {
  if (gameState.status === GAME_STATUS.LOST) {
    if (
      gameState.explodedCell
      && gameState.explodedCell.row === row
      && gameState.explodedCell.col === col
    ) {
      return {
        surface: CELL_SURFACE.EXPLODED,
        kind: CELL_PRESENTATION_KIND.MINE,
        count: '0',
        text: '\u2739',
        ariaLabel: 'Exploded mine',
      };
    }

    if (cell.state === CELL_STATE.FLAGGED && cell.type !== CELL_CONTENT.MINE) {
      return {
        surface: CELL_SURFACE.WRONG_FLAG,
        kind: CELL_PRESENTATION_KIND.FLAG,
        count: '0',
        text: '\u2691',
        ariaLabel: 'Incorrect flag',
      };
    }

    if (cell.type === CELL_CONTENT.MINE && cell.state !== CELL_STATE.FLAGGED) {
      return {
        surface: CELL_SURFACE.OPEN,
        kind: CELL_PRESENTATION_KIND.MINE,
        count: '0',
        text: '\u2739',
        ariaLabel: 'Mine',
      };
    }
  }

  if (cell.state === CELL_STATE.FLAGGED) {
    return {
      surface: CELL_SURFACE.FLAGGED,
      kind: CELL_PRESENTATION_KIND.FLAG,
      count: '0',
      text: '\u2691',
      ariaLabel: cell.type === CELL_CONTENT.MINE ? 'Flag on a mine' : 'Flag',
    };
  }

  if (cell.state === CELL_STATE.OPEN) {
    if (cell.type === CELL_CONTENT.MINE) {
      return {
        surface: CELL_SURFACE.OPEN,
        kind: CELL_PRESENTATION_KIND.MINE,
        count: '0',
        text: '\u2739',
        ariaLabel: 'Mine',
      };
    }

    if (cell.neighborMines > 0) {
      return {
        surface: CELL_SURFACE.OPEN,
        kind: CELL_PRESENTATION_KIND.NUMBER,
        count: String(cell.neighborMines),
        text: String(cell.neighborMines),
        ariaLabel: `Open cell, ${cell.neighborMines} mine${cell.neighborMines === 1 ? '' : 's'} nearby`,
      };
    }

    return {
      surface: CELL_SURFACE.OPEN,
      kind: CELL_PRESENTATION_KIND.EMPTY,
      count: '0',
      text: '',
      ariaLabel: 'Open empty cell',
    };
  }

  return {
    surface: CELL_SURFACE.CLOSED,
    kind: CELL_PRESENTATION_KIND.EMPTY,
    count: '0',
    text: '',
    ariaLabel: 'Closed cell',
  };
}

function handleBoardClick(event) {
  const cellButton = event.target.closest('.cell');

  if (!cellButton) {
    return;
  }

  openCell(Number(cellButton.dataset.row), Number(cellButton.dataset.col));
}

function handleBoardContextMenu(event) {
  const cellButton = event.target.closest('.cell');

  if (!cellButton) {
    return;
  }

  event.preventDefault();
  toggleFlag(Number(cellButton.dataset.row), Number(cellButton.dataset.col));
}

function handleBoardKeyDown(event) {
  if (
    event.key.toLowerCase() !== 'f'
    || event.repeat
    || event.altKey
    || event.ctrlKey
    || event.metaKey
  ) {
    return;
  }

  const cellButton = event.target.closest('.cell');

  if (!cellButton) {
    return;
  }

  event.preventDefault();
  toggleFlag(Number(cellButton.dataset.row), Number(cellButton.dataset.col));
}

elements.board.addEventListener('click', handleBoardClick);
elements.board.addEventListener('contextmenu', handleBoardContextMenu);
elements.board.addEventListener('keydown', handleBoardKeyDown);
elements.resetButton.addEventListener('click', resetGame);

resetGame();

window.minesweeper = {
  CELL_CONTENT,
  CELL_STATE,
  GAME_STATUS,
  checkWin,
  createCell,
  gameState,
  generateField,
  getFlagsPlaced,
  getNeighbourCoords,
  getRemainingFlags,
  isInsideField,
  openEmptyArea,
  countNeighbourMines,
  openCell,
  toggleFlag,
  resetGame,
  get field() {
    return gameState.field;
  },
};
