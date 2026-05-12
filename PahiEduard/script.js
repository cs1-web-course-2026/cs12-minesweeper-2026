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
};

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

function openCell(field, rows, cols, row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS) return;

  const cell = field[row][col];

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
        if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
          if (field[neighbourRow][neighbourCol].state === CELL_STATE.CLOSED) {
            openCell(field, rows, cols, neighbourRow, neighbourCol);
          }
        }
      }
    }
  }

  checkWin(field, rows, cols);
}

function toggleFlag(field, row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS) return;

  const cell = field[row][col];
  if (cell.state === CELL_STATE.OPENED) return;

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }
}

function checkWin(field, rows, cols) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = field[row][col];
      if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) return;
    }
  }
  gameState.status = GAME_STATUS.WIN;
}

function startGame() {
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.timerId = null;

  const field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(field, gameState.rows, gameState.cols);

  return field;
}


function startTimer() {
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    document.getElementById('timer-value').textContent =
      String(gameState.gameTime).padStart(3, '0');
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function updateFlagCounter(field) {
  let flagged = 0;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (field[row][col].state === CELL_STATE.FLAGGED) flagged++;
    }
  }
  document.getElementById('flags-value').textContent =
    String(gameState.minesCount - flagged).padStart(3, '0');
}

function renderField(field) {
  const board = document.getElementById('board');
  board.innerHTML = '';

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = field[row][col];
      const div = document.createElement('div');
      div.classList.add('cell');

      if (cell.state === CELL_STATE.CLOSED) {
        if (gameState.status === GAME_STATUS.LOSE && cell.type === CELL_TYPE.MINE) {
          div.classList.add('mine');
          div.textContent = '💣';
        } else {
          div.classList.add('closed');
        }
      } else if (cell.state === CELL_STATE.FLAGGED) {
        div.classList.add('flag');
        div.textContent = '🚩';
      } else if (cell.state === CELL_STATE.OPENED) {
        if (cell.type === CELL_TYPE.MINE) {
          if (cell.isHit) {
            div.classList.add('mineHit');
            div.textContent = '💣';
          } else {
            div.classList.add('mine');
            div.textContent = '💣';
          }
        } else {
          div.classList.add('open');
          if (cell.neighborMines > 0) {
            div.classList.add('n' + cell.neighborMines);
            div.textContent = cell.neighborMines;
          }
        }
      }

      div.addEventListener('click', () => {
        if (gameState.status === GAME_STATUS.PROCESS && gameState.timerId === null) {
          startTimer();
        }
        openCell(field, gameState.rows, gameState.cols, row, col);
        if (gameState.status !== GAME_STATUS.PROCESS) stopTimer();
        renderField(field);
        updateFlagCounter(field);
      });

      div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(field, row, col);
        renderField(field);
        updateFlagCounter(field);
      });

      board.appendChild(div);
    }
  }

  const message = document.getElementById('game-message');
  if (gameState.status === GAME_STATUS.WIN) {
    message.textContent = '🎉 Ви виграли!';
  } else if (gameState.status === GAME_STATUS.LOSE) {
    message.textContent = '💥 Ви програли!';
  } else {
    message.textContent = '';
  }
}

let currentField = startGame();
renderField(currentField);
updateFlagCounter(currentField);

document.querySelector('.restartbtn').addEventListener('click', () => {
  stopTimer();
  currentField = startGame();
  renderField(currentField);
  updateFlagCounter(currentField);
  document.getElementById('timer-value').textContent = '000';
});