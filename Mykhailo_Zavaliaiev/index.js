'use strict';

const GAME_STATUS = Object.freeze({
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
});

const CELL_TYPE = Object.freeze({
  EMPTY: 'empty',
  MINE: 'mine',
});

const CELL_STATE = Object.freeze({
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
});

const DEFAULT_SETTINGS = Object.freeze({
  rows: 10,
  cols: 10,
  minesCount: 15,
});

const STATUS_LABELS = Object.freeze({
  [GAME_STATUS.PROCESS]: 'In progress',
  [GAME_STATUS.WIN]: 'Victory',
  [GAME_STATUS.LOSE]: 'Game over',
});

const gameState = {
  rows: DEFAULT_SETTINGS.rows,
  cols: DEFAULT_SETTINGS.cols,
  minesCount: DEFAULT_SETTINGS.minesCount,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
};

let field = [];
let explodedCell = null;
let boardButtons = [];

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
    type: CELL_TYPE.EMPTY,
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

    if (currentCell.type === CELL_TYPE.MINE) {
      continue;
    }

    currentCell.type = CELL_TYPE.MINE;
    placedMines += 1;
  }

  countNeighbourMines(nextField);

  return nextField;
}

function countNeighbourMines(currentField) {
  for (let row = 0; row < currentField.length; row += 1) {
    for (let col = 0; col < currentField[row].length; col += 1) {
      const currentCell = currentField[row][col];

      if (currentCell.type === CELL_TYPE.MINE) {
        currentCell.neighborMines = 0;
        continue;
      }

      currentCell.neighborMines = getNeighbourCoords(row, col, currentField)
        .reduce((count, [neighbourRow, neighbourCol]) => (
          count + Number(currentField[neighbourRow][neighbourCol].type === CELL_TYPE.MINE)
        ), 0);
    }
  }
}

function getNeighbourCoords(row, col, currentField = field) {
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

function isInsideField(row, col, currentField = field) {
  return (
    row >= 0
    && row < currentField.length
    && col >= 0
    && col < currentField[0].length
  );
}

function openCell(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS || !isInsideField(row, col)) {
    return;
  }

  const currentCell = field[row][col];

  if (
    currentCell.state === CELL_STATE.OPENED
    || currentCell.state === CELL_STATE.FLAGGED
  ) {
    return;
  }

  startTimer();

  if (currentCell.type === CELL_TYPE.MINE) {
    currentCell.state = CELL_STATE.OPENED;
    explodedCell = { row, col };
    gameState.status = GAME_STATUS.LOSE;
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
  const currentCell = field[row][col];

  if (
    currentCell.state === CELL_STATE.OPENED
    || currentCell.state === CELL_STATE.FLAGGED
    || currentCell.type === CELL_TYPE.MINE
  ) {
    return;
  }

  currentCell.state = CELL_STATE.OPENED;

  if (currentCell.neighborMines > 0) {
    return;
  }

  // Recursive flood-fill reveals the connected area of empty cells.
  getNeighbourCoords(row, col).forEach(([nextRow, nextCol]) => {
    openEmptyArea(nextRow, nextCol);
  });
}

function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS || !isInsideField(row, col)) {
    return;
  }

  const currentCell = field[row][col];

  if (currentCell.state === CELL_STATE.OPENED) {
    return;
  }

  if (
    currentCell.state === CELL_STATE.CLOSED
    && getFlagsPlaced() >= gameState.minesCount
  ) {
    return;
  }

  startTimer();

  currentCell.state = currentCell.state === CELL_STATE.FLAGGED
    ? CELL_STATE.CLOSED
    : CELL_STATE.FLAGGED;

  render();
}

function checkWin() {
  return field.every((row) => row.every((cell) => (
    cell.type === CELL_TYPE.MINE || cell.state === CELL_STATE.OPENED
  )));
}

function finishGameAsWin() {
  gameState.status = GAME_STATUS.WIN;

  field.forEach((row) => {
    row.forEach((cell) => {
      if (cell.type === CELL_TYPE.MINE && cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
      }
    });
  });

  stopTimer();
}

