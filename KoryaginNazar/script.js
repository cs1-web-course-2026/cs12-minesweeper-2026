'use strict';

const CELL_CONTENT = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPEN: 'open',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const DEFAULT_GAME_CONFIGURATION = {
  rows: 10,
  cols: 10,
  minesCount: 15,
};

const UI_TEXT = {
  STARTED: 'Гра розпочалась',
  WON: 'Перемога! Всі безпечні клітинки відкриті.',
  LOST: 'Поразка! Ви натрапили на міну.',
};

const RESTART_BUTTON_FACE = {
  PLAYING: '🙂',
  WON: '😎',
  LOST: '😵',
};

const NEIGHBOUR_DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const domElements = {
  playingField: document.querySelector('#playing-field'),
  flagsCounter: document.querySelector('#flags-counter'),
  timerCounter: document.querySelector('#timer-counter'),
  restartButton: document.querySelector('#restart-button'),
  statusMessage: document.querySelector('#status-message'),
};

const timerAdapter = {
  start(onTick) {
    return window.setInterval(onTick, 1000);
  },
  stop(timerId) {
    window.clearInterval(timerId);
  },
};

let activeGameField = [];
let activeGameState = null;

function createInitialGameState(rows, cols, minesCount) {
  const initialState = {
    rows,
    cols,
    minesCount,
    status: GAME_STATUS.PLAYING,
    gameTime: 0,
    timerId: null,
    flagsPlacedCount: 0,
    explodedMinePosition: null,
    areMinesPlaced: false,
  };

  return initialState;
}

function createEmptyCell() {
  const emptyCell = {
    type: CELL_CONTENT.EMPTY,
    neighbourMines: 0,
    state: CELL_STATE.CLOSED,
  };

  return emptyCell;
}

function createEmptyField(rows, cols) {
  const field = [];

  for (let row = 0; row < rows; row += 1) {
    const rowCells = [];

    for (let col = 0; col < cols; col += 1) {
      rowCells.push(createEmptyCell());
    }

    field.push(rowCells);
  }

  return field;
}

function isInBounds(field, row, col) {
  if (!Array.isArray(field) || field.length === 0 || !Array.isArray(field[0])) {
    return false;
  }

  const isCorrectRow = row >= 0 && row < field.length;

  if (!isCorrectRow || !Array.isArray(field[row])) {
    return false;
  }

  const isCorrectCol = col >= 0 && col < field[row].length;

  return isCorrectRow && isCorrectCol;
}

function countNeighbourMines(field) {
  for (let row = 0; row < field.length; row += 1) {
    for (let col = 0; col < field[row].length; col += 1) {
      const currentCell = field[row][col];

      if (currentCell.type === CELL_CONTENT.MINE) {
        continue;
      }

      let neighbourMinesCount = 0;

      for (const [directionalRow, directionalCol] of NEIGHBOUR_DIRECTIONS) {
        const neighbourRow = row + directionalRow;
        const neighbourCol = col + directionalCol;

        if (!isInBounds(field, neighbourRow, neighbourCol)) {
          continue;
        }

        if (field[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE) {
          neighbourMinesCount += 1;
        }
      }

      currentCell.neighbourMines = neighbourMinesCount;
    }
  }

  return field;
}

function generateField(rows, cols, minesCount) {
  const cellsCount = rows * cols;

  if (minesCount < 0 || minesCount >= cellsCount) {
    throw new RangeError(
      'minesCount must be greater than or equal to 0 and smaller than total cells count.',
    );
  }

  const field = createEmptyField(rows, cols);
  const coordinates = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      coordinates.push({ row, col });
    }
  }

  for (let index = coordinates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryCoordinate = coordinates[index];

    coordinates[index] = coordinates[randomIndex];
    coordinates[randomIndex] = temporaryCoordinate;
  }

  for (let mineIndex = 0; mineIndex < minesCount; mineIndex += 1) {
    const mineCoordinate = coordinates[mineIndex];
    const mineRow = mineCoordinate.row;
    const mineCol = mineCoordinate.col;

    field[mineRow][mineCol].type = CELL_CONTENT.MINE;
  }

  countNeighbourMines(field);

  return field;
}

