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
    closedCellsCount: rows * cols,
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
  return (
    Array.isArray(field) &&
    field.length > 0 &&
    row >= 0 &&
    row < field.length &&
    col >= 0 &&
    col < field[row].length
  );
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

        if (isInBounds(field, neighbourRow, neighbourCol) && field[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE) {
          neighbourMinesCount += 1;
        }
      }

      currentCell.neighbourMines = neighbourMinesCount;
    }
  }

  return field;
}

function assignMines(field, availableCoordinates, minesCount) {
  for (let index = availableCoordinates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryCoordinate = availableCoordinates[index];

    availableCoordinates[index] = availableCoordinates[randomIndex];
    availableCoordinates[randomIndex] = temporaryCoordinate;
  }

  for (let mineIndex = 0; mineIndex < minesCount; mineIndex += 1) {
    const mineCoordinate = availableCoordinates[mineIndex];

    field[mineCoordinate.row][mineCoordinate.col].type = CELL_CONTENT.MINE;
  }

  countNeighbourMines(field);
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

  assignMines(field, coordinates, minesCount);

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

  assignMines(field, candidateCoordinates, minesCount);

  return field;
}

function revealAllMines(field) {
  for (let row = 0; row < field.length; row += 1) {
    for (let col = 0; col < field[row].length; col += 1) {
      const currentCell = field[row][col];
      if (currentCell.type === CELL_CONTENT.MINE) {
        currentCell.state = CELL_STATE.OPEN;
      }
    }
  }

  return field;
}

function checkWinCondition(currentGameState) {
  const safeCellsCount = currentGameState.rows * currentGameState.cols - currentGameState.minesCount;

  return currentGameState.closedCellsCount === 0 && safeCellsCount > 0;
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
  const context = openCellContext || { isAnyCellOpened: false };

  if (currentGameState.status !== GAME_STATUS.PLAYING || !isInBounds(field, row, col)) {
    return context.isAnyCellOpened;
  }

  const selectedCell = field[row][col];

  if (selectedCell.state !== CELL_STATE.CLOSED) {
    return context.isAnyCellOpened;
  }

  selectedCell.state = CELL_STATE.OPEN;
  currentGameState.closedCellsCount -= 1;
  context.isAnyCellOpened = true;

  if (selectedCell.type === CELL_CONTENT.MINE) {
    currentGameState.status = GAME_STATUS.LOST;
    currentGameState.explodedMinePosition = { row, col };
    revealAllMines(field);
    return context.isAnyCellOpened;
  }

  if (selectedCell.neighbourMines === 0) {
    for (const [directionalRow, directionalCol] of NEIGHBOUR_DIRECTIONS) {
      openCell(row + directionalRow, col + directionalCol, field, currentGameState, context);
    }
  }

  return context.isAnyCellOpened;
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
  if (currentCell.state === CELL_STATE.CLOSED) {
    return ['board-cell', 'closed'];
  }

  if (currentCell.state === CELL_STATE.FLAGGED) {
    return ['board-cell', 'closed', 'flag'];
  }

  const classNames = ['board-cell', 'open'];

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
  if (currentCell.state === CELL_STATE.CLOSED) return 'Закрита клітинка';
  if (currentCell.state === CELL_STATE.FLAGGED) return 'Клітинка з прапорцем';
  if (currentCell.type === CELL_CONTENT.MINE) return 'Відкрита міна';
  return currentCell.neighbourMines > 0
    ? `Відкрита клітинка, сусідніх мін: ${currentCell.neighbourMines}`
    : 'Відкрита порожня клітинка';
}

function updateBoardCellClasses(currentField, currentGameState) {
  const allCellButtons = domElements.playingField.querySelectorAll('.board-cell');

  for (const cellButton of allCellButtons) {
    const row = Number(cellButton.dataset.row);
    const col = Number(cellButton.dataset.col);

    if (isInBounds(currentField, row, col)) {
      const currentCell = currentField[row][col];
      cellButton.className = getCellClassNames(row, col, currentCell, currentGameState).join(' ');
    }
  }
}

function renderPlayingField(currentField, currentGameState) {
  domElements.playingField.style.gridTemplateColumns = `repeat(${currentGameState.cols}, var(--board-cell-size))`;
  const boardFragment = document.createDocumentFragment();

  for (let row = 0; row < currentField.length; row += 1) {
    for (let col = 0; col < currentField[row].length; col += 1) {
      const cellButton = document.createElement('button');
      const currentCell = currentField[row][col];

      cellButton.type = 'button';
      cellButton.dataset.row = String(row);
      cellButton.dataset.col = String(col);
      cellButton.className = getCellClassNames(row, col, currentCell, currentGameState).join(' ');
      cellButton.setAttribute('aria-label', `Клітинка ${row + 1}-${col + 1}. ${getCellAriaLabel(currentCell)}`);

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

  domElements.statusMessage.textContent = '';
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

  if (
    activeGameState.status === GAME_STATUS.PLAYING &&
    checkWinCondition(activeGameState)
  ) {
    activeGameState.status = GAME_STATUS.WON;
  }

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
  updateBoardCellClasses(activeGameField, activeGameState);
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
