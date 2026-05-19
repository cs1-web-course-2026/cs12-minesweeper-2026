const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
};

const gameState = {
  rows: 9,
  cols: 9,
  minesCount: 10,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: [],
};

const boardElement = document.getElementById('board');
const gameMessageElement = document.getElementById('game-message');
const flagsValueElement = document.getElementById('flags-value');
const timerValueElement = document.getElementById('timer-value');

function generateField(rows, cols, minesCount) {
  const field = [];
  for (let row = 0; row < rows; row++) {
    field[row] = [];
    for (let col = 0; col < cols; col++) {
      field[row][col] = {
        type: CELL_TYPE.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0,
        isHit: false,
      };
    }
  }

  let placed = 0;
  while (placed < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (field[row][col].type !== CELL_TYPE.MINE) {
      field[row][col].type = CELL_TYPE.MINE;
      placed++;
    }
  }

  return field;
}

function countNeighbourMines(field, rows, cols) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (field[row][col].type === CELL_TYPE.MINE) continue;

      let count = 0;
      for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
        for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
          const neighbourRow = row + directionalRow;
          const neighbourCol = col + directionalCol;
          if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
            if (field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) count++;
          }
        }
      }
      field[row][col].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS) return;

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

  cell.state = CELL_STATE.OPENED;

  if (cell.type === CELL_TYPE.MINE) {
    cell.isHit = true;
    gameState.status = GAME_STATUS.LOSE;
    return;
  }

  if (cell.neighborMines === 0) {
    for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
      for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
        const neighbourRow = row + directionalRow;
        const neighbourCol = col + directionalCol;
        if (neighbourRow >= 0 && neighbourRow < gameState.rows && neighbourCol >= 0 && neighbourCol < gameState.cols) {
          if (gameState.field[neighbourRow][neighbourCol].state === CELL_STATE.CLOSED) {
            openCell(neighbourRow, neighbourCol);
          }
        }
      }
    }
  }

  checkWin();
}

function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS) return;

  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPENED) return;

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }
}

function checkWin() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.field[row][col];
      if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) return;
    }
  }
  gameState.status = GAME_STATUS.WIN;
}

function startGame() {
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.timerId = null;
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field, gameState.rows, gameState.cols);
}

function startTimer() {
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    timerValueElement.textContent = String(gameState.gameTime).padStart(3, '0');
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function updateFlagCounter() {
  let flagged = 0;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].state === CELL_STATE.FLAGGED) flagged++;
    }
  }
  flagsValueElement.textContent = String(gameState.minesCount - flagged).padStart(3, '0');
}

function renderField() {
  boardElement.innerHTML = '';

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.field[row][col];
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('cell');

      if (cell.state === CELL_STATE.CLOSED) {
        if (gameState.status === GAME_STATUS.LOSE && cell.type === CELL_TYPE.MINE) {
          button.classList.add('mine');
          button.textContent = '💣';
        } else {
          button.classList.add('closed');
        }
      } else if (cell.state === CELL_STATE.FLAGGED) {
        button.classList.add('flag');
        button.textContent = '🚩';
      } else if (cell.state === CELL_STATE.OPENED) {
        if (cell.type === CELL_TYPE.MINE) {
          if (cell.isHit) {
            button.classList.add('mineHit');
            button.textContent = '💣';
          } else {
            button.classList.add('mine');
            button.textContent = '💣';
          }
        } else {
          button.classList.add('open');
          if (cell.neighborMines > 0) {
            button.classList.add('n' + cell.neighborMines);
            button.textContent = cell.neighborMines;
          }
        }
      }

      button.setAttribute(
        'aria-label',
        `Row ${row + 1}, column ${col + 1}, ${cell.state === CELL_STATE.FLAGGED ? 'flagged' : cell.state}`
      );

      button.addEventListener('click', () => {
        if (gameState.status === GAME_STATUS.PROCESS && gameState.timerId === null) {
          startTimer();
        }
        openCell(row, col);
        if (gameState.status !== GAME_STATUS.PROCESS) stopTimer();
        renderField();
        updateFlagCounter();
      });

      button.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(row, col);
        renderField();
        updateFlagCounter();
      });

      boardElement.appendChild(button);
    }
  }

  if (gameState.status === GAME_STATUS.WIN) {
    gameMessageElement.textContent = '🎉 Ви виграли!';
  } else if (gameState.status === GAME_STATUS.LOSE) {
    gameMessageElement.textContent = '💥 Ви програли!';
  } else {
    gameMessageElement.textContent = '';
  }
}

startGame();
renderField();
updateFlagCounter();

document.querySelector('.restartbtn').addEventListener('click', () => {
  stopTimer();
  startGame();
  renderField();
  updateFlagCounter();
  timerValueElement.textContent = '000';
});