function placeMinesAvoidingFirstOpen(field, minesCount, protectedRow, protectedCol) {
  const rows = field.length;
  const cols = field[0].length;
  const totalCellsCount = rows * cols;

  if (minesCount < 0 || minesCount >= totalCellsCount) {
    throw new RangeError(
      'minesCount must be greater than or equal to 0 and smaller than total cells count.',
    );
  }

  const candidateCoordinates = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const currentCell = field[row][col];

      currentCell.type = CELL_CONTENT.EMPTY;
      currentCell.neighbourMines = 0;

      if (row === protectedRow && col === protectedCol) {
        continue;
      }

      candidateCoordinates.push({ row, col });
    }
  }

  for (let index = candidateCoordinates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryCoordinate = candidateCoordinates[index];

    candidateCoordinates[index] = candidateCoordinates[randomIndex];
    candidateCoordinates[randomIndex] = temporaryCoordinate;
  }

  for (let mineIndex = 0; mineIndex < minesCount; mineIndex += 1) {
    const mineCoordinate = candidateCoordinates[mineIndex];

    field[mineCoordinate.row][mineCoordinate.col].type = CELL_CONTENT.MINE;
  }

  countNeighbourMines(field);

  return field;
}

function revealAllMines(field) {
  for (let row = 0; row < field.length; row += 1) {
    for (let col = 0; col < field[row].length; col += 1) {
      const currentCell = field[row][col];

      if (currentCell.type !== CELL_CONTENT.MINE) {
        continue;
      }

      currentCell.state = CELL_STATE.OPEN;
    }
  }

  return field;
}

function checkWinCondition(field, minesCount) {
  const totalCellsCount = field.length * field[0].length;
  let openedCellsCount = 0;

  for (let row = 0; row < field.length; row += 1) {
    for (let col = 0; col < field[row].length; col += 1) {
      if (field[row][col].state === CELL_STATE.OPEN) {
        openedCellsCount += 1;
      }
    }
  }

  const shouldBeOpenedCellsCount = totalCellsCount - minesCount;

  return openedCellsCount === shouldBeOpenedCellsCount;
}

function stopGameTimer(currentGameState, currentTimerAdapter) {
  if (currentGameState.timerId === null) {
    return false;
  }

  if (currentTimerAdapter && typeof currentTimerAdapter.stop === 'function') {
    currentTimerAdapter.stop(currentGameState.timerId);
  }

  currentGameState.timerId = null;

  return true;
}

function startGameTimer(currentGameState, currentTimerAdapter) {
  if (currentGameState.timerId !== null) {
    return false;
  }

  if (!currentTimerAdapter || typeof currentTimerAdapter.start !== 'function') {
    return false;
  }

  currentGameState.timerId = currentTimerAdapter.start(() => {
    advanceGameTime(currentGameState);
    renderTimerCounter(currentGameState);
  });

  return true;
}

function advanceGameTime(currentGameState) {
  if (currentGameState.status !== GAME_STATUS.PLAYING) {
    return false;
  }

  currentGameState.gameTime += 1;

  return true;
}

function openCell(row, col, field, currentGameState, openCellContext) {
  const currentOpenCellContext = openCellContext || {
    isAnyCellOpened: false,
  };

  if (currentGameState.status !== GAME_STATUS.PLAYING) {
    return currentOpenCellContext.isAnyCellOpened;
  }

  if (!isInBounds(field, row, col)) {
    return currentOpenCellContext.isAnyCellOpened;
  }

  const selectedCell = field[row][col];

  if (
    selectedCell.state === CELL_STATE.OPEN ||
    selectedCell.state === CELL_STATE.FLAGGED
  ) {
    return currentOpenCellContext.isAnyCellOpened;
  }

  selectedCell.state = CELL_STATE.OPEN;
  currentOpenCellContext.isAnyCellOpened = true;

  if (selectedCell.type === CELL_CONTENT.MINE) {
    currentGameState.status = GAME_STATUS.LOST;
    currentGameState.explodedMinePosition = { row, col };
    revealAllMines(field);

    return currentOpenCellContext.isAnyCellOpened;
  }

  if (selectedCell.neighbourMines === 0) {
    for (const [directionalRow, directionalCol] of NEIGHBOUR_DIRECTIONS) {
      openCell(
        row + directionalRow,
        col + directionalCol,
        field,
        currentGameState,
        currentOpenCellContext,
      );
    }
  }

  if (
    currentOpenCellContext.isAnyCellOpened &&
    currentGameState.status === GAME_STATUS.PLAYING
  ) {
    if (checkWinCondition(field, currentGameState.minesCount)) {
      currentGameState.status = GAME_STATUS.WON;
    }
  }

  return currentOpenCellContext.isAnyCellOpened;
}

