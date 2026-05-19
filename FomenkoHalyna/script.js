/**
 * КОНСТАНТИ (Enums)
 */
const CELL_CONTENT = {
  MINE: 'mine',
  EMPTY: 'empty',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const TIMER_INTERVAL = 1000;

/**
 * НАЛАШТУВАННЯ
 */
const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_MINES_COUNT = 15;

const gameState = {
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  minesCount: DEFAULT_MINES_COUNT,
  status: GAME_STATUS.IDLE,
  gameTime: 0,
  timerId: null,
  field: [],
  flagsCount: 0,
};

/**
 * ЛОГІКА ГЕНЕРАЦІЇ (Pure Function)
 */
function generateField(rows, cols, minesCount) {
  const field = [];
  for (let row = 0; row < rows; row++) {
    const currentRow = [];
    for (let col = 0; col < cols; col++) {
      currentRow.push({
        type: CELL_CONTENT.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0,
        row: row,
        col: col,
      });
    }
    field.push(currentRow);
  }

  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);
    if (field[randomRow][randomCol].type !== CELL_CONTENT.MINE) {
      field[randomRow][randomCol].type = CELL_CONTENT.MINE;
      minesPlaced++;
    }
  }

  calculateAllNeighbors(field, rows, cols);
  return field;
}

function calculateAllNeighbors(field, rows, cols) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (field[row][col].type === CELL_CONTENT.MINE) continue;
      const neighbors = getNeighbors(field, rows, cols, row, col);
      field[row][col].neighborMines = neighbors.filter(
        (n) => n.type === CELL_CONTENT.MINE,
      ).length;
    }
  }
}

function getNeighbors(field, rows, cols, row, col) {
  const neighbors = [];
  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      if (dRow === 0 && dCol === 0) continue;
      const nRow = row + dRow;
      const nCol = col + dCol;
      if (nRow >= 0 && nRow < rows && nCol >= 0 && nCol < cols) {
        neighbors.push(field[nRow][nCol]);
      }
    }
  }
  return neighbors;
}

/**
 * УПРАВЛІННЯ DOM (Рендеринг)
 */
function renderField() {
  const gridElement = document.getElementById('game-grid');
  gridElement.innerHTML = '';

  gridElement.style.gridTemplateRows = `repeat(${gameState.rows}, 1fr)`;
  gridElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cellData = gameState.field[row][col];
      const cellButton = document.createElement('button');

      cellButton.type = 'button';
      cellButton.classList.add('cell');
      cellButton.dataset.row = row;
      cellButton.dataset.col = col;

      if (cellData.state === CELL_STATE.OPENED) {
        cellButton.classList.add('opened');
        if (cellData.type === CELL_CONTENT.MINE) {
          cellButton.textContent = '💣';
          cellButton.classList.add('mine');
        } else if (cellData.neighborMines > 0) {
          cellButton.textContent = cellData.neighborMines;
          cellButton.classList.add(`number-${cellData.neighborMines}`);
        }
      } else if (cellData.state === CELL_STATE.FLAGGED) {
        cellButton.textContent = '🚩';
        cellButton.classList.add('flagged');
      }

      cellButton.addEventListener('click', handleCellClick);
      cellButton.addEventListener('contextmenu', handleCellContextMenu);

      gridElement.appendChild(cellButton);
    }
  }
  updateCounters();
}

function updateCounters() {
  const timerElement = document.getElementById('timer');
  const mineCounterElement = document.getElementById('mine-counter');
  const resetBtn = document.getElementById('reset-btn');

  timerElement.textContent = String(gameState.gameTime).padStart(3, '0');

  const remainingMines = gameState.minesCount - gameState.flagsCount;
  mineCounterElement.textContent = String(Math.max(0, remainingMines)).padStart(
    3,
    '0',
  );

  if (gameState.status === GAME_STATUS.WON) {
    resetBtn.textContent = '😎';
  } else if (gameState.status === GAME_STATUS.LOST) {
    resetBtn.textContent = '😵';
  } else {
    resetBtn.textContent = '😊';
  }
}

/**
 * ОБРОБНИКИ ПОДІЙ
 */
function handleCellClick(event) {
  const row = parseInt(event.currentTarget.dataset.row);
  const col = parseInt(event.currentTarget.dataset.col);

  openCell(row, col);
  renderField();
}

function handleCellContextMenu(event) {
  event.preventDefault();

  if (
    gameState.status === GAME_STATUS.LOST ||
    gameState.status === GAME_STATUS.WON
  )
    return;

  const row = parseInt(event.currentTarget.dataset.row);
  const col = parseInt(event.currentTarget.dataset.col);
  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsCount++;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsCount--;
  }

  renderField();
}

/**
 * ІГРОВА ЛОГІКА
 */
function openCell(row, col) {
  if (
    gameState.status === GAME_STATUS.LOST ||
    gameState.status === GAME_STATUS.WON
  )
    return;

  if (gameState.status === GAME_STATUS.IDLE) {
    gameState.status = GAME_STATUS.PLAYING;
    startTimer();
  }

  const cell = gameState.field[row][col];
  if (cell.state !== CELL_STATE.CLOSED) return;

  cell.state = CELL_STATE.OPENED;

  if (cell.type === CELL_CONTENT.MINE) {
    endGame(GAME_STATUS.LOST);
    revealAllMines();
    return;
  }

  if (cell.neighborMines === 0) {
    const neighbors = getNeighbors(
      gameState.field,
      gameState.rows,
      gameState.cols,
      row,
      col,
    );
    neighbors.forEach((n) => {
      if (n.state === CELL_STATE.CLOSED) {
        openCell(n.row, n.col);
      }
    });
  }
  checkWin();
}

function revealAllMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === CELL_CONTENT.MINE) {
        gameState.field[row][col].state = CELL_STATE.OPENED;
      }
    }
  }
}

function startTimer() {
  if (gameState.timerId) clearInterval(gameState.timerId);
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateCounters();
  }, TIMER_INTERVAL);
}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function endGame(result) {
  gameState.status = result;
  stopTimer();
}

function checkWin() {
  const allCells = gameState.field.flat();
  const isWin = allCells
    .filter((c) => c.type === CELL_CONTENT.EMPTY)
    .every((c) => c.state === CELL_STATE.OPENED);

  if (isWin) endGame(GAME_STATUS.WON);
}

/**
 * ІНІЦІАЛІЗАЦІЯ
 */
function initGame() {
  stopTimer();
  gameState.status = GAME_STATUS.IDLE;
  gameState.gameTime = 0;
  gameState.flagsCount = 0;
  gameState.field = generateField(
    gameState.rows,
    gameState.cols,
    gameState.minesCount,
  );
  renderField();
}

document.getElementById('reset-btn').addEventListener('click', initGame);

initGame();
