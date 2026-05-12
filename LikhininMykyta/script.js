const GAME_STATUS = {
  PLAYING: 'process',
  WON: 'win',
  LOST: 'lose',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPEN: 'opened',
  FLAGGED: 'flagged',
};

const CELL_CONTENT = {
  MINE: 'mine',
  EMPTY: 'empty',
};

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PLAYING,
  gameTime: 0,
  timerId: null,
  board: [],
};

const boardElement = document.querySelector('.board');
const resetButton = document.querySelector('.reset-button');
const timerElement = document.querySelector('.timer');
const counterElement = document.querySelector('.count');

function generateField(rows, cols, minesCount) {
  gameState.board = [];
  for (let row = 0; row < rows; row++) {
    const newRow = []; // Назвали иначе
    for (let col = 0; col < cols; col++) {
      newRow.push({
        type: CELL_CONTENT.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0,
      });
    }
    gameState.board.push(newRow);
  }
  let placedMines = 0;
  while (placedMines < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (gameState.board[row][col].type !== CELL_CONTENT.MINE) {
      gameState.board[row][col].type = CELL_CONTENT.MINE;
      placedMines++;
    }
  }
}

function countNeighborMines() {
  const { rows, cols, board } = gameState;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].type === CELL_CONTENT.MINE) continue;
      let count = 0;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          const neighborRow = row + rowOffset;
          const neighborCol = col + colOffset;
          if (
            neighborRow >= 0 &&
            neighborRow < rows &&
            neighborCol >= 0 &&
            neighborCol < cols
          ) {
            if (board[neighborRow][neighborCol].type === CELL_CONTENT.MINE) {
              count++;
            }
          }
        }
      }
      board[row][col].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== GAME_STATUS.PLAYING) return;
  const cell = gameState.board[row][col];

  if (cell.state === CELL_STATE.OPEN || cell.state === CELL_STATE.FLAGGED) return;

  if (gameState.gameTime === 0 && !gameState.timerId) {
    startTimer();
  }

  cell.state = CELL_STATE.OPEN;

  if (cell.type === CELL_CONTENT.MINE) {
    gameState.status = GAME_STATUS.LOST;
    stopTimer();
    revealAllMines(row, col);
    renderBoard();
    resetButton.textContent = '😵';
    return;
  }

  if (cell.neighborMines === 0) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        const neighborRow = row + rowOffset;
        const neighborCol = col + colOffset;
        if (
          neighborRow >= 0 &&
          neighborRow < gameState.rows &&
          neighborCol >= 0 &&
          neighborCol < gameState.cols
        ) {
          openCell(neighborRow, neighborCol);
        }
      }
    }
  }
  checkWin();
  renderBoard();
}

function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PLAYING) return;
  const cell = gameState.board[row][col];
  if (cell.state === CELL_STATE.OPEN) return;
  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }
  updateMinesCounter();
  renderBoard();
}

function startTimer() {
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function checkWin() {
  let closedEmptyCells = 0;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.board[row][col];
      if (cell.type !== CELL_CONTENT.MINE && cell.state !== CELL_STATE.OPEN) {
        closedEmptyCells++;
      }
    }
  }
  if (closedEmptyCells === 0) {
    gameState.status = GAME_STATUS.WON;
    stopTimer();
    resetButton.textContent = '😎';
  }
}

function initGame() {
  stopTimer();
  gameState.status = GAME_STATUS.PLAYING;
  gameState.gameTime = 0;
  resetButton.textContent = '🙂';
  updateTimerDisplay();
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighborMines();
  updateMinesCounter();
  renderBoard();
}

function renderBoard() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 20px)`;
  boardElement.style.gridTemplateRows = `repeat(${gameState.rows}, 20px)`;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cellData = gameState.board[row][col];
      const cellDiv = document.createElement('button');
      cellDiv.type = 'button';
      cellDiv.setAttribute(
        'aria-label',
        `Row ${row + 1}, column ${col + 1}, closed`,
      );
      cellDiv.classList.add('cell');
      if (cellData.state === CELL_STATE.OPEN) {
        cellDiv.classList.add('open');
        if (cellData.type === CELL_CONTENT.MINE){
          cellDiv.classList.add("mine-exploded");
          cellDiv.textContent = '💣';
        } else if (cellData.neighborMines > 0) {
          cellDiv.textContent=cellData.neighborMines;
          cellDiv.setAttribute('data-mines', cellData.neighborMines);
        }
      }else if (cellData.state === CELL_STATE.FLAGGED) {
        cellDiv.classList.add(CELL_STATE.FLAGGED);
        cellDiv.textContent = '🚩';
        if (gameState.status === GAME_STATUS.LOST && cellData.type !== CELL_CONTENT.MINE) {
          cellDiv.classList.add('flag-incorrect');
          cellDiv.innerHTML = '<span class="mine-icon">💣</span><span class="cross-icon">❌</span>';
        }
      }else if (gameState.status === GAME_STATUS.LOST && cellData.type === CELL_CONTENT.MINE) {
        cellDiv.classList.add('open', 'mine');
        cellDiv.textContent = '💣';
      }
      cellDiv.addEventListener('click', () =>openCell(row, col));
      cellDiv.addEventListener('contextmenu', (e)=>{
        e.preventDefault();
        toggleFlag(row, col);
      });
      boardElement.appendChild(cellDiv);
    }
  }
}

function revealAllMines(explodedRow, explodedCol) {
  for (const row of gameState.board) {
    for (const cell of row) {
      if (cell.type === CELL_CONTENT.MINE) {
        cell.state = CELL_STATE.OPEN;
      }
    }
  }
}

function updateTimerDisplay() {
  const timeStr=gameState.gameTime.toString().padStart(3, '0');
  timerElement.textContent = timeStr;
}

function updateMinesCounter() {
  let flags=0
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.board[row][col].state === CELL_STATE.FLAGGED) flags++;
    }
  }
  const reminingMines=gameState.minesCount-flags;
  counterElement.textContent = reminingMines;
}

resetButton.addEventListener('click', initGame);
initGame();
