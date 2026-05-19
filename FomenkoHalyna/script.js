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

const NEIGHBOR_OFFSET_START = -1;
const NEIGHBOR_OFFSET_END = 1;


    MINE: 'mine',
    EMPTY: 'empty'
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const GAME_STATUS = {
    IDLE: 'idle',
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};


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

    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    minesCount: DEFAULT_MINES_COUNT,
    status: GAME_STATUS.IDLE,
    gameTime: 0,
    timerId: null,
    field: []
};

/**
 * ЛОГІКА ГЕНЕРАЦІЇ - Тепер функція чиста
 */
function generateField(rows, cols, minesCount) {
    const field = [];

    // 1. Створення порожнього поля
    for (let row = 0; row < rows; row++) {
        const currentRow = [];
        for (let col = 0; col < cols; col++) {
            currentRow.push({
                type: CELL_CONTENT.EMPTY,
                state: CELL_STATE.CLOSED,
                neighborMines: 0,
                row: row,
                col: col
            });
        }
        field.push(currentRow);

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

  countNeighbourMines(field, rows, cols);
  return field;
}

function countNeighbourMines(field, rows, cols) {
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
  for (let dRow = NEIGHBOR_OFFSET_START; dRow <= NEIGHBOR_OFFSET_END; dRow++) {
    for (
      let dCol = NEIGHBOR_OFFSET_START;
      dCol <= NEIGHBOR_OFFSET_END;
      dCol++
    ) {
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
  if (!gridElement) return;

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

      // ВИПРАВЛЕНО: Синхронізація назв класів із CSS (open, flag, n1, n2...) та додавання стилів
      if (cellData.state === CELL_STATE.OPENED) {
        cellButton.classList.add('open');
        if (cellData.type === CELL_CONTENT.MINE) {
          cellButton.classList.add('mine');
        } else if (cellData.neighborMines > 0) {
          cellButton.classList.add(`n${cellData.neighborMines}`);
          cellButton.textContent = cellData.neighborMines;

    // 2. Розстановка мін
    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (field[randomRow][randomCol].type !== CELL_CONTENT.MINE) {
            field[randomRow][randomCol].type = CELL_CONTENT.MINE;
            minesPlaced++;
        }
    }

    // 3. Підрахунок сусідів внутрішнім викликом (чистота)
    // Ми викликаємо підрахунок відразу тут, щоб повернути готове поле
    calculateAllNeighbors(field, rows, cols);

    return field; 
}

/**
 * Допоміжна функція для підрахунку (Helper)
 */
function calculateAllNeighbors(field, rows, cols) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (field[row][col].type === CELL_CONTENT.MINE) continue;
            
            const neighbors = getNeighbors(field, rows, cols, row, col);
            field[row][col].neighborMines = neighbors.filter(n => n.type === CELL_CONTENT.MINE).length;
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
      } else if (cellData.state === CELL_STATE.FLAGGED) {
        cellButton.classList.add('flag');
      }

      // ВИПРАВЛЕНО: Генерація динамічного aria-label для доступності (Accessibility)
      let cellLabel = `Рядок ${row + 1}, стовпець ${col + 1}, закрита`;
      if (cellData.state === CELL_STATE.FLAGGED) {
        cellLabel = `Рядок ${row + 1}, стовпець ${col + 1}, прапорець`;
      } else if (
        cellData.state === CELL_STATE.OPENED &&
        cellData.type === CELL_CONTENT.MINE
      ) {
        cellLabel = `Рядок ${row + 1}, стовпець ${col + 1}, міна`;
      } else if (
        cellData.state === CELL_STATE.OPENED &&
        cellData.neighborMines > 0
      ) {
        cellLabel = `Рядок ${row + 1}, стовпець ${col + 1}, ${cellData.neighborMines} мін поруч`;
      } else if (cellData.state === CELL_STATE.OPENED) {
        cellLabel = `Рядок ${row + 1}, стовпець ${col + 1}, порожня`;
      }
      cellButton.setAttribute('aria-label', cellLabel);

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
  const messageElement = document.getElementById('game-message');

  if (timerElement) {
    timerElement.textContent = String(gameState.gameTime).padStart(3, '0');
  }

  const remainingMines = gameState.minesCount - gameState.flagsCount;
  if (mineCounterElement) {
    mineCounterElement.textContent = String(
      Math.max(0, remainingMines),
    ).padStart(3, '0');
  }

  if (resetBtn) {
    if (gameState.status === GAME_STATUS.WON) {
      resetBtn.textContent = '😎';
    } else if (gameState.status === GAME_STATUS.LOST) {
      resetBtn.textContent = '😵';
    } else {
      resetBtn.textContent = '😊';
    }
  }

  // ВИПРАВЛЕНО: Оновлення тексту повідомлення про статус гри
  if (messageElement) {
    if (gameState.status === GAME_STATUS.WON) {
      messageElement.textContent = 'Ви виграли!';
    } else if (gameState.status === GAME_STATUS.LOST) {
      messageElement.textContent = 'Гра закінчена. Ви підірвалися на міні.';
    } else {
      messageElement.textContent = '';
    }
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

/**
 * ІГРОВІ ДІЇ
 */
function openCell(row, col) {
    if (gameState.status === GAME_STATUS.IDLE) {
        gameState.status = GAME_STATUS.PLAYING;
        startTimer();
    }

    const cell = gameState.field[row][col];
    if (cell.state !== CELL_STATE.CLOSED || gameState.status !== GAME_STATUS.PLAYING) return;

    if (cell.type === CELL_CONTENT.MINE) {
        cell.state = CELL_STATE.OPENED;
        endGame(GAME_STATUS.LOST);
        return;
    }

    cell.state = CELL_STATE.OPENED;

    if (cell.neighborMines === 0) {
        const neighbors = getNeighbors(gameState.field, gameState.rows, gameState.cols, row, col);
        neighbors.forEach(n => {
            if (n.state === CELL_STATE.CLOSED) {
                openCell(n.row, n.col);
            }
        });
    }
    checkWin();
}

function startTimer() {
    if (gameState.timerId) clearInterval(gameState.timerId);
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
    }, 1000);

}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function endGame(result) {

  gameState.status = result;
  stopTimer();
  updateCounters();
}

function checkWin() {
  if (!gameState.field || gameState.field.length === 0) return;

  const allCells = gameState.field.flat();
  const isWin = allCells
    .filter((c) => c.type !== CELL_CONTENT.MINE)
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

const resetBtnElement = document.getElementById('reset-btn');
if (resetBtnElement) {
  resetBtnElement.addEventListener('click', initGame);
}

initGame();

    gameState.status = result;
    stopTimer();
}

function checkWin() {
    const allCells = gameState.field.flat();
    const isWin = allCells.filter(c => c.type === CELL_CONTENT.EMPTY).every(c => c.state === CELL_STATE.OPENED);
    if (isWin) endGame(GAME_STATUS.WON);
}

// ІНІЦІАЛІЗАЦІЯ (Caller)
// Саме тут ми присвоюємо результат функції в gameState.field
gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

