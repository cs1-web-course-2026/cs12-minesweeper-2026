import { gameState } from './state.js';

export function generateField() {
  const { rows, cols, minesCount } = gameState;
  const grid = [];

  // Ініціалізація сітки
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        state: 'closed', // 'closed' | 'open' | 'flagged'
        neighborMines: 0
      });
    }
    grid.push(row);
  }

  // Випадкова розстановка мін
  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (grid[r][c].type !== 'mine') {
      grid[r][c].type = 'mine';
      minesPlaced++;
    }
  }

  gameState.grid = grid;
  countNeighbourMines();
}

function countNeighbourMines() {
  const { rows, cols, grid } = gameState;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === 'mine') continue;

      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (grid[nr][nc].type === 'mine') count++;
          }
        }
      }
      grid[r][c].neighborMines = count;
    }
  }
}

export function openCell(row, col) {
  if (gameState.status !== 'process') return;
  
  const cell = gameState.grid[row][col];
  if (cell.state !== 'closed') return;

  // Логіка поразки
  if (cell.type === 'mine') {
    cell.state = 'open';
    gameState.explodedCell = { row, col };
    endGame('lose');
    return;
  }

  cell.state = 'open';

  // Рекурсивне відкриття сусідів (Flood Fill)
  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          openCell(nr, nc);
        }
      }
    }
  }

  checkWinCondition();
}

export function toggleFlag(row, col) {
  if (gameState.status !== 'process') return;

  const cell = gameState.grid[row][col];
  if (cell.state === 'closed') {
    cell.state = 'flagged';
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
  }
}

function checkWinCondition() {
  const { rows, cols, grid } = gameState;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type !== 'mine' && grid[r][c].state !== 'open') {
        return;
      }
    }
  }
  endGame('win');
}

function endGame(status) {
  gameState.status = status;
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}