function toggleFlag(row, col, field, currentGameState) {
  if (currentGameState.status !== GAME_STATUS.PLAYING) {
    return false;
  }

  if (!isInBounds(field, row, col)) {
    return false;
  }

  const selectedCell = field[row][col];

  if (selectedCell.state === CELL_STATE.OPEN) {
    return false;
  }

  if (selectedCell.state === CELL_STATE.CLOSED) {
    if (currentGameState.flagsPlacedCount >= currentGameState.minesCount) {
      return false;
    }

    selectedCell.state = CELL_STATE.FLAGGED;
    currentGameState.flagsPlacedCount += 1;

    return true;
  }

  if (selectedCell.state === CELL_STATE.FLAGGED) {
    selectedCell.state = CELL_STATE.CLOSED;
    currentGameState.flagsPlacedCount -= 1;

    return true;
  }

  return false;
}

function resetGame(
  rows = DEFAULT_GAME_CONFIGURATION.rows,
  cols = DEFAULT_GAME_CONFIGURATION.cols,
  minesCount = DEFAULT_GAME_CONFIGURATION.minesCount,
) {
  const gameState = createInitialGameState(rows, cols, minesCount);
  const gameField = createEmptyField(rows, cols);

  return {
    gameState,
    gameField,
  };
}

function formatCounterValue(value) {
  const normalizedValue = Math.max(0, value);

  return String(normalizedValue).padStart(3, '0');
}

function renderTimerCounter(currentGameState) {
  domElements.timerCounter.textContent = formatCounterValue(currentGameState.gameTime);
}

function renderFlagsCounter(currentGameState) {
  const remainingFlags = currentGameState.minesCount - currentGameState.flagsPlacedCount;

  domElements.flagsCounter.textContent = formatCounterValue(remainingFlags);
}

function getCellClassNames(row, col, currentCell, currentGameState) {
  const classNames = ['board-cell'];

  if (currentCell.state === CELL_STATE.CLOSED) {
    classNames.push('closed');

    return classNames;
  }

  if (currentCell.state === CELL_STATE.FLAGGED) {
    classNames.push('closed', 'flag');

    return classNames;
  }

  classNames.push('open');

  if (currentCell.type === CELL_CONTENT.MINE) {
    const isExplodedMine =
      currentGameState.explodedMinePosition &&
      currentGameState.explodedMinePosition.row === row &&
      currentGameState.explodedMinePosition.col === col;

    classNames.push(isExplodedMine ? 'exploded-bomb' : 'bomb');

    return classNames;
  }

  if (currentCell.neighbourMines > 0) {
    classNames.push(`adjacent-mine-count-${currentCell.neighbourMines}`);
  }

  return classNames;
}

function getCellAriaLabel(currentCell) {
  if (currentCell.state === CELL_STATE.CLOSED) {
    return 'Closed cell';
  }

  if (currentCell.state === CELL_STATE.FLAGGED) {
    return 'Flagged cell';
  }

  if (currentCell.type === CELL_CONTENT.MINE) {
    return 'Opened mine';
  }

  if (currentCell.neighbourMines > 0) {
    return `Opened cell, adjacent mines: ${currentCell.neighbourMines}`;
  }

  return 'Opened empty cell';
}

function renderPlayingField(currentField, currentGameState) {
  const boardFragment = document.createDocumentFragment();

  domElements.playingField.style.gridTemplateColumns = `repeat(${currentGameState.cols}, var(--board-cell-size))`;

  for (let row = 0; row < currentField.length; row += 1) {
    for (let col = 0; col < currentField[row].length; col += 1) {
      const currentCell = currentField[row][col];
      const cellButton = document.createElement('button');

      cellButton.type = 'button';
      cellButton.setAttribute(
        'aria-label',
        `Board cell ${row + 1}-${col + 1}. ${getCellAriaLabel(currentCell)}`,
      );
      cellButton.dataset.row = String(row);
      cellButton.dataset.col = String(col);
      cellButton.className = getCellClassNames(
        row,
        col,
        currentCell,
        currentGameState,
      ).join(' ');

      boardFragment.append(cellButton);
    }
  }

  domElements.playingField.replaceChildren(boardFragment);
}

