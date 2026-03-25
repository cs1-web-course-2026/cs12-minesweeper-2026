const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
  board: [],
};
function generateField(rows, cols, minesCount) {
  gameState.board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        state: 'closed',
        neighborMines: 0,
      });
    }
    gameState.board.push(row);
  }
  let placedMines = 0;
  while (placedMines < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (gameState.board[r][c].type !== 'mine') {
      gameState.board[r][c].type = 'mine';
      placedMines++;
    }
  }
}
function countNeighborMines() {
  const { rows, cols, board } = gameState;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].type === 'mine') continue;
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const neighborRow = r + i;
          const neighborCol = c + j;
          if (
            neighborRow >= 0 &&
            neighborRow < rows &&
            neighborCol >= 0 &&
            neighborCol < cols
          ) {
            if (board[neighborRow][neighborCol].type === 'mine') {
              count++;
            }
          }
        }
      }
      board[r][c].neighborMines = count;
    }
  }
}
function openCell(r, c) {
  if (gameState.status !== 'process') return;
  const cell = gameState.board[r][c];
  if (cell.state === 'opened' || cell.state === 'flagged') return;
  if (gameState.gameTime === 0 && !gameState.timerId) {
    startTimer();
  }
  cell.state = 'opened';
  if (cell.type === 'mine') {
    gameState.status = 'lose';
    stopTimer();
    revealAllMines(r, c);
    renderBoard();
    document.querySelector('.reset-button').textContent = '😵';
    return;
  }
  if (cell.neighborMines === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const neighborRow = r + i;
        const neighborCol = c + j;
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
function toggleFlag(r, c) {
  if (gameState.status !== 'process') return;
  const cell = gameState.board[r][c];
  if (cell.state === 'opened') return;
  if (cell.state === 'closed') {
    cell.state = 'flagged';
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
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
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.board[r][c];
      if (cell.type === 'empty' && cell.state !== 'opened') {
        closedEmptyCells++;
      }
    }
  }
  if (closedEmptyCells === 0) {
    gameState.status = 'win';
    stopTimer();
    document.querySelector('.reset-button').textContent = '😎';
  }
}
function initGame() {
  stopTimer();
  gameState.status = 'process';
  gameState.gameTime = 0;
  document.querySelector('.reset-button').textContent = '🙂';
  updateTimerDisplay();
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighborMines();
  updateMinesCounter();
  renderBoard();
}
function renderBoard() {
  const boardElement=document.querySelector('.board');
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 20px)`;
  boardElement.style.gridTemplateRows = `repeat(${gameState.rows}, 20px)`;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cellData = gameState.board[r][c];
      const cellDiv = document.createElement('div');
      cellDiv.classList.add('cell');
      if (cellData.state === 'opened') {
        cellDiv.classList.add('open');
        if (cellData.type === "mine"){
          cellDiv.classList.add("mine-exploded");
          cellDiv.textContent = '💣';
        } else if (cellData.neighborMines > 0) {
          cellDiv.textContent=cellData.neighborMines;
          cellDiv.setAttribute('data-mines', cellData.neighborMines);
        }
      }else if (cellData.state === "flagged"){
        cellDiv.classList.add('flagged');
        cellDiv.textContent = '🚩';
        if (gameState.status === "lose" && cellData.type !== 'mine') {
          cellDiv.classList.add('flag-incorrect');
          cellDiv.innerHTML = '<span class="mine-icon">💣</span><span class="cross-icon">❌</span>';
        }
      }else if (gameState.status === 'lose' && cellData.type === 'mine'){
        cellDiv.classList.add('open', 'mine')
        cellDiv.textContent = '💣';
      }
      cellDiv.addEventListener('click', () =>openCell(r, c));
      cellDiv.addEventListener('contextmenu', (e)=>{
        e.preventDefault();
        toggleFlag(r, c);
      });
      boardElement.appendChild(cellDiv);
    }
  }
}
function revealAllMines(explodedRow, explodedCol) {
}
function updateTimerDisplay() {
  const timeStr=gameState.gameTime.toString().padStart(3, '0');
  document.querySelector(".timer").textContent = timeStr;
}
function updateMinesCounter() {
  let flags=0
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.board[r][c].state === 'flagged') flags++;
    }
  }
  const reminingMines=gameState.minesCount-flags;
  document.querySelector(".count").textContent = reminingMines.toString().padStart(3, '0');
}
document.querySelector(".reset-button").addEventListener('click', initGame);
initGame();