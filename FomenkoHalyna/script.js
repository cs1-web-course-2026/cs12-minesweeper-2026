/**
 * 1. Моделювання даних (Data Layer)
 */
var gameInterval;

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process', // 'process' | 'win' | 'lose'
  gameTime: 0,
  timerId: null,
  field: [],
};

/**
 * 2. Генерація поля та мін
 */
function generateField(rows, cols, minesCount) {
  gameState.field = [];
  gameState.gameTime = 0;
  gameState.status = 'process';
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;

  stopTimer();

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        state: 'closed', // 'closed', 'opened', 'flagged'
        neighborMines: 0,
        row: r,
        col: c,
      });
    }
    gameState.field.push(row);
  }

  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (gameState.field[r][c].type !== 'mine') {
      gameState.field[r][c].type = 'mine';
      minesPlaced++;
    }
  }

  countNeighbourMines();
}

/**
 * 3. Логіка гри (Business Logic)
 */
function getNeighbors(r, c) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
        neighbors.push(gameState.field[nr][nc]);
      }
    }
  }
  return neighbors;
}

function countNeighbourMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === 'mine') continue;
      const neighbors = getNeighbors(r, c);
      gameState.field[r][c].neighborMines = neighbors.filter(
        (n) => n.type === 'mine',
      ).length;
    }
  }
}

// Відкриття клітинки
function openCell(r, c) {
  const cell = gameState.field[r][c];
  if (cell.state !== 'closed' || gameState.status !== 'process') return;

  startTimer();

  if (cell.type === 'mine') {
    cell.state = 'opened';
    endGame('lose');
  } else {
    cell.state = 'opened';
    if (cell.neighborMines === 0) {
      const neighbors = getNeighbors(r, c);
      neighbors.forEach((n) => openCell(n.row, n.col));
    }
    checkWin();
  }
  renderField();
}

// Прапорці (права кнопка миші)
function toggleFlag(e, r, c) {
  e.preventDefault();
  const cell = gameState.field[r][c];
  if (gameState.status !== 'process' || cell.state === 'opened') return;

  cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
  renderField();
  updateInterface();
}

/**
 * 4. Таймер та Інтерфейс
 */
function startTimer() {
  if (gameState.timerId) return;
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateInterface();
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function updateInterface() {
  const timerElement = document.getElementById('timer');
  const minesCountElement = document.getElementById('mines-count');

  if (timerElement) {
    timerElement.innerText = String(gameState.gameTime).padStart(3, '0');
  }

  if (minesCountElement) {
    const flaggedCount = gameState.field
      .flat()
      .filter((c) => c.state === 'flagged').length;
    const remainingMines = gameState.minesCount - flaggedCount;
    minesCountElement.innerText = String(Math.max(0, remainingMines)).padStart(
      3,
      '0',
    );
  }
}

function renderField() {
  const gridElement = document.querySelector('.game-grid');
  if (!gridElement) return;

  gridElement.innerHTML = '';

  gameState.field.forEach((row, r) => {
    row.forEach((cell, c) => {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');

      // Прив'язка подій миші
      cellElement.onclick = () => openCell(r, c);
      cellElement.oncontextmenu = (e) => toggleFlag(e, r, c);

      if (cell.state === 'opened') {
        cellElement.classList.add('open');
        if (cell.type === 'mine') {
          cellElement.innerText = '💣';
          cellElement.classList.add('mine');
        } else if (cell.neighborMines > 0) {
          cellElement.innerText = cell.neighborMines;
          cellElement.classList.add(`n${cell.neighborMines}`);
        }
      } else if (cell.state === 'flagged') {
        cellElement.innerText = '🚩';
      }
      gridElement.appendChild(cellElement);
    });
  });
}

/**
 * 5. Стани завершення гри
 */
function checkWin() {
  const allCells = gameState.field.flat();
  const isWin = allCells
    .filter((c) => c.type === 'empty')
    .every((c) => c.state === 'opened');
  if (isWin) endGame('win');
}

function endGame(result) {
  gameState.status = result;
  stopTimer();

  const restartBtn = document.querySelector('.reset-button');

  if (result === 'lose') {
    if (restartBtn) restartBtn.innerText = '😵'; // Зміна смайлика при програші
    // Відкриваємо всі міни на полі
    gameState.field.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === 'mine') cell.state = 'opened';
      });
    });
  } else if (result === 'win') {
    if (restartBtn) restartBtn.innerText = '😎'; // Зміна смайлика при перемозі
  }

  renderField();

  setTimeout(() => {
    alert(result === 'win' ? 'Ви перемогли! 🎉' : 'Бум! Гра закінчена. 💣');
  }, 100);
}

// Функція Рестарту
function restartGame() {
  const restartBtn = document.querySelector('.reset-button');
  if (restartBtn) restartBtn.innerText = '😊'; // Повертаємо початковий смайлик

  generateField(gameState.rows, gameState.cols, gameState.minesCount); //
  renderField();
  updateInterface(); //
}

/**
 * Ініціалізація подій
 */
const restartBtn = document.querySelector('.reset-button');
if (restartBtn) {
  restartBtn.addEventListener('click', restartGame);
}

// Заборона виклику меню на ігровому полі
document
  .querySelector('.game-grid')
  .addEventListener('contextmenu', (e) => e.preventDefault());

// Початковий запуск гри
restartGame();