function updateGameStatusPresentation(currentGameState) {
  if (currentGameState.status === GAME_STATUS.WON) {
    domElements.statusMessage.textContent = UI_TEXT.WON;
    domElements.restartButton.textContent = RESTART_BUTTON_FACE.WON;

    return;
  }

  if (currentGameState.status === GAME_STATUS.LOST) {
    domElements.statusMessage.textContent = UI_TEXT.LOST;
    domElements.restartButton.textContent = RESTART_BUTTON_FACE.LOST;

    return;
  }

  domElements.statusMessage.textContent = UI_TEXT.STARTED;
  domElements.restartButton.textContent = RESTART_BUTTON_FACE.PLAYING;
}

function applyGameEndIfNeeded(currentGameState) {
  if (currentGameState.status === GAME_STATUS.PLAYING) {
    return;
  }

  stopGameTimer(currentGameState, timerAdapter);
}

function renderGame(currentField, currentGameState) {
  renderPlayingField(currentField, currentGameState);
  renderFlagsCounter(currentGameState);
  renderTimerCounter(currentGameState);
  updateGameStatusPresentation(currentGameState);
}

function readCellCoordinatesFromEvent(event) {
  const cellButton = event.target.closest('.board-cell');

  if (!cellButton) {
    return null;
  }

  const row = Number(cellButton.dataset.row);
  const col = Number(cellButton.dataset.col);

  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return null;
  }

  return { row, col };
}

function handleLeftClickOnField(event) {
  const selectedCoordinates = readCellCoordinatesFromEvent(event);

  if (!selectedCoordinates) {
    return;
  }

  const selectedCell = activeGameField[selectedCoordinates.row][selectedCoordinates.col];

  if (
    activeGameState.status === GAME_STATUS.PLAYING &&
    !activeGameState.areMinesPlaced &&
    selectedCell.state === CELL_STATE.CLOSED
  ) {
    placeMinesAvoidingFirstOpen(
      activeGameField,
      activeGameState.minesCount,
      selectedCoordinates.row,
      selectedCoordinates.col,
    );

    activeGameState.areMinesPlaced = true;
    startGameTimer(activeGameState, timerAdapter);
  }

  openCell(
    selectedCoordinates.row,
    selectedCoordinates.col,
    activeGameField,
    activeGameState,
  );

  applyGameEndIfNeeded(activeGameState);
  renderGame(activeGameField, activeGameState);
}

function handleRightClickOnField(event) {
  event.preventDefault();

  const selectedCoordinates = readCellCoordinatesFromEvent(event);

  if (!selectedCoordinates) {
    return;
  }

  const isCellUpdated = toggleFlag(
    selectedCoordinates.row,
    selectedCoordinates.col,
    activeGameField,
    activeGameState,
  );

  if (!isCellUpdated) {
    return;
  }

  renderFlagsCounter(activeGameState);
  renderPlayingField(activeGameField, activeGameState);
}

function startNewGameSession() {
  if (activeGameState) {
    stopGameTimer(activeGameState, timerAdapter);
  }

  const nextGame = resetGame();

  activeGameState = nextGame.gameState;
  activeGameField = nextGame.gameField;

  renderGame(activeGameField, activeGameState);
}

function bindUserEvents() {
  domElements.playingField.addEventListener('click', handleLeftClickOnField);
  domElements.playingField.addEventListener('contextmenu', handleRightClickOnField);
  domElements.restartButton.addEventListener('click', startNewGameSession);
}

function initializeGame() {
  bindUserEvents();
  startNewGameSession();
}

initializeGame();

const minesweeperApi = {
  CELL_CONTENT,
  CELL_STATE,
  GAME_STATUS,
  generateField,
  countNeighbourMines,
  openCell,
  toggleFlag,
  advanceGameTime,
  startGameTimer,
  stopGameTimer,
  resetGame,
};

window.minesweeperApi = minesweeperApi;