function startTimer() {
  if (gameState.timerId !== null || gameState.status !== GAME_STATUS.PROCESS) {
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

  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  explodedCell = null;
  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  initializeBoard();
  render();
}

function initializeBoard() {
  const fragment = document.createDocumentFragment();

  boardButtons = Array.from({ length: gameState.rows }, (_, rowIndex) => (
    Array.from({ length: gameState.cols }, (_, colIndex) => {
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'cell';
      button.dataset.row = String(rowIndex);
      button.dataset.col = String(colIndex);
      button.style.setProperty(
        '--cell-index',
        String((rowIndex * gameState.cols) + colIndex),
      );

      fragment.append(button);

      return button;
    })
  ));

  elements.board.style.setProperty('--cols', String(gameState.cols));
  elements.board.setAttribute(
    'aria-label',
    `Minesweeper board ${gameState.rows} by ${gameState.cols}`,
  );
  elements.board.replaceChildren(fragment);
}

function getFlagsPlaced() {
  return field.reduce((count, row) => (
    count + row.filter((cell) => cell.state === CELL_STATE.FLAGGED).length
  ), 0);
}

function getRemainingFlags() {
  return gameState.minesCount - getFlagsPlaced();
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
  if (gameState.status === GAME_STATUS.WIN) {
    return '\u{1F60E}';
  }

  if (gameState.status === GAME_STATUS.LOSE) {
    return '\u{1F635}';
  }

  return '\u{1F642}';
}

function formatCounter(value) {
  const sign = value < 0 ? '-' : '';
  return `${sign}${String(Math.abs(value)).padStart(3, '0')}`;
}

function render() {
  updateHud();
  renderBoard();
}

function renderBoard() {
  field.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const button = boardButtons[rowIndex][colIndex];
      const presentation = getCellPresentation(cell, rowIndex, colIndex);

      applyCellPresentation(button, presentation);
    });
  });
}

function applyCellPresentation(button, presentation) {
  button.dataset.surface = presentation.surface;
  button.dataset.kind = presentation.kind;
  button.dataset.count = presentation.count;
  button.disabled = gameState.status !== GAME_STATUS.PROCESS || presentation.surface === 'opened';
  button.textContent = presentation.text;
  button.setAttribute('aria-label', presentation.ariaLabel);
}

function getCellPresentation(cell, row, col) {
  if (gameState.status === GAME_STATUS.LOSE) {
    if (explodedCell && explodedCell.row === row && explodedCell.col === col) {
      return {
        surface: 'exploded',
        kind: CELL_TYPE.MINE,
        count: '0',
        text: '\u2739',
        ariaLabel: 'Exploded mine',
      };
    }

    if (cell.state === CELL_STATE.FLAGGED && cell.type !== CELL_TYPE.MINE) {
      return {
        surface: 'wrong-flag',
        kind: 'flag',
        count: '0',
        text: '\u2691',
        ariaLabel: 'Incorrect flag',
      };
    }

    if (cell.type === CELL_TYPE.MINE && cell.state !== CELL_STATE.FLAGGED) {
      return {
        surface: 'opened',
        kind: CELL_TYPE.MINE,
        count: '0',
        text: '\u2739',
        ariaLabel: 'Mine',
      };
    }
  }

  if (cell.state === CELL_STATE.FLAGGED) {
    return {
      surface: 'flagged',
      kind: 'flag',
      count: '0',
      text: '\u2691',
      ariaLabel: cell.type === CELL_TYPE.MINE ? 'Flag on a mine' : 'Flag',
    };
  }

  if (cell.state === CELL_STATE.OPENED) {
    if (cell.type === CELL_TYPE.MINE) {
      return {
        surface: 'opened',
        kind: CELL_TYPE.MINE,
        count: '0',
        text: '\u2739',
        ariaLabel: 'Mine',
      };
    }

    if (cell.neighborMines > 0) {
      return {
        surface: 'opened',
        kind: 'number',
        count: String(cell.neighborMines),
        text: String(cell.neighborMines),
        ariaLabel: `Open cell, ${cell.neighborMines} mine${cell.neighborMines === 1 ? '' : 's'} nearby`,
      };
    }

    return {
      surface: 'opened',
      kind: CELL_TYPE.EMPTY,
      count: '0',
      text: '',
      ariaLabel: 'Open empty cell',
    };
  }

  return {
    surface: 'closed',
    kind: CELL_TYPE.EMPTY,
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

elements.board.addEventListener('click', handleBoardClick);
elements.board.addEventListener('contextmenu', handleBoardContextMenu);
elements.resetButton.addEventListener('click', resetGame);

resetGame();

window.minesweeper = {
  gameState,
  generateField,
  countNeighbourMines,
  openCell,
  toggleFlag,
  resetGame,
  get field() {
    return field;
  },
};
